let sites = JSON.parse(localStorage.getItem("sites")) || [];
let threshold = parseInt(localStorage.getItem("threshold")) || 7;
let deferredPrompt;

// Generate unique ID
function createId() { return "_" + Math.random().toString(36).substr(2, 9); }

// Save sites
function saveSites() {
  localStorage.setItem("sites", JSON.stringify(sites));
  renderSites();
}

// Render site cards
function renderSites() {
  ["indoor","outdoor"].forEach(cat=>{
    const section = document.getElementById(`${cat}-section`);
    section.innerHTML = "";
    let filtered = sites.filter(s=>s.category===cat);
    filtered.sort((a,b)=>new Date(a.lastVisit||0)-new Date(b.lastVisit||0));
    filtered.forEach(site=>{
      let daysPassed = site.lastVisit ? Math.floor((Date.now()-new Date(site.lastVisit))/(1000*60*60*24)) : 0;
      let bgColor = daysPassed<=threshold ? "#d1fae5" : `hsl(0,70%,${Math.min(50+(daysPassed-threshold)*5,90)}%)`;
      let card = document.createElement("div");
      card.className="p-3 rounded shadow flex justify-between items-center";
      card.style.backgroundColor=bgColor;
      card.innerHTML=`
        <span class="font-medium site-name cursor-pointer">${site.name}</span>
        <input type="date" value="${site.lastVisit||""}" onchange="updateDate('${site.id}',this.value)" class="border rounded p-1 text-sm ml-3">
      `;
      attachLongPress(card.querySelector(".site-name"),site.id);
      section.appendChild(card);
    });
  });
}

// Update date
function updateDate(id,date){ let site = sites.find(s=>s.id===id); if(site){ site.lastVisit=date; saveSites(); } }

// Long press
function attachLongPress(el,id){
  let pressTimer;
  el.addEventListener("touchstart",e=>{ pressTimer=setTimeout(()=>handleEditDelete(id),600); });
  el.addEventListener("mousedown",e=>{ pressTimer=setTimeout(()=>handleEditDelete(id),600); });
  el.addEventListener("mouseup",e=>clearTimeout(pressTimer));
  el.addEventListener("mouseleave",e=>clearTimeout(pressTimer));
}

// Edit/Delete
function handleEditDelete(id){
  let site=sites.find(s=>s.id===id); if(!site)return;
  if(confirm("Edit site name?")){
    let newName=prompt("Enter new site name:",site.name);
    if(newName) site.name=newName;
  } else if(confirm("Delete this site?")){ sites=sites.filter(s=>s.id!==id); }
  saveSites();
}

// Add site
function showAddSiteDialog(){ document.getElementById("addSiteDialog").classList.remove("hidden"); }
function closeAddSiteDialog(){ document.getElementById("addSiteDialog").classList.add("hidden"); }
function addSite(){
  let name=document.getElementById("siteNameInput").value.trim();
  let category=document.getElementById("siteCategoryInput").value;
  if(name){
    sites.push({id:createId(),name,category,lastVisit:""});
    saveSites();
    closeAddSiteDialog();
    document.getElementById("siteNameInput").value="";
  }
}

// WhatsApp share
function shareWhatsApp(category){
  let overdue = sites.filter(s=>s.category===category).filter(s=>{
    let daysPassed = s.lastVisit?Math.floor((Date.now()-new Date(s.lastVisit))/(1000*60*60*24)):Infinity;
    return daysPassed>threshold;
  });
  if(!overdue.length){ alert("No overdue sites."); return; }
  let message = overdue.map(s=>`${s.name} (${Math.floor((Date.now()-new Date(s.lastVisit))/(1000*60*60*24))} days)`).join(", ");
  let url=`https://wa.me/?text=${encodeURIComponent(message+" are overdue!")}`;
  window.open(url,"_blank");
}

// Settings
function openSettings(){ document.getElementById("settingsModal").classList.remove("hidden"); }
function saveSettings(){
  threshold=parseInt(document.getElementById("thresholdInput").value)||7;
  localStorage.setItem("threshold",threshold);
  renderSites();
  document.getElementById("settingsModal").classList.add("hidden");
}
function clearCacheAndReload(full=false){ if(full)localStorage.clear(); caches.keys().then(names=>names.forEach(name=>caches.delete(name))); location.reload(true); }

// PWA install
window.addEventListener('beforeinstallprompt', e=>{
  e.preventDefault();
  deferredPrompt=e;
  const installBtn=document.getElementById('installBtn');
  installBtn.style.display='block';
});
function installApp(){
  if(deferredPrompt){
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(choice=>{ deferredPrompt=null; document.getElementById('installBtn').style.display='none'; });
  }
}

// Service Worker
if('serviceWorker' in navigator){
  window.addEventListener('load',()=>{ navigator.serviceWorker.register('/sites-visit-tracker/service-worker.js').then(reg=>console.log('SW registered',reg.scope)).catch(err=>console.log('SW failed',err)); });
}

// Init
renderSites();

// Daily notifications
if("Notification" in window && Notification.permission!=="denied"){ Notification.requestPermission(); }
setInterval(()=>{
  sites.forEach(s=>{
    let days = s.lastVisit?Math.floor((Date.now()-new Date(s.lastVisit))/(1000*60*60*24)):Infinity;
    if(days>threshold) new Notification("Site Overdue",{body:`${s.name} not visited in ${days} days.`});
  });
},24*60*60*1000);

// Attach all buttons after DOM ready
document.addEventListener("DOMContentLoaded", function() {
  document.getElementById("addSiteBtn").addEventListener("click", showAddSiteDialog);
  document.getElementById("settingsBtn").addEventListener("click", openSettings);
  document.querySelector("#cancelAddBtn").addEventListener("click", closeAddSiteDialog);
  document.querySelector("#confirmAddBtn").addEventListener("click", addSite);
  document.querySelector("#saveSettingsBtn").addEventListener("click", saveSettings);
  document.querySelector("#clearCacheBtn").addEventListener("click", ()=>clearCacheAndReload(false));
  document.querySelector("#fullResetBtn").addEventListener("click", ()=>clearCacheAndReload(true));
  document.querySelectorAll(".whatsappBtn").forEach(btn=>{
    btn.addEventListener("click",function(){
      const cat = btn.closest("section").querySelector("h2").textContent.toLowerCase().includes("indoor") ? "indoor" : "outdoor";
      shareWhatsApp(cat);
    });
  });
});
