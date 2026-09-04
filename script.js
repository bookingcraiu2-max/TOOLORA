const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];


// ---------------- ACCOUNT / AUTH ----------------
let supabaseClient = null;
let authMode = "signup";
let currentUser = null;
let usageInfo = {used:0, remaining:5, plan:"free"};

function supabaseReady(){
  return Boolean(window.supabase?.createClient && window.TOOLORA_SUPABASE_URL && window.TOOLORA_SUPABASE_ANON_KEY && !String(window.TOOLORA_SUPABASE_URL).startsWith("PASTE_"));
}

async function initAuth(){
  if(!supabaseReady()) return;
  supabaseClient = window.supabase.createClient(window.TOOLORA_SUPABASE_URL, window.TOOLORA_SUPABASE_ANON_KEY);
  const {data} = await supabaseClient.auth.getSession();
  currentUser = data.session?.user || null;
  updateAccountUI();
  supabaseClient.auth.onAuthStateChange((_event,session)=>{ currentUser=session?.user||null; updateAccountUI(); });
}

function updateAccountUI(){
  const label=$("#accountLabel"), avatar=$(".account-avatar");
  if(!label)return;
  if(currentUser){ label.textContent=currentUser.email.split("@")[0].slice(0,14); avatar.textContent="✓"; }
  else { label.textContent="Cont"; avatar.textContent="◎"; }
}

function openAuth(mode="signup"){
  authMode=mode;
  $("#authModal").hidden=false;
  renderAuthMode();
}
function closeAuth(){ $("#authModal").hidden=true; }
function renderAuthMode(){
  const signup=authMode==="signup";
  $("#authTitle").textContent=signup?"Creează-ți cont":"Intră în cont";
  $("#authSubtitle").textContent=signup?"Primești 5 credite AI gratuite în fiecare lună.":"Continuă unde ai rămas.";
  $("#authSubmit").textContent=signup?"Creează cont":"Intră în cont";
  $("#authPassword").autocomplete=signup?"new-password":"current-password";
  $("#signupTab").classList.toggle("active",signup);$("#loginTab").classList.toggle("active",!signup);
  $("#authMessage").textContent="";
}

async function handleAuth(e){
  e.preventDefault();
  const email=$("#authEmail").value.trim(), password=$("#authPassword").value;
  if(!supabaseClient){ $("#authMessage").textContent="Mai întâi conectăm Supabase. După ce pui URL-ul și cheia în supabase-config.js, autentificarea va funcționa."; return; }
  $("#authSubmit").disabled=true; $("#authSubmit").textContent="Se procesează…";
  try{
    let result;
    if(authMode==="signup") result=await supabaseClient.auth.signUp({email,password,options:{emailRedirectTo:location.origin+location.pathname}});
    else result=await supabaseClient.auth.signInWithPassword({email,password});
    if(result.error) throw result.error;
    if(authMode==="signup" && !result.data.session){ $("#authMessage").textContent="Cont creat. Verifică emailul pentru confirmare, apoi intră în cont."; beep("success"); }
    else { currentUser=result.data.user; closeAuth(); await refreshUsage(); toast("Te-ai conectat."); beep("success"); }
  }catch(err){ $("#authMessage").textContent=err.message||"Autentificarea a eșuat."; beep("error"); }
  finally{ $("#authSubmit").disabled=false; }
}

async function refreshUsage(){
  if(!supabaseClient||!currentUser) return;
  const monthKey=new Date().toISOString().slice(0,7);
  try{
    const {data,error}=await supabaseClient.from("toolora_usage").select("used,plan").eq("user_id",currentUser.id).maybeSingle();
    if(!error&&data){ usageInfo={used:data.used||0,plan:data.plan||"free",remaining:(data.plan||"free")==="ultimate"?300:(data.plan||"free")==="pro"?100:Math.max(0,5-(data.used||0))}; }
    updateAccountUI();
  }catch{}
}

async function signOut(){ if(supabaseClient) await supabaseClient.auth.signOut(); currentUser=null; usageInfo={used:0,remaining:5,plan:"free"}; updateAccountUI(); toast("Ai ieșit din cont."); }

