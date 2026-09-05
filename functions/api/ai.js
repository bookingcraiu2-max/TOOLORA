const MODEL = '@cf/google/gemma-4-26b-a4b-it';
const MAX_BODY = 11 * 1024 * 1024;

const SCHOOL_SYSTEM = `Ești Toolora School, un asistent AI pentru elevi din România, clasele V-XII. Răspunde în română dacă utilizatorul nu cere altă limbă. Ai rol educațional: rezolvă corect exerciții, teme și teste, explică pe înțelesul clasei și nu inventa informații. Pentru imagini, citește cu atenție textul, formulele, tabelele și scrisul de mână. Dacă ceva nu este lizibil, spune exact ce nu poți citi și cere o fotografie mai clară; nu ghici. Pentru probleme matematice/fizică/chimie verifică rezultatul și unitățile. Pentru teste, păstrează ordinea subiectelor și numerotarea. Utilizatorul a cerut răspunsuri directe și explicații scurte, deci evită umplutura. Nu susține că ai verificat o sursă externă dacă nu ai făcut-o.`;
const CHAT_SYSTEM = `${SCHOOL_SYSTEM}\n\nAcesta este Toolora ChatBot. Vorbești DOAR despre școală, educație și viața de elev: lecții, teme, exerciții, examene, metode de învățare, colegi, profesori, bullying, stres școlar, organizare și orientare educațională. Dacă întrebarea nu are legătură cu școala, spune politicos că acest chatbot este dedicat școlii și readu conversația la un subiect școlar. Pentru bullying sau situații care pot pune elevul în pericol, încurajează discutarea cu un adult de încredere, profesor, consilier școlar sau serviciile de urgență când există pericol imediat.`;

function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}})}
function cleanDataUrl(s){if(typeof s!=='string')return null;if(!s.startsWith('data:image/'))return null;if(s.length>10*1024*1024)return null;return s}

export async function onRequestPost({request,env}){
  try{
    if(!env.AI)return json({error:'AI binding-ul Cloudflare nu este configurat.'},503);
    const len=Number(request.headers.get('content-length')||0); if(len>MAX_BODY)return json({error:'Cererea este prea mare.'},413);
    const body=await request.json();
    if(body.action==='chat'){
      const message=String(body.message||'').trim(); if(!message)return json({error:'Scrie un mesaj.'},400); if(message.length>5000)return json({error:'Mesajul este prea lung.'},413);
      const out=await env.AI.run(MODEL,{messages:[{role:'system',content:CHAT_SYSTEM},{role:'user',content:message}],max_tokens:900,temperature:.25,chat_template_kwargs:{enable_thinking:false}});
      return json(out);
    }
    if(body.action!=='solve')return json({error:'Acțiune necunoscută.'},400);
    const image=cleanDataUrl(body.image); if(!image)return json({error:'Nu am primit o imagine validă.'},400);
    const grade=String(body.grade||'').trim(); const subject=String(body.subject||'').trim(); const mode=String(body.mode||'exercise').trim();
    if(!grade||!subject)return json({error:'Alege clasa și materia.'},400);
    const modeLabel={exercise:'exercițiu',homework:'temă',test:'test'}[mode]||'exercițiu';
    const prompt=`Rezolvă această ${modeLabel} pentru un elev din clasa ${grade}, materia ${subject}.\n\nINSTRUCȚIUNI: identifică exact cerințele din imagine; rezolvă toate elementele vizibile și lizibile; păstrează numerotarea; pentru fiecare item oferă răspunsul final și doar pașii esențiali; dacă sunt mai multe exerciții, separă-le clar; nu inventa textul lipsă. Dacă fotografia este neclară, spune ce porțiune trebuie refotografiată. Răspunde în română și nu începe cu formule de politețe inutile.`;
    const out=await env.AI.run(MODEL,{messages:[{role:'system',content:SCHOOL_SYSTEM},{role:'user',content:[{type:'text',text:prompt},{type:'image_url',image_url:{url:image}}]}],max_tokens:2200,temperature:.15,chat_template_kwargs:{enable_thinking:true}});
    return json(out);
  }catch(e){console.error(e);return json({error:'Toolora AI a întâmpinat o problemă. Încearcă din nou în câteva secunde.'},500)}
}

export async function onRequestGet(){return json({service:'Toolora School AI',status:'ok'});}
