// =====================
// Storage Utilities
// =====================
function loadSites() {
  return JSON.parse(localStorage.getItem("sites") || "[]");
}

function saveSites(sites) {
  localStorage.setItem("sites", JSON.stringify(sites));
}

function loadThreshold() {
  return parseInt(localStorage.getItem("threshold") || "7", 10);
}

function saveThreshold(value) {
  localStorage.setItem("threshold", String(value));
}

// =====================
// Site Handling
// =====================
function daysSince(dateStr) {
  if (!dateStr) return null;
  const now = new Date();
  const last = new Date(dateStr);
  const diff = Math.floor((now - last) / (1000 * 60 * 60 * 24));
  return diff;
}

function renderSites() {
  const sites = loadSites();
  const threshold = loadThreshold();

  const sections = {
    indoor: document.getElementById("indoor-section"),
    outdoor: document.getElementById("outdoor-section"),
  };

  Object.values(sections).forEach((s) => (s.innerHTML = "")); // clear old

  // Sort by most overdue first
  sites.sort((a, b) => {
    const da = daysSince(a.lastVisit) ?? Infinity;
    const db = daysSince(b.lastVisit) ?? Infinity;
    return db - da;
  });

  sites.forEach((site) => {
    const d = daysSince(site.lastVisit);
    const isOverdue = d === null ? true : d > threshold;

    // card container
    const card = document.createElement("div");
    card.className =
      "p-3 rounded shadow flex justify-between items-center";

    if (isOverdue) {
      card.classList.add("bg-red-500", "text-white");
    } else {
      card.classList.add("bg-green-100");
    }

    // left side: site name
    const left = document.createElement("span");
    left.className =
      "font-medium site-name cursor-pointer truncate max-w-[150px]";
    left.textContent = site.name;
    attachLongPress(left, site.id);

    // right side: date picker + days badge
    const right = document.createElement("div");
    right.className = "flex items-center space-x-2";

    const dateInput = document.createElement("input");
    dateInput.type = "date";
    dateInput.value = site.lastVisit || "";
    dateInput.className = "border rounded p-1 text-xs w-28";
    dateInput.addEventListener("change", (e) =>
      updateDate(site.id, e.target.value)
    );

    const daysBadge = document.createElement("span");
    daysBadge.className = isOverdue
      ? "text-sm font-bold"
      : "text-sm text-gray-700";
    daysBadge.style.minWidth = "24px";
    daysBadge.style.textAlign = "right";
    daysBadge.textContent = d === null ? "—" : String(d);

    right.appendChild(dateInput);
    right.appendChild(daysBadge);

    card.appendChild(left);
    card.appendChild(right);

    sections[site.category].appendChild(card);
  });
}

function updateDate(id, newDate) {
  const sites = loadSites();
  const idx = sites.findIndex((s) => s.id === id);
  if (idx > -1) {
    sites[idx].lastVisit = newDate;
    saveSites(sites);
    renderSites();
  }
}

function addSite() {
  const name = document.getElementById("siteNameInput").value.trim();
  const category = document.getElementById("siteCategoryInput").value;
  if (!name) return;

  const sites = loadSites();
  sites.push({ id: Date.now(), name, category, lastVisit: "" });
  saveSites(sites);

  closeAddSiteDialog();
  renderSites();
}

// =====================
// Dialogs / Modals
// =====================
function showAddSiteDialog() {
  document.getElementById("addSiteDialog").classList.remove("hidden");
}

function closeAddSiteDialog() {
  document.getElementById("addSiteDialog").classList.add("hidden");
}

function openSettings() {
  document.getElementById("settingsModal").classList.remove("hidden");
  document.getElementById("thresholdInput").value = loadThreshold();
}

function closeSettings() {
  document.getElementById("settingsModal").classList.add("hidden");
}

function saveSettings() {
  const val = parseInt(document.getElementById("thresholdInput").value, 10);
  if (val > 0) {
    saveThreshold(val);
    closeSettings();
    renderSites();
  }
}

function clearCacheAndReload(full) {
  caches.keys().then((names) => {
    for (let name of names) caches.delete(name);
  });
  if (full) localStorage.clear();
  location.reload();
}

// =====================
// Sharing
// =====================
function shareWhatsApp(category) {
  const sites = loadSites().filter((s) => s.category === category);
  const threshold = loadThreshold();

  // Only overdue sites
  const overdue = sites.filter((s) => {
    const d = daysSince(s.lastVisit);
    return d !== null && d > threshold;
  });

  if (!overdue.length) {
    alert("No overdue sites.");
    return;
  }

  // Build message only for overdue
  let message = `visit overdue at sites:\n`;
  overdue.forEach((site) => {
    const d = daysSince(site.lastVisit);
    message += `- ${site.name} is not visited ${d} day${d !== 1 ? "s" : ""} are passed.\n`;
  });

  const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");
}



// =====================
// Long press delete
// =====================
function attachLongPress(element, id) {
  let timer;
  element.addEventListener("mousedown", () => {
    timer = setTimeout(() => {
      if (confirm("Delete this site?")) {
        const sites = loadSites().filter((s) => s.id !== id);
        saveSites(sites);
        renderSites();
      }
    }, 1000);
  });
  element.addEventListener("mouseup", () => clearTimeout(timer));
  element.addEventListener("mouseleave", () => clearTimeout(timer));
}

// =====================
// PWA Install
// =====================
let deferredPrompt;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const btn = document.getElementById("installBtn");
  if (btn) btn.classList.remove("hidden");
});

function installApp() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.finally(() => (deferredPrompt = null));
  }
}

// =====================
// Init
// =====================
window.addEventListener("DOMContentLoaded", () => {
  renderSites();
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js");
  }
});
