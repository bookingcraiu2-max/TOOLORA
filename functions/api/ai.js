const MODEL = '@cf/google/gemma-4-26b-a4b-it';
const MAX_BODY = 11 * 1024 * 1024;

const SCHOOL_SYSTEM = `Ești Toolora School, un asistent AI pentru elevi din România, clasele V-XII. Răspunde în română dacă utilizatorul nu cere altă limbă. Rolul tău este să rezolvi corect exerciții, teme și teste și să explici simplu, la nivelul clasei.

CÂND PRIMEȘTI O IMAGINE:
- Examinează întreaga imagine, de sus până jos și de la stânga la dreapta.
- Citește toate exercițiile, toate rândurile, numerele, semnele, fracțiile, puterile, tabelele și unitățile care sunt vizibile.
- Pentru scris de mână, interpretează cu atenție forma cifrelor și simbolurilor; verifică de două ori caracterele ambigue.
- Nu sări peste un exercițiu doar pentru că este într-un colț sau mai jos în imagine.
- Înainte de rezolvare, verifică mental că ai identificat corect cerința și datele.
- Nu inventa niciun caracter, număr sau cuvânt care nu poate fi citit.
- Dacă o zonă este realmente ilizibilă, spune exact ce zonă/item nu poate fi citit și cere o fotografie mai clară.
- Dacă poți citi doar o parte din imagine, rezolvă partea lizibilă și spune clar ce lipsește.
- Pentru matematică, fizică și chimie verifică semnele, calculele, formulele și unitățile înainte de răspuns.
- Păstrează ordinea și numerotarea exercițiilor.

Răspunsurile trebuie să fie directe, clare și fără umplutură. Nu inventa surse și nu pretinde că ai verificat ceva extern.`;
const CHAT_SYSTEM = `${SCHOOL_SYSTEM}\n\nAcesta este Toolora ChatBot. Vorbești DOAR despre școală, educație și viața de elev: lecții, teme, exerciții, examene, metode de învățare, colegi, profesori, bullying, stres școlar, organizare și orientare educațională. Dacă întrebarea nu are legătură cu școala, spune politicos că acest chatbot este dedicat școlii și readu conversația la un subiect școlar. Pentru bullying sau situații care pot pune elevul în pericol, încurajează discutarea cu un adult de încredere, profesor, consilier școlar sau serviciile de urgență când există pericol imediat.`;

function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}})}
function cleanDataUrl(s){if(typeof s!=='string')return null;if(!/^data:image\/(jpeg|jpg|png|webp);base64,/i.test(s))return null;if(s.length>10*1024*1024)return null;return s}

export async function onRequestPost({request,env}){
  try{
    if(!env.AI)return json({error:'AI binding-ul Cloudflare nu este configurat.'},503);
    const len=Number(request.headers.get('content-length')||0);
    if(len>MAX_BODY)return json({error:'Imaginea este prea mare.'},413);
    const body=await request.json();

    if(body.action==='chat'){
      const message=String(body.message||'').trim();
      if(!message)return json({error:'Scrie un mesaj.'},400);
      if(message.length>5000)return json({error:'Mesajul este prea lung.'},413);
      const out=await env.AI.run(MODEL,{messages:[
        {role:'system',content:CHAT_SYSTEM},
        {role:'user',content:message}
      ],max_tokens:800,temperature:.2,chat_template_kwargs:{enable_thinking:false}});
      return json(out);
    }

    if(body.action!=='solve')return json({error:'Acțiune necunoscută.'},400);
    const image=cleanDataUrl(body.image);
    if(!image)return json({error:'Nu am primit o imagine JPG, PNG sau WEBP validă.'},400);

    const grade=String(body.grade||'').trim();
    const subject=String(body.subject||'').trim();
    const mode=String(body.mode||'exercise').trim();
    if(!grade||!subject)return json({error:'Alege clasa și materia.'},400);

    const modeLabel={exercise:'exercițiu',homework:'temă',test:'test'}[mode]||'exercițiu';
    const thinking=mode!=='exercise';
    const maxTokens=mode==='exercise'?1600:2000;
    const prompt=`Rezolvă această ${modeLabel} pentru un elev din clasa ${grade}, materia ${subject}.

PROCESARE IMAGINE — OBLIGATORIU:
1. Inspectează fiecare zonă a imaginii înainte să răspunzi.
2. Identifică toate itemele vizibile și păstrează numerotarea lor.
3. Verifică atent cifrele, semnele minus/plus, egal, parantezele, exponenții, fracțiile și unitățile.
4. Dacă este scris de mână, fii atent la cifre și simboluri asemănătoare.
5. Nu presupune ce scrie într-o zonă neclară și nu completa din imaginație.
6. Dacă o parte este ilizibilă, menționează exact exercițiul/rândul afectat.

REZOLVARE:
- Rezolvă toate exercițiile pe care le poți citi.
- Pentru fiecare item: răspuns final + doar pașii esențiali.
- Dacă sunt mai multe exerciții, separă-le clar și în aceeași ordine ca în poză.
- Verifică rezultatul înainte de răspuns.
- Răspunde în română, fără introduceri inutile.
- Nu reda toată transcrierea imaginii decât dacă este necesară pentru a explica o neclaritate.`;

    const out=await env.AI.run(MODEL,{messages:[
      {role:'system',content:SCHOOL_SYSTEM},
      {role:'user',content:[
        {type:'text',text:prompt},
        {type:'image_url',image_url:{url:image}}
      ]}
    ],max_tokens:maxTokens,temperature:.1,chat_template_kwargs:{enable_thinking:thinking}});
    return json(out);
  }catch(e){
    console.error(e);
    return json({error:'Toolora AI a întâmpinat o problemă. Încearcă din nou în câteva secunde.'},500)
  }
}

export async function onRequestGet(){return json({service:'Toolora School AI',status:'ok'});}