function accountPanel(){
  if(!currentUser){ openAuth("signup"); return; }
  showModal(`<div class="tool-head"><span class="pill">MY ACCOUNT</span><h2>${escapeHtml(currentUser.email)}</h2><p>Plan: <b>${usageInfo.plan.toUpperCase()}</b></p></div><div class="account-stats"><div><b>${usageInfo.remaining}</b><span>credite rămase</span></div><div><b>${usageInfo.used}</b><span>folosite luna asta</span></div><div><b>${usageInfo.plan==='ultimate'?300:usageInfo.plan==='pro'?100:5}</b><span>limita lunară</span></div></div><div class="tool-actions"><button class="primary" id="accountUpgrade">Upgrade la Pro — 19,90 lei/lună</button><button class="secondary" id="accountLogout">Ieși din cont</button></div><p class="small-note">Plata Pro va fi activată după conectarea Stripe.</p>`);
  $("#accountLogout").onclick=signOut; $("#accountUpgrade").onclick=()=>{jump("pricing");closeModal();};
}

$("#accountBtn")?.addEventListener("click",accountPanel);
$("#accountCta")?.addEventListener("click",()=>openAuth("signup"));
$("#signupTab")?.addEventListener("click",()=>{authMode="signup";renderAuthMode()});
$("#loginTab")?.addEventListener("click",()=>{authMode="login";renderAuthMode()});
$("#authForm")?.addEventListener("submit",handleAuth);
$("#authClose")?.addEventListener("click",closeAuth);
$(".auth-backdrop")?.addEventListener("click",closeAuth);
$("#proBtn")?.addEventListener("click",()=>{if(!currentUser){openAuth("signup");return}toast("Pro este pregătit în Stripe Sandbox. Conectăm Checkout în pasul următor.");});
$("#ultimateBtn")?.addEventListener("click",()=>{if(!currentUser){openAuth("signup");return}toast("Ultimate este pregătit în Stripe Sandbox. Conectăm Checkout în pasul următor.");});
initAuth();

