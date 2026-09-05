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
function handleFile(file){if(file.size>8*1024*1024){setStatus('Imaginea este prea mare. Folosește un fișier de maximum 8 MB.');return} if(!/^image\/(jpeg|png|webp|heic|heif)$/.test(file.type)){setStatus('Pentru rezolvare, folosește o imagine JPG, PNG, WEBP sau HEIC.');return}state.file=file;const r=new FileReader();r.onload=()=>{state.dataUrl=r.result;$('#previewImg').src=state.dataUrl;$('#fileName').textContent=file.name;$('#preview').hidden=false;$('#dropzone').hidden=true;updateSolve()};r.readAsDataURL(file)}
function updateSolve(){solveBtn.disabled=!(state.file&&classSelect.value&&subjectSelect.value)}
classSelect.addEventListener('change',updateSolve);subjectSelect.addEventListener('change',updateSolve);
function setStatus(t){$('#solveStatus').textContent=t||''}
function answerText(data){return data?.result||data?.response||data?.text||data?.choices?.[0]?.message?.content||'Nu am primit un răspuns valid.'}
async function callAI(body){const res=await fetch('/api/ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});let data={};try{data=await res.json()}catch{}if(!res.ok)throw new Error(data.error||'Serviciul AI nu a putut răspunde acum.');return data}
solveBtn.addEventListener('click',async()=>{if(solveBtn.disabled)return;solveBtn.disabled=true;setStatus('Citesc poza și pregătesc rezolvarea…');try{const data=await callAI({action:'solve',mode:state.mode,grade:classSelect.value,subject:subjectSelect.value,image:state.dataUrl});const text=answerText(data);$('#answerCard').textContent=text;$('#resultSection').hidden=false;$('#resultSection').scrollIntoView({behavior:'smooth',block:'start'});setStatus('Gata.');}catch(e){setStatus(e.message)}finally{updateSolve()}});
$('#copyBtn').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('#answerCard').innerText);$('#copyBtn').textContent='Copiat ✓';setTimeout(()=>$('#copyBtn').textContent='Copiază',1200)}catch{}});
$('#newSolveBtn').addEventListener('click',()=>{window.scrollTo({top:0,behavior:'smooth'});setTimeout(()=>$('#rezolva').scrollIntoView({behavior:'smooth'}),150)});

const messages=$('#messages'), chatInput=$('#chatInput');
function addMsg(text,type){const d=document.createElement('div');d.className='msg '+type;d.textContent=text;messages.appendChild(d);messages.scrollTop=messages.scrollHeight}
async function sendChat(){const text=chatInput.value.trim();if(!text)return;addMsg(text,'user');chatInput.value='';$('#sendChat').disabled=true;const wait=document.createElement('div');wait.className='msg bot';wait.textContent='Mă gândesc…';messages.appendChild(wait);try{const data=await callAI({action:'chat',message:text});wait.textContent=answerText(data)}catch(e){wait.textContent=e.message}finally{$('#sendChat').disabled=false;messages.scrollTop=messages.scrollHeight}}
$('#sendChat').addEventListener('click',sendChat);chatInput.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendChat()}});
try{(adsbygoogle=window.adsbygoogle||[]).push({});(adsbygoogle=window.adsbygoogle||[]).push({})}catch{}
