const SUBJECTS=[
'Matematică','Limba și literatura română','Engleză','Franceză','Germană','Spaniolă','Italiană','Latină','Fizică','Chimie','Biologie','Științe ale naturii','Informatică','TIC','Istorie','Geografie','Economie','Logică','Psihologie','Sociologie','Filosofie','Educație civică','Educație socială','Religie','Ecologie','Astronomie','Arte vizuale','Muzică','Educație tehnologică','Electronică','Electrotehnică','Mecanică','Contabilitate','Marketing','Antreprenoriat','Statistică','Anatomie','Genetică','Algebră','Geometrie','Literatură universală','Literatură română','Gramatică','Sintaxă','Tehnologie','Robotică'
];
const state={mode:'exercise',file:null,dataUrl:null};
const $=s=>document.querySelector(s);
const classSelect=$('#classSelect'), subjectSelect=$('#subjectSelect'), fileInput=$('#fileInput'), solveBtn=$('#solveBtn'), dropzone=$('#dropzone');
function fillSubjects(){subjectSelect.innerHTML='<option value="">Alege materia</option>'+SUBJECTS.map(s=>`<option>${s}</option>`).join('');$('#subjectCloud').innerHTML=SUBJECTS.map(s=>`<span>${s}</span>`).join('')}
fillSubjects();

document.querySelectorAll('.mode').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.mode').forEach(x=>x.classList.remove('active'));btn.classList.add('active');state.mode=btn.dataset.mode}));
$('#menuBtn').addEventListener('click',()=>$('#mobileMenu').classList.toggle('open'));
document.querySelectorAll('.mobile-menu a').forEach(a=>a.addEventListener('click',()=>$('#mobileMenu').classList.remove('open')));
$('#chooseBtn').addEventListener('click',()=>fileInput.click());
$('#cameraBtn').addEventListener('click',()=>{fileInput.setAttribute('capture','environment');fileInput.click();setTimeout(()=>fileInput.removeAttribute('capture'),1000)});
$('#removeBtn').addEventListener('click',()=>{state.file=null;state.dataUrl=null;$('#preview').hidden=true;$('#dropzone').hidden=false;fileInput.value='';updateSolve()});
fileInput.addEventListener('change',e=>{if(e.target.files[0]) handleFile(e.target.files[0])});
['dragenter','dragover'].forEach(ev=>dropzone.addEventListener(ev,e=>{e.preventDefault();dropzone.classList.add('drag')}));['dragleave','drop'].forEach(ev=>dropzone.addEventListener(ev,e=>{e.preventDefault();dropzone.classList.remove('drag')}));dropzone.addEventListener('drop',e=>{const f=e.dataTransfer.files[0];if(f)handleFile(f)});
async function handleFile(file){
  if(file.size>12*1024*1024){setStatus('Imaginea este prea mare. Folosește un fișier de maximum 12 MB.');return}
  if(!/^image\/(jpeg|jpg|png|webp|heic|heif)$/i.test(file.type)){setStatus('Pentru rezolvare, folosește o imagine JPG, PNG, WEBP sau HEIC.');return}
  setStatus('Pregătesc imaginea…');
  try{
    const dataUrl=await optimizeImageForAI(file);
    state.file=file;
    state.dataUrl=dataUrl;
    $('#previewImg').src=dataUrl;
    $('#fileName').textContent=file.name;
    $('#preview').hidden=false;
    $('#dropzone').hidden=true;
    setStatus('Poza este pregătită.');
    updateSolve();
  }catch(e){
    console.error(e);
    setStatus('Nu am putut procesa poza. Încearcă JPG sau PNG.');
  }
}

function optimizeImageForAI(file){
  return new Promise((resolve,reject)=>{
    const url=URL.createObjectURL(file);
    const img=new Image();
    img.onload=()=>{
      try{
        // Păstrăm suficientă rezoluție pentru text, dar micșorăm pozele uriașe
        // pentru ca cererea către AI să fie mai rapidă.
        const maxSide=2400;
        const scale=Math.min(1,maxSide/Math.max(img.naturalWidth,img.naturalHeight));
        const w=Math.max(1,Math.round(img.naturalWidth*scale));
        const h=Math.max(1,Math.round(img.naturalHeight*scale));
        const canvas=document.createElement('canvas');
        canvas.width=w; canvas.height=h;
        const ctx=canvas.getContext('2d',{alpha:false});
        if(!ctx) throw new Error('Canvas unavailable');
        ctx.imageSmoothingEnabled=true;
        ctx.imageSmoothingQuality='high';
        ctx.drawImage(img,0,0,w,h);
        const out=canvas.toDataURL('image/jpeg',0.88);
        URL.revokeObjectURL(url);
        resolve(out);
      }catch(err){URL.revokeObjectURL(url);reject(err)}
    };
    img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Image decode failed'))};
    img.src=url;
  });
}
function updateSolve(){solveBtn.disabled=!(state.file&&classSelect.value&&subjectSelect.value)}
classSelect.addEventListener('change',updateSolve);subjectSelect.addEventListener('change',updateSolve);
function setStatus(t){$('#solveStatus').textContent=t||''}
function answerText(data){return data?.result||data?.response||data?.text||data?.choices?.[0]?.message?.content||'Nu am primit un răspuns valid.'}