const catalog={
cars:[
"Alfa Romeo Giulia","Alfa Romeo Stelvio","Audi A3","Audi A4","Audi A5","Audi A6","Audi A7","Audi A8","Audi Q2","Audi Q3","Audi Q4 e-tron","Audi Q5","Audi Q7","Audi Q8","Audi RS3","Audi RS6 Avant","BMW 1 Series","BMW 2 Series","BMW 3 Series","BMW 4 Series","BMW 5 Series","BMW 7 Series","BMW 8 Series","BMW X1","BMW X3","BMW X5","BMW X6","BMW X7","BMW i4","BMW i5","BMW i7","BMW iX","BMW M2","BMW M3","BMW M4","BMW M5","BYD Atto 3","BYD Dolphin","BYD Seal","Citroen C3","Cupra Formentor","Cupra Leon","Dacia Duster","Dacia Jogger","Dacia Sandero","Dodge Charger","Ferrari 296 GTB","Ferrari Roma","Ford Focus","Ford Kuga","Ford Mustang","Ford Puma","Ford Ranger","Honda Civic","Honda CR-V","Honda HR-V","Hyundai i10","Hyundai i20","Hyundai i30","Hyundai Kona","Hyundai Tucson","Hyundai Santa Fe","Jaguar F-Pace","Jeep Compass","Jeep Grand Cherokee","Jeep Wrangler","Kia Ceed","Kia EV3","Kia EV6","Kia Sportage","Kia Sorento","Lamborghini Huracan","Land Rover Defender","Land Rover Discovery","Land Rover Range Rover","Lexus ES","Lexus NX","Lexus RX","Mazda 3","Mazda CX-5","Mazda CX-60","McLaren 750S","Mercedes A-Class","Mercedes B-Class","Mercedes C-Class","Mercedes E-Class","Mercedes S-Class","Mercedes CLA","Mercedes GLA","Mercedes GLC","Mercedes GLE","Mercedes GLS","Mercedes-AMG A45","Mercedes-AMG C63","Mercedes-AMG E53","Mercedes-AMG GT","MG4","Mini Cooper","Mini Countryman","Mitsubishi Outlander","Nissan Juke","Nissan Qashqai","Nissan X-Trail","Opel Astra","Opel Corsa","Peugeot 208","Peugeot 308","Peugeot 3008","Porsche 718 Cayman","Porsche 911","Porsche Cayenne","Porsche Macan","Porsche Taycan","Renault Clio","Renault Austral","Renault Captur","Renault Megane E-Tech","Seat Ibiza","Seat Leon","Skoda Fabia","Skoda Octavia","Skoda Superb","Skoda Karoq","Skoda Kodiaq","Subaru Forester","Suzuki Swift","Tesla Model 3","Tesla Model S","Tesla Model X","Tesla Model Y","Toyota Aygo X","Toyota C-HR","Toyota Camry","Toyota Corolla","Toyota GR Yaris","Toyota Hilux","Toyota Land Cruiser","Toyota Prius","Toyota RAV4","Volkswagen Golf","Volkswagen Passat","Volkswagen Tiguan","Volkswagen Touareg","Volvo EX30","Volvo XC40","Volvo XC60","Volvo XC90"
],
phones:[
"Apple iPhone 13","Apple iPhone 13 Pro","Apple iPhone 14","Apple iPhone 14 Pro","Apple iPhone 15","Apple iPhone 15 Plus","Apple iPhone 15 Pro","Apple iPhone 15 Pro Max","Apple iPhone 16","Apple iPhone 16 Plus","Apple iPhone 16 Pro","Apple iPhone 16 Pro Max","Apple iPhone 17","Apple iPhone 17 Air","Apple iPhone 17 Pro","Apple iPhone 17 Pro Max","Samsung Galaxy S23","Samsung Galaxy S23 Ultra","Samsung Galaxy S24","Samsung Galaxy S24+","Samsung Galaxy S24 Ultra","Samsung Galaxy S25","Samsung Galaxy S25+","Samsung Galaxy S25 Ultra","Samsung Galaxy Z Flip6","Samsung Galaxy Z Fold6","Google Pixel 8","Google Pixel 8 Pro","Google Pixel 9","Google Pixel 9 Pro","Google Pixel 9 Pro XL","Google Pixel 9a","Google Pixel 10","Google Pixel 10 Pro","OnePlus 12","OnePlus 12R","OnePlus 13","OnePlus 13R","Xiaomi 13","Xiaomi 14","Xiaomi 14 Ultra","Xiaomi 15","Xiaomi 15 Ultra","Xiaomi Redmi Note 13","Xiaomi Redmi Note 14","Nothing Phone (2)","Nothing Phone (3)","Motorola Edge 50 Pro","Motorola Razr 50 Ultra","Sony Xperia 1 VI","Sony Xperia 1 VII","ASUS ROG Phone 8 Pro","HONOR Magic6 Pro","HONOR Magic7 Pro","OPPO Find X8 Pro","OPPO Reno 12 Pro","vivo X100 Pro","vivo X200 Pro","Huawei Pura 70 Pro","Huawei Mate 70 Pro"
],
laptops:[
"Apple MacBook Air M2","Apple MacBook Air M3","Apple MacBook Air M4","Apple MacBook Pro 14 M3","Apple MacBook Pro 14 M4","Apple MacBook Pro 16 M4","Dell XPS 13","Dell XPS 14","Dell XPS 16","Dell Inspiron 14","Dell Latitude 7450","Lenovo ThinkPad X1 Carbon","Lenovo ThinkPad T14","Lenovo Yoga Slim 7","Lenovo Legion 5","Lenovo Legion Pro 5","ASUS Zenbook 14","ASUS Zenbook S 16","ASUS Vivobook S 14","ASUS ROG Zephyrus G14","ASUS ROG Zephyrus G16","ASUS ROG Strix G16","HP Spectre x360 14","HP Envy x360 14","HP EliteBook 840","HP Omen 16","Acer Swift Go 14","Acer Swift X 14","Acer Nitro V 15","Acer Predator Helios Neo 16","MSI Prestige 14","MSI Creator M16","MSI Katana 15","Microsoft Surface Laptop 7","Microsoft Surface Pro 11","Razer Blade 14","Razer Blade 16","Framework Laptop 13","Framework Laptop 16","Samsung Galaxy Book4 Pro","Samsung Galaxy Book5 Pro","LG Gram 16","Huawei MateBook X Pro","Huawei MateBook 14","Gigabyte AERO 16","Gigabyte AORUS 15"
]};

let category="cars";
const toolTitles={assistant:"Toolora Assistant",rewrite:"Rescriere umană",description:"Descriere produs",translate:"Traducător",image:"Generator de imagini",percent:"Calculator procent",vat:"Calculator TVA",password:"Generator parole",qr:"QR Code",counter:"Text Counter",json:"JSON Formatter",palette:"Color Palette",units:"Unit Converter",age:"Calculator vârstă",compress:"Image Compressor",slug:"Slug Generator",color:"Color Picker"};

