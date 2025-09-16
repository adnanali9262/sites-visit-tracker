let sites = JSON.parse(localStorage.getItem("sites")) || [];
let threshold = parseInt(localStorage.getItem("threshold")) || 7;
let deferredPrompt;

function saveSites() {
  localStorage.setItem("sites", JSON.stringify(sites));
  renderSites();
}

function renderSites() {
  ["indoor", "outdoor"].forEach(cat => {
    const section = document.getElementById(`${cat}-section`);
    section.innerHTML = "";

    let filtered = sites.filter(s => s.category === cat);
    filtered.sort((a, b) => new Date(a.lastVisit) - new Date(b.lastVisit));

    filtered.forEach((site, index) => {
      let daysPassed = site.lastVisit ? Math.floor((Date.now() - new Date(site.lastVisit)) / (1000*60*60*24)) : Infinity;
      let bgClass = daysPassed < threshold ? "bg-green-100" :
                    daysPassed === threshold ? "bg-yellow-100" : "bg-red-200";

      let card = document.createElement("div");
      card.className = `p-4 rounded shadow flex justify-between items-center ${bgClass}`;
      card.innerHTML = `
        <span class="font-medium">${site.name}</span>
        <input type="date" value="${site.lastVisit || ""}" 
          onchange="updateDate(${index}, this.value)" 
          class="border rounded p-1 text-sm">
      `;
      card.addEventListener("touchstart", (e) => handleLongPress(e, index));
      card.addEventListener("mousedown", (e) => handleLongPress(e, index));

      section.appendChild(card);
    });
  });
}

function updateDate(index, date) {
  sites[index].lastVisit = date;
  saveSites();
}

let pressTimer;
function handleLongPress(e, index) {
  clearTimeout(pressTimer);
  pressTimer = setTimeout(() => {
    if (confirm("Edit site name?")) {
      let newName = prompt("Enter new site name:", sites[index].name);
      if (newName) sites[index].name = newName;
    } else if (confirm("Delete this site?")) {
      sites.splice(index, 1);
    }
    saveSites();
  }, 600);
  e.target.addEventListener("mouseup", () => clearTimeout(pressTimer));
  e.target.addEventListener("mouseleave", () => clearTimeout(pressTimer));
}

function showAddSiteDialog() {
  document.getElementById("addSiteDialog").classList.remove("hidden");
}
function closeAddSiteDialog() {
  document.getElementById("addSiteDialog").classList.add("hidden");
}
function addSite() {
  let name = document.getElementById("siteNameInput").value.trim();
  let category = document.getElementById("siteCategoryInput").value;
  if (name) {
    sites.push({ name, category, lastVisit: "" });
    saveSites();
    closeAddSiteDialog();
    document.getElementById("siteNameInput").value = "";
  }
}

function switchTab(tab) {
  document.getElementById("indoor-section").classList.add("hidden");
  document.getElementById("outdoor-section").classList.add("hidden");
  document.getElementById(`tab-indoor`).className = "px-4 py-2 rounded-lg bg-gray-200 text-gray-800 font-medium";
  document.getElementById(`tab-outdoor`).className = "px-4 py-2 rounded-lg bg-gray-200 text-gray-800 font-medium";
  document.getElementById(`${tab}-section`).classList.remove("hidden");
  document.getElementById(`tab-${tab}`).className = "px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium";
}

function shareWhatsApp(category) {
  let overdue = sites.filter(s => s.category === category).filter(s => {
    let daysPassed = s.lastVisit ? Math.floor((Date.now() - new Date(s.lastVisit)) / (1000*60*60*24)) : Infinity;
    return daysPassed > threshold;
  });
  if (!overdue.length) {
    alert("No overdue sites.");
    return;
  }
  let message = overdue.map(s => `${s.name} (${Math.floor((Date.now() - new Date(s.lastVisit)) / (1000*60*60*24))} days)`).join(", ");
  let url = `https://wa.me/?text=${encodeURIComponent(message + " are overdue!")}`;
  window.open(url, "_blank");
}

function openSettings() {
  document.getElementById("settingsModal").classList.remove("hidden");
}
function saveSettings() {
  threshold = parseInt(document.getElementById("thresholdInput").value) || 7;
  localStorage.setItem("threshold", threshold);
  renderSites();
  document.getElementById("settingsModal").classList.add("hidden");
}
function clearCacheAndReload(full=false) {
  if (full) {
    localStorage.clear();
  }
  caches.keys().then(names => names.forEach(name => caches.delete(name)));
  location.reload(true);
}

// PWA Install
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  document.getElementById("installBtn").classList.remove("hidden");
});
function installApp() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(() => {
      deferredPrompt = null;
      document.getElementById("installBtn").classList.add("hidden");
    });
  }
}

// Init
renderSites();
switchTab("indoor");

// Notifications: check red sites daily
if ("Notification" in window && Notification.permission !== "denied") {
  Notification.requestPermission();
}
setInterval(() => {
  sites.forEach(s => {
    let days = s.lastVisit ? Math.floor((Date.now() - new Date(s.lastVisit)) / (1000*60*60*24)) : Infinity;
    if (days > threshold) {
      new Notification("Site Overdue", { body: `${s.name} not visited in ${days} days.` });
    }
  });
}, 24*60*60*1000); // daily