// Transformă Markdown/LaTeX-ul trimis de AI într-un text normal, ușor de citit pe telefon.
function formatAIText(text){
  if(!text) return '';
  let s=String(text).replace(/\r\n/g,'\n');

  // Markdown de bază: **text** și __text__ devin text simplu.
  s=s.replace(/\*\*(.*?)\*\*/gs,'$1').replace(/__(.*?)__/gs,'$1');

  // LaTeX fracții simple și radicali.
  for(let i=0;i<8;i++){
    s=s.replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g,'($1)/($2)');
    s=s.replace(/\\sqrt\{([^{}]*)\}/g,'√($1)');
  }

  // Simboluri matematice uzuale.
  const symbols={
    '\\Delta':'Δ','\\cdot':'·','\\times':'×','\\div':'÷','\\pm':'±',
    '\\leq':'≤','\\le':'≤','\\geq':'≥','\\ge':'≥','\\neq':'≠',
    '\\infty':'∞','\\emptyset':'∅','\\in':'∈','\\notin':'∉',
    '\\Rightarrow':'⇒','\\rightarrow':'→','\\leftarrow':'←',
    '\\approx':'≈','\\equiv':'≡','\\pi':'π','\\alpha':'α','\\beta':'β',
    '\\gamma':'γ','\\theta':'θ','\\lambda':'λ','\\sum':'Σ'
  };
  for(const [from,to] of Object.entries(symbols)) s=s.split(from).join(to);

  // Elimină delimitatorii LaTeX rămași și comenzile de spațiere.
  s=s.replace(/\\\(|\\\)|\\\[|\\\]/g,'');
  // Unele modele folosesc $...$ pentru formule; pe site vrem textul fără delimitatori.
  s=s.replace(/\$/g,'');
  s=s.replace(/\\(?:text|mathrm|mathbf|mathit|operatorname)\{([^{}]*)\}/g,'$1');
  s=s.replace(/\\,/g,' ').replace(/\\;/g,' ').replace(/\\!/g,'');

  // ^2, ^3, _1 etc. → caractere Unicode pentru formule mai naturale.
  const sup={'0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹','+':'⁺','-':'⁻','=':'⁼','(':'⁽',')':'⁾','n':'ⁿ','x':'ˣ'};
  s=s.replace(/\^\{([^{}]+)\}|\^([0-9+\-=()xn])/g,(_,a,b)=>[...(a||b)].map(c=>sup[c]||c).join(''));

  // Listează fracțiile rămase fără paranteze inutile și normalizează spațiile.
  s=s.replace(/\(([^()\n]+)\)\/\(([^()\n]+)\)/g,'$1/$2');
  s=s.replace(/\n{3,}/g,'\n\n').trim();
  return s;
}
async function callAI(body){const res=await fetch('/api/ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});let data={};try{data=await res.json()}catch{}if(!res.ok)throw new Error(data.error||'Serviciul AI nu a putut răspunde acum.');return data}
solveBtn.addEventListener('click',async()=>{if(solveBtn.disabled)return;solveBtn.disabled=true;setStatus('Citesc poza și pregătesc rezolvarea…');try{const data=await callAI({action:'solve',mode:state.mode,grade:classSelect.value,subject:subjectSelect.value,image:state.dataUrl});const text=formatAIText(answerText(data));$('#answerCard').textContent=text;$('#resultSection').hidden=false;$('#resultSection').scrollIntoView({behavior:'smooth',block:'start'});setStatus('Gata.');}catch(e){setStatus(e.message)}finally{updateSolve()}});
$('#copyBtn').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('#answerCard').innerText);$('#copyBtn').textContent='Copiat ✓';setTimeout(()=>$('#copyBtn').textContent='Copiază',1200)}catch{}});
$('#newSolveBtn').addEventListener('click',()=>{window.scrollTo({top:0,behavior:'smooth'});setTimeout(()=>$('#rezolva').scrollIntoView({behavior:'smooth'}),150)});

const messages=$('#messages'), chatInput=$('#chatInput');
function addMsg(text,type){const d=document.createElement('div');d.className='msg '+type;d.textContent=text;messages.appendChild(d);messages.scrollTop=messages.scrollHeight}
async function sendChat(){const text=chatInput.value.trim();if(!text)return;addMsg(text,'user');chatInput.value='';$('#sendChat').disabled=true;const wait=document.createElement('div');wait.className='msg bot';wait.textContent='Mă gândesc…';messages.appendChild(wait);try{const data=await callAI({action:'chat',message:text});wait.textContent=formatAIText(answerText(data))}catch(e){wait.textContent=e.message}finally{$('#sendChat').disabled=false;messages.scrollTop=messages.scrollHeight}}
$('#sendChat').addEventListener('click',sendChat);chatInput.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendChat()}});
try{(adsbygoogle=window.adsbygoogle||[]).push({});(adsbygoogle=window.adsbygoogle||[]).push({})}catch{}
