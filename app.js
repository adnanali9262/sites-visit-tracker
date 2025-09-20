let sites = JSON.parse(localStorage.getItem("sites") || "[]");
let threshold = parseInt(localStorage.getItem("threshold")) || 7;

// Render sites into sections
function renderSites() {
  ["indoor", "outdoor"].forEach(category => {
    const section = document.getElementById(`${category}-section`);
    section.innerHTML = "";

    let filtered = sites.filter(site => site.category === category);

    // ✅ Sort: most overdue (largest daysPassed) first
    filtered.sort((a, b) => {
      const daysA = a.lastVisit ? Math.floor((Date.now() - new Date(a.lastVisit)) / (1000 * 60 * 60 * 24)) : Infinity;
      const daysB = b.lastVisit ? Math.floor((Date.now() - new Date(b.lastVisit)) / (1000 * 60 * 60 * 24)) : Infinity;
      return daysB - daysA; // descending
    });

    filtered.forEach(site => {
      const daysPassed = site.lastVisit
        ? Math.floor((Date.now() - new Date(site.lastVisit)) / (1000 * 60 * 60 * 24))
        : 0;

      // ✅ Color: green if within threshold, red if overdue (no more pink shades)
      const bgColor = daysPassed <= threshold ? "#d1fae5" : "#fecaca";

      const card = document.createElement("div");
      card.className = `p-3 rounded shadow flex justify-between items-center`;
      card.style.backgroundColor = bgColor;

      card.innerHTML = `
        <span class="font-medium site-name cursor-pointer">${site.name}</span>
        <input type="date" value="${site.lastVisit || ""}" 
          onchange="updateDate('${site.id}', this.value)" 
          class="border rounded p-1 text-sm ml-3">
      `;

      attachLongPress(card.querySelector(".site-name"), site.id);
      section.appendChild(card);
    });
  });
}

// Add site from dialog
function showAddSiteDialog() {
  document.getElementById("addSiteDialog").classList.remove("hidden");
}
function closeAddSiteDialog() {
  document.getElementById("addSiteDialog").classList.add("hidden");
}
function addSite() {
  const name = document.getElementById("siteNameInput").value.trim();
  const category = document.getElementById("siteCategoryInput").value;
  if (!name) return;

  sites.push({ id: Date.now(), name, category, lastVisit: "" });
  localStorage.setItem("sites", JSON.stringify(sites));
  closeAddSiteDialog();
  renderSites();
}

// Update site date
function updateDate(id, date) {
  const site = sites.find(s => s.id == id);
  if (site) {
    site.lastVisit = date;
    localStorage.setItem("sites", JSON.stringify(sites));
    renderSites();
  }
}

// Long press delete
function attachLongPress(el, id) {
  let timer;
  el.addEventListener("mousedown", () => {
    timer = setTimeout(() => {
      if (confirm("Delete this site?")) {
        sites = sites.filter(s => s.id != id);
        localStorage.setItem("sites", JSON.stringify(sites));
        renderSites();
      }
    }, 1000);
  });
  el.addEventListener("mouseup", () => clearTimeout(timer));
  el.addEventListener("mouseleave", () => clearTimeout(timer));
}

// WhatsApp Share
function shareWhatsApp(category) {
  const list = sites
    .filter(s => s.category === category)
    .map(
      s =>
        `${s.name}: ${
          s.lastVisit || "No date"
        }`
    )
    .join("\n");

  const url = `https://wa.me/?text=${encodeURIComponent(list)}`;
  window.open(url, "_blank");
}

// Settings modal
function openSettings() {
  document.getElementById("settingsModal").classList.remove("hidden");
  document.getElementById("thresholdInput").value =
    localStorage.getItem("threshold") || threshold;
}
function closeSettings() {
  document.getElementById("settingsModal").classList.add("hidden");
}
function saveSettings() {
  threshold = parseInt(document.getElementById("thresholdInput").value) || 7;
  localStorage.setItem("threshold", threshold);
  renderSites();
  closeSettings();
}

// Clear cache/reset
function clearCacheAndReload(full = false) {
  if ("caches" in window) {
    caches.keys().then(names => {
      for (let name of names) caches.delete(name);
    });
  }
  if (full) {
    localStorage.clear();
  }
  location.reload();
}

// PWA install
let deferredPrompt;
window.addEventListener("beforeinstallprompt", e => {
  e.preventDefault();
  deferredPrompt = e;
  document.getElementById("installBtn").classList.remove("hidden");
});
function installApp() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.finally(() => (deferredPrompt = null));
  }
}

// Initial render
renderSites();
