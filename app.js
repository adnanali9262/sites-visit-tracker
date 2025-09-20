let sites = JSON.parse(localStorage.getItem("sites") || "[]");
let threshold = parseInt(localStorage.getItem("threshold")) || 7;

// Render site cards
function renderSites() {
  ["indoor", "outdoor"].forEach(cat => {
    const section = document.getElementById(`${cat}-section`);
    section.innerHTML = "";

    let filtered = sites.filter(s => s.category === cat);
    filtered.sort((a, b) => new Date(a.lastVisit || 0) - new Date(b.lastVisit || 0));

    filtered.forEach(site => {
      let daysPassed = site.lastVisit
        ? Math.floor((Date.now() - new Date(site.lastVisit)) / (1000 * 60 * 60 * 24))
        : 0;

      // ✅ Fixed logic: green if within threshold, red if overdue
      let bgColor = daysPassed <= threshold ? "#d1fae5" : "#fecaca"; // green-100 vs red-200

      let card = document.createElement("div");
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

// Add new site
function addSite(category) {
  let name = prompt("Enter site name:");
  if (!name) return;
  let newSite = { id: Date.now(), name, category, lastVisit: "" };
  sites.push(newSite);
  localStorage.setItem("sites", JSON.stringify(sites));
  renderSites();
}

// Update last visit date
function updateDate(id, date) {
  let site = sites.find(s => s.id == id);
  site.lastVisit = date;
  localStorage.setItem("sites", JSON.stringify(sites));
  renderSites();
}

// Long press to delete site
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

// Clear cache or reset
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

// PWA Install
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
