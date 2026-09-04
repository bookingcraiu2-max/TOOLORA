const $ = (s) => document.querySelector(s);

const data = {
  phones: [
    {name:"iPhone 17 Pro", price:"Premium", camera:"Pro camera system", battery:"All-day class"},
    {name:"Galaxy S26 Ultra", price:"Premium", camera:"Multi-camera system", battery:"Large battery"},
    {name:"Pixel 10 Pro", price:"Premium", camera:"Computational photography", battery:"All-day class"}
  ],
  cars: [
    {name:"Dacia Duster", price:"Accesibil", engine:"Benzină / hybrid", type:"SUV"},
    {name:"Toyota RAV4", price:"Mediu", engine:"Hybrid", type:"SUV"},
    {name:"BMW Seria 3", price:"Premium", engine:"Benzină / hybrid", type:"Sedan"}
  ],
  laptops: [
    {name:"MacBook Air", price:"Premium", processor:"Apple Silicon", use:"Productivitate"},
    {name:"Dell XPS", price:"Premium", processor:"Intel", use:"Productivitate"},
    {name:"Lenovo ThinkPad", price:"Mediu", processor:"Intel / AMD", use:"Business"}
  ]
};

function scrollToId(id){ document.getElementById(id)?.scrollIntoView({behavior:"smooth"}); }
document.querySelectorAll("[data-scroll]").forEach(b=>b.addEventListener("click",()=>scrollToId(b.dataset.scroll)));

const search = $("#search"), clearSearch = $("#clearSearch"), noResults = $("#noResults");
function filterTools(){
  const q = search.value.trim().toLowerCase();
  let count = 0;
  document.querySelectorAll(".searchable").forEach(el=>{
    const ok = !q || (el.dataset.search||"").toLowerCase().includes(q);
    el.style.display = ok ? "" : "none";
    if(ok) count++;
  });
  noResults.hidden = count !== 0 || !q;
}
search.addEventListener("input", filterTools);
clearSearch.addEventListener("click",()=>{search.value="";filterTools();search.focus()});

function fillCompare(){
  const list = data[$("#compareCategory").value];
  $("#firstItem").innerHTML = list.map((x,i)=>`<option value="${i}">${x.name}</option>`).join("");
  $("#secondItem").innerHTML = list.map((x,i)=>`<option value="${i}" ${i===1?"selected":""}>${x.name}</option>`).join("");
}
function compare(){
  const list = data[$("#compareCategory").value], a=list[+$("#firstItem").value], b=list[+$("#secondItem").value];
  const keys=[...new Set([...Object.keys(a),...Object.keys(b)])].filter(k=>k!=="name");
  $("#compareResult").innerHTML=`<table class="compare-table"><thead><tr><th>Caracteristică</th><th>${a.name}</th><th>${b.name}</th></tr></thead><tbody>${keys.map(k=>`<tr><td>${k}</td><td>${a[k]||"—"}</td><td>${b[k]||"—"}</td></tr>`).join("")}</tbody></table>`;
}
$("#compareCategory").addEventListener("change",fillCompare); $("#compareBtn").addEventListener("click",compare); fillCompare();

const modal=$("#modal"), modalContent=$("#modalContent");
function openModal(tool){
  const forms={
    rewrite:`<h2>Rescrie natural</h2><p>Versiune locală de demo. Pentru AI real vom conecta un model într-o etapă următoare.</p><textarea id="toolInput" placeholder="Scrie textul aici..."></textarea><button class="primary" onclick="simpleRewrite()">Rescrie</button><div id="toolResult"></div>`,
    description:`<h2>Generator descrieri</h2><p>Introdu produsul și câteva detalii.</p><input id="productName" placeholder="Ex: căști wireless"><textarea id="productDetails" placeholder="Detalii: culoare, utilizare, beneficii..."></textarea><button class="primary" onclick="makeDescription()">Generează</button><div id="toolResult"></div>`,
    translate:`<h2>Traducător</h2><p>Demo local pentru interfață. Traducerea AI reală va fi conectată ulterior.</p><textarea id="toolInput" placeholder="Text de tradus..."></textarea><select id="langTo"><option>English</option><option>Română</option><option>Deutsch</option><option>Français</option><option>Español</option></select><button class="primary" onclick="demoTranslate()">Tradu</button><div id="toolResult"></div>`,
    image:`<h2>Generator imagini</h2><p>Aici vom conecta generatorul de imagini AI. Interfața este pregătită, dar nu consumă API în această versiune.</p>`,
    vat:`<h2>Calculator TVA</h2><input id="amount" type="number" placeholder="Sumă"><input id="vatRate" type="number" value="21" placeholder="TVA %"><div class="modal-actions"><button class="primary" onclick="vatCalc(true)">Adaugă TVA</button><button class="primary" onclick="vatCalc(false)">Scoate TVA</button></div><div id="toolResult"></div>`,
    percent:`<h2>Calculator procent</h2><input id="percentA" type="number" placeholder="Procent"><input id="percentB" type="number" placeholder="Din valoarea"><button class="primary" onclick="percentCalc()">Calculează</button><div id="toolResult"></div>`,
    age:`<h2>Calculator vârstă</h2><input id="birth" type="date"><button class="primary" onclick="ageCalc()">Calculează</button><div id="toolResult"></div>`,
    units:`<h2>Conversie unități</h2><p>Conversii rapide: km ↔ mile și kg ↔ lb.</p><input id="unitVal" type="number" placeholder="Valoare"><select id="unitType"><option value="km">km → mile</option><option value="mile">mile → km</option><option value="kg">kg → lb</option><option value="lb">lb → kg</option></select><button class="primary" onclick="unitCalc()">Convertește</button><div id="toolResult"></div>`,
    password:`<h2>Generator parole</h2><p>Parola este generată local în browser.</p><input id="passLen" type="number" min="8" max="64" value="18"><button class="primary" onclick="genPassword()">Generează</button><div id="toolResult"></div>`,
    names:`<h2>Generator de nume</h2><p>Idei rapide pentru proiecte și branduri.</p><button class="primary" onclick="genName()">Generează</button><div id="toolResult"></div>`,
    recipe:`<h2>Idei de rețete</h2><input id="ingredients" placeholder="Ex: pui, orez, roșii"><button class="primary" onclick="genRecipe()">Dă-mi idei</button><div id="toolResult"></div>`,
    qr:`<h2>QR Code</h2><p>Generatorul QR va fi adăugat în versiunea următoare.</p>`
  };
  modalContent.innerHTML=forms[tool]||"<h2>Tool</h2>";
  modal.hidden=false;
}
document.querySelectorAll(".open-tool").forEach(b=>b.addEventListener("click",()=>openModal(b.dataset.tool)));
function closeModal(){modal.hidden=true} $("#closeModal").addEventListener("click",closeModal); modal.addEventListener("click",e=>{if(e.target.dataset.close)closeModal()}); document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal()});