let audioCtx=null,soundOn=true;
function beep(type="click"){
  if(!soundOn)return;
  try{
    audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)();
    if(audioCtx.state==="suspended")audioCtx.resume();
    const o=audioCtx.createOscillator(),g=audioCtx.createGain();
    o.type="sine";o.frequency.value=type==="success"?680:type==="error"?180:420;
    g.gain.setValueAtTime(.0001,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.035,audioCtx.currentTime+.01);g.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+.09);
    o.connect(g).connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+.1);
  }catch{}
}
document.addEventListener("click",e=>{if(e.target.closest("button,a"))beep("click")});
$("#soundToggle").onclick=()=>{soundOn=!soundOn;$("#soundToggle").textContent=soundOn?"🔊":"🔇";if(soundOn)beep()};

function openDrawer(){document.querySelector(".drawer").classList.add("open");$("#drawerBackdrop").hidden=false;$("#menuBtn").setAttribute("aria-expanded","true");$(".drawer").setAttribute("aria-hidden","false")}
function closeDrawer(){document.querySelector(".drawer").classList.remove("open");$("#drawerBackdrop").hidden=true;$("#menuBtn").setAttribute("aria-expanded","false");$(".drawer").setAttribute("aria-hidden","true")}
$("#menuBtn").onclick=openDrawer;$("#drawerClose").onclick=closeDrawer;$("#drawerBackdrop").onclick=closeDrawer;
$$(".drawer-nav a").forEach(a=>a.onclick=()=>closeDrawer());
$$("#drawerTools [data-tool]").forEach(b=>b.onclick=()=>{closeDrawer();toolModal(b.dataset.tool)});

function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");clearTimeout(window.__toast);window.__toast=setTimeout(()=>t.classList.remove("show"),2200)}

function jump(id){document.getElementById(id)?.scrollIntoView({behavior:"smooth",block:"start"})}
$$("[data-jump]").forEach(b=>b.onclick=()=>jump(b.dataset.jump));

