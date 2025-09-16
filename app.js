// -------------------
// PWA Install Handler
// -------------------
let deferredPrompt;
const installBtn = document.getElementById("installBtn");

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (installBtn) {
    installBtn.classList.remove("hidden");
    installBtn.addEventListener("click", () => {
      installBtn.classList.add("hidden");
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => {
        deferredPrompt = null;
      });
    });
  }
});

// -------------------
// Service Worker
// -------------------
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sites-visit-tracker/service-worker.js", { scope: "/sites-visit-tracker/" })
      .then((reg) => console.log("Service Worker registered:", reg.scope))
      .catch((err) => console.log("SW registration failed:", err));
  });
}

// -------------------
// UI Elements
// -------------------
const settingsBtn = document.getElementById("settingsBtn");
const settingsModal = document.getElementById("settingsModal");
const closeSettings = document.getElementById("closeSettings");
const addSiteBtn = document.getElementById("addSiteBtn");
const indoorSites = document.getElementById("indoorSites");
const outdoorSites = document.getElementById("outdoorSites");

// Toggle settings modal
settingsBtn.addEventListener("click", () => settingsModal.classList.remove("hidden"));
closeSettings.addEventListener("click", () => settingsModal.classList.add("hidden"));

// -------------------
// Site Handling
// -------------------
function addSite(name, section) {
  const card = document.createElement("div");
  card.className = "bg-white rounded-xl shadow-md p-4 text-sm";
  card.innerHTML = `
    <div class="flex justify-between">
      <span class="font-semibold">${name}</span>
      <span class="text-gray-500">${new Date().toLocaleDateString()}</span>
    </div>
  `;
  section.appendChild(card);
}

addSiteBtn.addEventListener("click", () => {
  const name = prompt("Enter site name:");
  if (!name) return;
  const type = confirm("Is this an Indoor site?") ? "indoor" : "outdoor";
  addSite(name, type === "indoor" ? indoorSites : outdoorSites);
});

// -------------------
// WhatsApp Buttons
// -------------------
function shareOnWhatsApp(message) {
  const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");
}

document.getElementById("whatsappIndoor").addEventListener("click", () => {
  shareOnWhatsApp("Indoor sites update...");
});

document.getElementById("whatsappOutdoor").addEventListener("click", () => {
  shareOnWhatsApp("Outdoor sites update...");
});