const result=()=>$("#toolResult");
function simpleRewrite(){const v=$("#toolInput").value.trim();result().innerHTML=`<div class="result">${v? v.replace(/\bfoarte\b/gi,"extrem de").replace(/\butil\b/gi,"practic"):"Introdu un text mai întâi."}</div>`}
function makeDescription(){const n=$("#productName").value.trim()||"Produsul";const d=$("#productDetails").value.trim()||"ușor de folosit și potrivit pentru utilizarea de zi cu zi";result().innerHTML=`<div class="result">${n} este o alegere practică pentru cei care caută ${d}. Un produs simplu, util și potrivit pentru diferite situații.</div>`}
function demoTranslate(){result().innerHTML=`<div class="result">Traducerea reală va fi conectată la AI. Ai ales ${$("#langTo").value}.</div>`}
function vatCalc(add){const a=+$("#amount").value,r=+$("#vatRate").value;if(!a)return result().innerHTML='<div class="result">Introdu o sumă.</div>';const x=add?a*(1+r/100):a/(1+r/100);result().innerHTML=`<div class="result">Rezultat: ${x.toFixed(2)}</div>`}
function percentCalc(){const a=+$("#percentA").value,b=+$("#percentB").value;result().innerHTML=`<div class="result">${((a*b)/100).toFixed(2)}</div>`}
function ageCalc(){const d=new Date($("#birth").value),now=new Date();if(isNaN(d))return;let age=now.getFullYear()-d.getFullYear();const m=now.getMonth()-d.getMonth();if(m<0||(m===0&&now.getDate()<d.getDate()))age--;result().innerHTML=`<div class="result">Ai aproximativ ${age} ani.</div>`}
function unitCalc(){const v=+$("#unitVal").value,t=$("#unitType").value;const f={km:v=>v*.621371,mile:v=>v*1.60934,kg:v=>v*2.20462,lb:v=>v*.453592};result().innerHTML=`<div class="result">${f[t](v).toFixed(3)}</div>`}
function genPassword(){const chars="ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";const n=Math.min(64,Math.max(8,+$("#passLen").value||18));let p="";for(let i=0;i<n;i++)p+=chars[Math.floor(Math.random()*chars.length)];result().innerHTML=`<div class="result">${p}</div>`}
function genName(){const a=["Nova","Luma","Vero","Nexa","Zeno","Mira"],b=["ora","ly","via","hub","lab","flow"];result().innerHTML=`<div class="result">${a[Math.floor(Math.random()*a.length)]}${b[Math.floor(Math.random()*b.length)]}</div>`}
function genRecipe(){const i=$("#ingredients").value.trim()||"ingredientele tale";result().innerHTML=`<div class="result">Idei pentru ${i}: bol rapid, paste, omletă sau salată. În versiunea următoare putem adăuga un generator AI real.</div>`}

$("#language").addEventListener("change",e=>{document.documentElement.lang=e.target.value; if(e.target.value==="en"){document.title="Toolora — Tools in one place"; $(".hero p").textContent="Useful tools, calculators and comparisons in one simple website."; $(".hero h1").innerHTML='Everything you need,<br><span>in one place.</span>';}else{document.title="Toolora — Tools in one place"; $(".hero p").textContent="Toolora adună instrumente utile, calculatoare și comparații într-un site simplu și rapid."; $(".hero h1").innerHTML='Tot ce îți trebuie,<br><span>într-un singur loc.</span>'; }});
