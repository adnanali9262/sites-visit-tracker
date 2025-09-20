document.addEventListener("DOMContentLoaded", () => {
  const siteForm = document.getElementById("siteForm");
  const siteInput = document.getElementById("siteInput");
  const siteList = document.getElementById("siteList");
  const thresholdInput = document.getElementById("thresholdInput");
  const settingsMenu = document.getElementById("settingsMenu");
  const settingsBtn = document.getElementById("settingsBtn");
  const closeSettingsBtn = document.getElementById("closeSettingsBtn");

  let sites = JSON.parse(localStorage.getItem("sites")) || [];
  let threshold = parseInt(localStorage.getItem("threshold")) || 7;

  thresholdInput.value = threshold;

  // Save threshold change
  thresholdInput.addEventListener("input", () => {
    threshold = parseInt(thresholdInput.value) || 7;
    localStorage.setItem("threshold", threshold);
    renderSites();
  });

  // Toggle settings menu
  settingsBtn.addEventListener("click", () => {
    settingsMenu.classList.toggle("hidden");
  });

  // Close settings menu
  closeSettingsBtn.addEventListener("click", () => {
    settingsMenu.classList.add("hidden");
  });

  // Add new site
  siteForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = siteInput.value.trim();
    if (!name) return;

    sites.push({ name, lastVisit: new Date().toISOString() });
    localStorage.setItem("sites", JSON.stringify(sites));
    siteInput.value = "";
    renderSites();
  });

  // Render sites
  function renderSites() {
    siteList.innerHTML = "";

    // Sort: longest overdue at top
    sites.sort((a, b) => {
      const daysA = a.lastVisit
        ? Math.floor((Date.now() - new Date(a.lastVisit)) / (1000 * 60 * 60 * 24))
        : 0;
      const daysB = b.lastVisit
        ? Math.floor((Date.now() - new Date(b.lastVisit)) / (1000 * 60 * 60 * 24))
        : 0;
      return daysB - daysA;
    });

    sites.forEach((site, index) => {
      const daysPassed = site.lastVisit
        ? Math.floor((Date.now() - new Date(site.lastVisit)) / (1000 * 60 * 60 * 24))
        : 0;

      // ✅ Colors: green if within threshold, strong red if overdue
      const bgColor = daysPassed <= threshold ? "#d1fae5" : "#ef4444";

      const card = document.createElement("div");
      card.className =
        "p-3 rounded shadow flex justify-between items-center mb-2";
      card.style.backgroundColor = bgColor;

      const info = document.createElement("div");
      info.innerHTML = `
        <strong class="site-name">${site.name}</strong><br>
        Last Visit: ${site.lastVisit ? new Date(site.lastVisit).toLocaleDateString() : "Never"} 
        <span class="text-xs text-gray-700">(${daysPassed})</span>
      `;

      // ✅ Update button
      const updateBtn = document.createElement("button");
      updateBtn.textContent = "Update";
      updateBtn.className =
        "ml-2 px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600";
      updateBtn.addEventListener("click", () => {
        sites[index].lastVisit = new Date().toISOString();
        localStorage.setItem("sites", JSON.stringify(sites));
        renderSites();
      });

      // ✅ WhatsApp button
      const message = `${site.name} is not visited ${daysPassed} day${daysPassed !== 1 ? "s" : ""} ago.`;
      const whatsappBtn = document.createElement("button");
      whatsappBtn.className = "ml-2 text-green-600 hover:text-green-800";
      whatsappBtn.innerHTML = "📲";
      whatsappBtn.addEventListener("click", () => {
        const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(url, "_blank");
      });

      card.appendChild(info);
      card.appendChild(updateBtn);
      card.appendChild(whatsappBtn);
      siteList.appendChild(card);
    });
  }

  renderSites();
});
