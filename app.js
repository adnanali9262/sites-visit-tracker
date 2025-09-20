// app.js - cleaned (📲 button removed)

let sites = JSON.parse(localStorage.getItem("sites") || "[]");
let threshold = parseInt(localStorage.getItem("threshold")) || 7;
let deferredPrompt;

// Helper: unique id
function createId() {
  return "_" + Math.random().toString(36).substr(2, 9);
}

// Save sites and re-render
function saveSites() {
  localStorage.setItem("sites", JSON.stringify(sites));
  renderSites();
}

// Utility: days since date (returns integer). If noDate -> null
function daysSince(dateString) {
  if (!dateString) return null;
  const msPerDay = 1000 * 60 * 60 * 24;
  const diff = Date.now() - new Date(dateString).getTime();
  return Math.floor(diff / msPerDay);
}

// Render all site cards
function renderSites() {
  ["indoor", "outdoor"].forEach(category => {
    const section = document.getElementById(`${category}-section`);
    if (!section) return;
    section.innerHTML = "";

    // Filter by category
    let filtered = sites.filter(s => s.category === category);

    // Sort: most overdue first. Treat never-visited as most overdue.
    filtered.sort((a, b) => {
      const da = daysSince(a.lastVisit);
      const db = daysSince(b.lastVisit);
      const va = da === null ? Infinity : da;
      const vb = db === null ? Infinity : db;
      return vb - va; // descending
    });

    // Build cards
    filtered.forEach(site => {
      const d = daysSince(site.lastVisit);            // null or integer
      const isOverdue = d === null ? true : d > threshold;

      // card element
      const card = document.createElement("div");
      card.className = "p-3 rounded shadow flex justify-between items-center";

      // background color: green if within threshold, solid red if overdue
      if (isOverdue) {
        card.classList.add("bg-red-500", "text-white");
      } else {
        card.classList.add("bg-green-100");
      }

      // left: name + date input + small days number
      const left = document.createElement("div");
      left.className = "flex items-center space-x-3";

      const nameSpan = document.createElement("span");
      nameSpan.className = "font-medium site-name cursor-pointer";
      nameSpan.textContent = site.name;

      // date input
      const dateInput = document.createElement("input");
      dateInput.type = "date";
      dateInput.value = site.lastVisit || "";
      dateInput.className = "border rounded p-1 text-sm";
      dateInput.addEventListener("change", (e) => updateDate(site.id, e.target.value));

      // small days badge (only the number). If no date, show "—"
      const daysBadge = document.createElement("span");
      daysBadge.className = (isOverdue ? "ml-2 text-sm font-medium" : "ml-2 text-sm text-gray-700");
      daysBadge.style.minWidth = "20px";
      daysBadge.style.textAlign = "center";
      daysBadge.textContent = (d === null ? "—" : String(d));

      left.appendChild(nameSpan);
      left.appendChild(dateInput);
      left.appendChild(daysBadge);

      // assemble
      card.appendChild(left);

      // attach long press to name for edit/delete
      attachLongPress(nameSpan, site.id);

      section.appendChild(card);
    });
  });
}

// Update date for a site
function updateDate(id, date) {
  const site = sites.find(s => s.id === id);
  if (!site) return;
  site.lastVisit = date;
  saveSites();
}

// Long press (touch + mouse) to edit/delete
function attachLongPress(element, id) {
  let pressTimer = null;

  const start = (e) => {
    e.preventDefault?.();
    pressTimer = setTimeout(() => handleEditDelete(id), 700);
  };
  const cancel = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
  };

  element.addEventListener("touchstart", start, { passive: true });
  element.addEventListener("mousedown", start);
  element.addEventListener("touchend", cancel);
  element.addEventListener("mouseup", cancel);
  element.addEventListener("mouseleave", cancel);
}

// Edit or delete handler
function handleEditDelete(id) {
  const site = sites.find(s => s.id === id);
  if (!site) return;

  if (confirm("Edit site name?")) {
    const newName = prompt("Enter new site name:", site.name);
    if (newName !== null && newName.trim() !== "") {
      site.name = newName.trim();
      saveSites();
    }
    return;
  }
  if (confirm("Delete this site?")) {
    sites = sites.filter(s => s.id !== id);
    saveSites();
  }
}

// Add site dialog controls
function showAddSiteDialog() {
  const dlg = document.getElementById("addSiteDialog");
  if (dlg) dlg.classList.remove("hidden");
}
function closeAddSiteDialog() {
  const dlg = document.getElementById("addSiteDialog");
  if (dlg) dlg.classList.add("hidden");
}
function addSite() {
  const nameEl = document.getElementById("siteNameInput");
  const categoryEl = document.getElementById("siteCategoryInput");
  if (!nameEl || !categoryEl) return;

  const name = nameEl.value.trim();
  const category = categoryEl.value || "indoor";
  if (!name) return;

  sites.push({ id: createId(), name, category, lastVisit: "" });
  saveSites();
  nameEl.value = "";
  closeAddSiteDialog();
}

// Share overdue sites by category (top-bar button)
function shareWhatsApp(category) {
  const overdue = sites
    .filter(s => s.category === category)
    .filter(s => {
      const d = daysSince(s.lastVisit);
      return d === null ? true : d > threshold;
    });

  if (!overdue.length) {
    alert("No overdue sites.");
    return;
  }

  const parts = overdue.map(s => {
    const d = daysSince(s.lastVisit);
    return d === null
      ? `${s.name} (never visited)`
      : `${s.name} is not visited ${d} day${d !== 1 ? "s" : ""} passed`;
  });

  const message = parts.join(", ");
  const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");
}

// Settings modal controls
function openSettings() {
  const modal = document.getElementById("settingsModal");
  if (modal) modal.classList.remove("hidden");

  // populate input
  const inp = document.getElementById("thresholdInput");
  if (inp) inp.value = localStorage.getItem("threshold") || threshold;
}
function closeSettings() {
  const modal = document.getElementById("settingsModal");
  if (modal) modal.classList.add("hidden");
}
function saveSettings() {
  const inp = document.getElementById("thresholdInput");
  if (!inp) return;
  threshold = parseInt(inp.value) || 7;
  localStorage.setItem("threshold", threshold);
  renderSites();
  closeSettings();
}

// Clear cache and optionally full reset
function clearCacheAndReload(full = false) {
  if (full) localStorage.clear();
  if ("caches" in window) {
    caches.keys().then(names => names.forEach(n => caches.delete(n)));
  }
  location.reload(true);
}

// PWA install handling
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const installBtn = document.getElementById('installBtn');
  if (installBtn) installBtn.classList.remove('hidden');
});
function installApp() {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then(() => {
    deferredPrompt = null;
    const installBtn = document.getElementById('installBtn');
    if (installBtn) installBtn.classList.add('hidden');
  });
}

// Service worker registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sites-visit-tracker/service-worker.js')
      .then(reg => console.log('SW registered:', reg.scope))
      .catch(err => console.log('SW registration failed:', err));
  });
}

// Notifications (daily check)
if ("Notification" in window && Notification.permission !== "denied") {
  Notification.requestPermission();
}
setInterval(() => {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  sites.forEach(s => {
    const d = daysSince(s.lastVisit);
    const isOverdue = d === null ? true : d > threshold;
    if (isOverdue) {
      const daysText = d === null ? "never" : `${d} day${d !== 1 ? "s" : ""}`;
      new Notification("Site Overdue", { body: `${s.name} not visited in ${daysText}.` });
    }
  });
}, 24 * 60 * 60 * 1000);

// Initial render
renderSites();