function renderCatalog(){
  const arr=catalog[category];
  $("#catalogCount").textContent=`${arr.length} modele`;
  $("#catalogList").innerHTML=arr.map(x=>`<option value="${escapeHtml(x)}"></option>`).join("");
  renderMatches("");
}
function renderMatches(q){
  const arr=catalog[category],needle=q.trim().toLowerCase();
  const matches=arr.filter(x=>!needle||x.toLowerCase().includes(needle)).slice(0,22);
  $("#catalogMatches").innerHTML=matches.map(x=>`<button data-product="${escapeAttr(x)}">${escapeHtml(x)}</button>`).join("");
  $$("#catalogMatches button").forEach(b=>b.onclick=()=>{
    const val=b.dataset.product;
    if(!$("#compareA").value)$("#compareA").value=val;
    else $("#compareB").value=val;
    beep("success");
  });
}
function escapeHtml(s){return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function escapeAttr(s){return escapeHtml(s)}
$("#catalogSearch").oninput=e=>renderMatches(e.target.value);
$$("[data-cat]").forEach(b=>b.onclick=()=>{
  $$("[data-cat]").forEach(x=>x.classList.remove("active"));b.classList.add("active");
  category=b.dataset.cat;renderCatalog();beep("success");
});
renderCatalog();

async function callAI(action,input,extra={}){
  if(!supabaseClient||!currentUser){ openAuth("signup"); throw new Error("Creează un cont gratuit pentru a folosi funcțiile AI. Primești 5 credite AI gratuite pe lună."); }
  const {data:{session}}=await supabaseClient.auth.getSession();
  if(!session?.access_token) throw new Error("Sesiunea a expirat. Intră din nou în cont.");
  const res=await fetch("/api/ai",{method:"POST",headers:{"content-type":"application/json","Authorization":`Bearer ${session.access_token}`},body:JSON.stringify({action,input,...extra})});
  const data=await res.json().catch(()=>({}));
  if(data.remaining!==undefined){ usageInfo={used:data.used||0,remaining:data.remaining,plan:data.plan||"free"}; updateAccountUI(); }
  if(!res.ok) throw new Error(data.error||"Motorul AI nu este configurat încă.");
  return data;
}

function showModal(html){$("#modalBody").innerHTML=html;$("#modal").hidden=false}
function closeModal(){$("#modal").hidden=true}
$("#modalClose").onclick=closeModal;$(".modal-backdrop").onclick=closeModal;

function aiModal(type){
  if(type==="rewrite")showModal(`<div class="tool-head"><h2>${toolTitles[type]}</h2><p>Schimbă stilul și formularea, păstrând ideea originală. <span class="credit-note">5 credite AI gratuite/lună</span></p></div><textarea id="toolInput" class="tooltextarea" rows="9" placeholder="Lipește textul aici…"></textarea><select id="style" class="toolselect"><option value="natural">Natural</option><option value="casual">Casual</option><option value="professional">Profesional</option><option value="short">Scurt și clar</option></select><div class="tool-actions"><button class="primary" id="runTool">Rescrie</button><button class="secondary" id="copyOut">Copiază</button></div><div id="toolOut" class="output"></div>`);
  if(type==="description")showModal(`<div class="tool-head"><h2>${toolTitles[type]}</h2><p>Introdu produsul și câteva caracteristici. <span class="credit-note">5 credite AI gratuite/lună</span></p></div><textarea id="toolInput" class="tooltextarea" rows="7" placeholder="Ex.: căști wireless, ANC, 30h autonomie, USB-C…"></textarea><input id="tone" class="toolinput" placeholder="Ton: premium, casual, marketplace…"><div class="tool-actions"><button class="primary" id="runTool">Generează</button><button class="secondary" id="copyOut">Copiază</button></div><div id="toolOut" class="output"></div>`);
  if(type==="translate")showModal(`<div class="tool-head"><h2>${toolTitles[type]}</h2><p>Traduce textul prin motorul AI. <span class="credit-note">5 credite AI gratuite/lună</span></p></div><textarea id="toolInput" class="tooltextarea" rows="8" placeholder="Scrie textul…"></textarea><select id="lang" class="toolselect"><option>English</option><option>Romanian</option><option>French</option><option>German</option><option>Spanish</option><option>Italian</option><option>Portuguese</option></select><div class="tool-actions"><button class="primary" id="runTool">Tradu</button><button class="secondary" id="copyOut">Copiază</button></div><div id="toolOut" class="output"></div>`);
  if(type==="image")showModal(`<div class="tool-head"><h2>${toolTitles[type]}</h2><p>Descrie imaginea. Generatorul folosește FLUX prin Workers AI. <span class="credit-note">5 credite AI gratuite/lună</span></p></div><textarea id="toolInput" class="tooltextarea" rows="6" placeholder="Ex.: un BMW negru pe un drum montan, noapte, cinematic…"></textarea><select id="ratio" class="toolselect"><option value="square">Pătrat</option><option value="wide">Landscape</option><option value="portrait">Portrait</option></select><div class="tool-actions"><button class="primary" id="runTool">Generează imaginea</button></div><div id="toolOut" class="output"></div>`);
  bindAI(type);
}
function bindAI(type,contextPrefix=""){
  $("#runTool").onclick=async()=>{
    const input=$("#toolInput").value.trim(),out=$("#toolOut");
    if(!input){toast("Scrie ceva mai întâi.");beep("error");return}
    out.textContent="Se generează…";out.classList.add("loading");
    try{
      if(type==="image"){
        const data=await callAI("image",input,{ratio:$("#ratio").value});
        out.classList.remove("loading");out.innerHTML=`<img src="${data.dataURI}" alt="Imagine generată" style="max-width:100%;border-radius:14px;display:block"><div class="tool-actions"><a class="primary" href="${data.dataURI}" download="toolora-image.jpg">Descarcă imaginea</a></div>`;
      }else{
        const extra=type==="rewrite"?{style:$("#style").value}:type==="description"?{tone:$("#tone").value}:type==="translate"?{language:$("#lang").value}:{};
        const data=await callAI(type,contextPrefix+input,extra);out.classList.remove("loading");out.textContent=data.text||"Nu am primit un răspuns.";beep("success");
      }
    }catch(err){out.classList.remove("loading");out.textContent=err.message;beep("error")}
  };
  $("#copyOut")?.addEventListener("click",async()=>{await navigator.clipboard?.writeText($("#toolOut").innerText||"");toast("Copiat.");});
}

async function smartCompare(){
  const a=$("#compareA").value.trim(),b=$("#compareB").value.trim();
  if(!a||!b){toast("Completează ambele produse.");beep("error");return}
  const out=$("#compareResult");out.innerHTML=`<div class="compare-ai loading">Analizez ${escapeHtml(a)} vs ${escapeHtml(b)}…</div>`;
  try{
    const data=await callAI("compare",`${a} VS ${b}`,{category});
    out.innerHTML=`<div class="compare-ai">${escapeHtml(data.text||"Nu am primit răspuns.")}</div>`;beep("success");
  }catch(err){out.innerHTML=`<div class="compare-ai">${escapeHtml(err.message)}</div>`;beep("error")}
}
$("#smartCompareBtn").onclick=smartCompare;

function toolModal(type){
  const titles=toolTitles[type];
  if(type==="assistant"){showModal(`<div class="tool-head"><span class="pill">TOOLORA ASSISTANT</span><h2>Cu ce te ajut?</h2><p>Spune exact ce vrei să obții. Assistant-ul poate explica, structura, compara sau propune pași.</p></div><textarea id="toolInput" class="tooltextarea" rows="7" placeholder="Ex.: Vreau să aleg între două telefoane pentru gaming și cameră…"></textarea><div class="tool-actions"><button class="primary" id="runTool">Întreabă AI</button><button class="secondary" id="copyOut">Copiază</button></div><div id="toolOut" class="output"></div>`);bindAI(type);return}
  if(["rewrite","description","translate","image"].includes(type)){aiModal(type);return}
  let body="";
  if(type==="percent")body=`<div class="tool-head"><h2>${titles}</h2><p>Cât este X% din Y?</p></div><input id="v1" class="toolinput" type="number" placeholder="Valoare"><input id="v2" class="toolinput" type="number" placeholder="Procent %" style="margin-top:8px"><button class="primary" id="calc" style="margin-top:10px">Calculează</button><div id="out" class="output"></div>`;
  if(type==="vat")body=`<div class="tool-head"><h2>${titles}</h2><p>Adaugă sau scoate TVA dintr-o sumă.</p></div><input id="v1" class="toolinput" type="number" placeholder="Sumă"><input id="v2" class="toolinput" type="number" value="21" placeholder="TVA %" style="margin-top:8px"><select id="mode" class="toolselect" style="margin-top:8px"><option value="add">Adaugă TVA</option><option value="remove">Scoate TVA</option></select><button class="primary" id="calc" style="margin-top:10px">Calculează</button><div id="out" class="output"></div>`;
  if(type==="password")body=`<div class="tool-head"><h2>${titles}</h2><p>Generare locală — parola nu pleacă din browser.</p></div><input id="v1" class="toolinput" type="number" min="6" max="128" value="20" placeholder="Lungime"><button class="primary" id="calc" style="margin-top:10px">Generează</button><div id="out" class="output"></div>`;
  if(type==="qr")body=`<div class="tool-head"><h2>${titles}</h2><p>Introdu orice text sau link.</p></div><input id="v1" class="toolinput" placeholder="https://exemplu.ro"><div class="tool-actions"><button class="primary" id="calc">Generează QR</button><a id="qrDownload" class="secondary" hidden>Descarcă</a></div><div id="out" class="output qr-wrap"></div>`;
  if(type==="counter")body=`<div class="tool-head"><h2>${titles}</h2><p>Numără cuvinte, caractere și rânduri.</p></div><textarea id="v1" class="tooltextarea" rows="9" placeholder="Scrie sau lipește textul…"></textarea><div id="out"></div>`;
  if(type==="json")body=`<div class="tool-head"><h2>${titles}</h2><p>Lipește JSON valid și îl formatez.</p></div><textarea id="v1" class="tooltextarea" rows="10" placeholder='{"hello":"world"}'></textarea><div class="tool-actions"><button class="primary" id="calc">Formatează</button><button class="secondary" id="copyJson">Copiază</button></div><div id="out" class="output"></div>`;
  if(type==="palette")body=`<div class="tool-head"><h2>${titles}</h2><p>Generează cinci culori aleatorii.</p></div><button class="primary" id="calc">Generează paleta</button><div id="out" class="palette" style="margin-top:14px"></div>`;
  if(type==="units")body=`<div class="tool-head"><h2>${titles}</h2><p>Conversii rapide.</p></div><input id="v1" class="toolinput" type="number" placeholder="Valoare"><select id="unit" class="toolselect" style="margin-top:8px"><option value="kmmi">km → mile</option><option value="mikm">mile → km</option><option value="kglb">kg → lb</option><option value="lbkg">lb → kg</option><option value="cf">°C → °F</option><option value="fc">°F → °C</option></select><button class="primary" id="calc" style="margin-top:10px">Convertește</button><div id="out" class="output"></div>`;
  if(type==="age")body=`<div class="tool-head"><h2>${titles}</h2><p>Alege data nașterii.</p></div><input id="v1" class="toolinput" type="date"><button class="primary" id="calc" style="margin-top:10px">Calculează</button><div id="out" class="output"></div>`;
  if(type==="slug")body=`<div class="tool-head"><h2>${titles}</h2><p>Transformă un titlu într-un slug.</p></div><input id="v1" class="toolinput" placeholder="Titlu de exemplu pentru pagina mea"><button class="primary" id="calc" style="margin-top:10px">Generează</button><div id="out" class="output"></div>`;
  if(type==="color")body=`<div class="tool-head"><h2>${titles}</h2><p>Alege o culoare.</p></div><input id="v1" type="color" value="#7aa9ff" style="width:100%;height:70px;border:0;background:transparent"><div id="out" class="output"></div>`;
  if(type==="compress")body=`<div class="tool-head"><h2>${titles}</h2><p>Imaginea este procesată local și exportată JPEG.</p></div><div class="drop"><input id="file" type="file" accept="image/*"><p>Alege o imagine</p></div><div id="out" class="output"></div>`;
  if(!["assistant","rewrite","description","translate","image"].includes(type)) body += `<div class="ai-help"><span>Nu știi ce să faci?</span><button class="secondary" id="aiHelp">Întreabă Toolora AI</button></div>`;
  showModal(body);bindLocalTool(type);
  $("#aiHelp")?.addEventListener("click",()=>{showModal(`<div class="tool-head"><span class="pill">AI HELP / ${escapeHtml(titles)}</span><h2>Ajutor pentru ${escapeHtml(titles)}</h2><p>Spune ce vrei să obții cu acest tool și îți dau pașii sau o soluție.</p></div><textarea id="toolInput" class="tooltextarea" rows="7" placeholder="Ex.: Nu știu ce valoare să folosesc aici…"></textarea><div class="tool-actions"><button class="primary" id="runTool">Întreabă AI</button><button class="secondary" id="copyOut">Copiază</button></div><div id="toolOut" class="output"></div>`);bindAI("assistant", "Ajută-mă să folosesc tool-ul ${titles}. ");});
}
function bindLocalTool(type){
  const calc=$("#calc"),out=$("#out");
  if(type==="percent")calc.onclick=()=>{const x=+$("#v1").value,y=+$("#v2").value;out.textContent=Number.isFinite(x*y/100)?`${y}% din ${x} = ${(x*y/100).toFixed(2)}`:"Completează valorile."};
  if(type==="vat")calc.onclick=()=>{const x=+$("#v1").value,y=+$("#v2").value/100;if(!x||y<0)return out.textContent="Completează valorile.";out.textContent=$("#mode").value==="add"?`Fără TVA: ${x.toFixed(2)}\nTVA: ${(x*y).toFixed(2)}\nTotal: ${(x*(1+y)).toFixed(2)}`:`Cu TVA: ${x.toFixed(2)}\nTVA inclus: ${(x-(x/(1+y))).toFixed(2)}\nFără TVA: ${(x/(1+y)).toFixed(2)}`};
  if(type==="password")calc.onclick=()=>{const len=Math.min(128,Math.max(6,+$("#v1").value||20)),chars="ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*_-+=";const u=new Uint32Array(len);crypto.getRandomValues(u);out.textContent=[...u].map(n=>chars[n%chars.length]).join("")};
  if(type==="qr")calc.onclick=()=>{const v=$("#v1").value.trim();if(!v)return out.textContent="Introdu un text sau un link.";const src=`https://quickchart.io/qr?size=360&margin=2&text=${encodeURIComponent(v)}`;out.innerHTML=`<img src="${src}" alt="QR Code" loading="eager" referrerpolicy="no-referrer">`;const d=$("#qrDownload");d.hidden=false;d.href=src;d.target="_blank";d.rel="noopener";d.textContent="Descarcă QR";beep("success");};
  if(type==="counter")$("#v1").oninput=()=>{const v=$("#v1").value;const words=v.trim()?v.trim().split(/\s+/).length:0;out.innerHTML=`<div class="statsline"><div class="statbox"><b>${words}</b>cuvinte</div><div class="statbox"><b>${v.length}</b>caractere</div><div class="statbox"><b>${v?v.split(/\n/).length:0}</b>rânduri</div></div>`};
  if(type==="json")calc.onclick=()=>{try{out.textContent=JSON.stringify(JSON.parse($("#v1").value),null,2)}catch(e){out.textContent="JSON invalid: "+e.message}};$("#copyJson")?.addEventListener("click",()=>navigator.clipboard?.writeText(out.innerText||""));
  if(type==="palette")calc.onclick=()=>{const arr=Array.from({length:5},()=>"#"+crypto.getRandomValues(new Uint8Array(3)).reduce((s,n)=>s+n.toString(16).padStart(2,"0"),""));out.innerHTML=arr.map(c=>`<button class="swatch" style="background:${c}" data-color="${c}">${c}</button>`).join("");$$(".swatch").forEach(b=>b.onclick=()=>{navigator.clipboard?.writeText(b.dataset.color);toast("HEX copiat.");})};
  if(type==="units")calc.onclick=()=>{const x=+$("#v1").value,u=$("#unit").value;const m={kmmi:x=>x*.621371,mikm:x=>x*1.609344,kglb:x=>x*2.2046226218,lbkg:x=>x*.45359237,cf:x=>x*9/5+32,fc:x=>(x-32)*5/9};out.textContent=Number.isFinite(m[u]?.(x))?m[u](x).toFixed(4):"Completează valoarea."};
  if(type==="age")calc.onclick=()=>{const d=new Date($("#v1").value),n=new Date();if(isNaN(d))return out.textContent="Alege data.";let a=n.getFullYear()-d.getFullYear();const before=new Date(n.getFullYear(),d.getMonth(),d.getDate())>n;if(before)a--;out.textContent=`Vârsta: ${a} ani`};
  if(type==="slug")calc.onclick=()=>{let s=$("#v1").value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");out.textContent=s};
  if(type==="color"){$("#v1").oninput=e=>{out.textContent=e.target.value;out.style.borderColor=e.target.value}};
  if(type==="compress")$("#file").onchange=()=>{const f=$("#file").files[0];if(!f)return;const img=new Image();img.onload=()=>{const max=1800,scale=Math.min(1,max/img.width,max/img.height),c=document.createElement("canvas");c.width=Math.round(img.width*scale);c.height=Math.round(img.height*scale);c.getContext("2d").drawImage(img,0,0,c.width,c.height);c.toBlob(blob=>{const url=URL.createObjectURL(blob);out.innerHTML=`Original: ${(f.size/1024/1024).toFixed(2)} MB → ${ (blob.size/1024/1024).toFixed(2)} MB<br><div class="tool-actions"><a class="primary" href="${url}" download="toolora-compressed.jpg">Descarcă imaginea</a></div>`},"image/jpeg",.82)};img.src=URL.createObjectURL(f)};
}
$$(".open-tool").forEach(b=>b.onclick=()=>toolModal(b.dataset.tool));

function normalizeText(s){return String(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim()}
function mainSearch(){
  const raw=$("#mainSearch")?.value.trim(); const q=normalizeText(raw);
  if(!q){toast("Scrie ce cauți.");beep("error");return}
  const terms=q.split(/\s+/).filter(Boolean);
  const toolHits=$$(".searchable").filter(el=>{const hay=normalizeText(`${el.dataset.search||""} ${el.innerText||""}`);return terms.every(t=>hay.includes(t));});
  if(toolHits.length){toolHits[0].scrollIntoView({behavior:"smooth",block:"center"});toolHits[0].animate([{transform:"scale(1)"},{transform:"scale(1.025)"},{transform:"scale(1)"}],{duration:450});toast(`${toolHits.length} rezultat${toolHits.length>1?"e":""} găsit${toolHits.length>1?"e":""}.`);beep("success");return;}
  for(const [cat,arr] of Object.entries(catalog)){
    const found=arr.find(x=>terms.every(t=>normalizeText(x).includes(t)));
    if(found){jump("compare");$$('[data-cat]').forEach(b=>b.classList.toggle('active',b.dataset.cat===cat));category=cat;renderCatalog();$("#compareA").value=found;toast(`${found} găsit în catalog.`);beep("success");return;}
  }
  if(q.includes("pret")||q.includes("abonament")||q.includes("pro")||q.includes("ultimate")){jump("pricing");toast("Am deschis abonamentele.");return;}
  if(q.includes("cont")||q.includes("login")){jump("account");toast("Am deschis zona de cont.");return;}
  toast("Nu am găsit nimic. Încearcă un tool, un model sau o categorie.");beep("error");
}
$("#mainSearchBtn")?.addEventListener("click",mainSearch);$("#mainSearchIcon")?.addEventListener("click",mainSearch);
$("#mainSearch")?.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();mainSearch()}});
$("#mainSearch")?.addEventListener("input",()=>$("#mainSearchBtn")?.classList.toggle("ready",!!$("#mainSearch").value.trim()));
$("#menuSearch")?.addEventListener("input",e=>{const q=normalizeText(e.target.value);$$('.drawer-nav a').forEach(a=>a.style.display=(!q||normalizeText(a.dataset.nav||a.innerText).includes(q))?"flex":"none")});
document.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();$("#mainSearch").focus()}if(e.key==="Escape"){closeDrawer();closeModal()}});
