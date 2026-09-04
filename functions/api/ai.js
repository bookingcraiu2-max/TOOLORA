const FREE_LIMIT = 5;

async function supabaseRequest(env, path, options = {}) {
  const base = String(env.SUPABASE_URL || "").replace(/\/$/, "");
  if (!base || !env.SUPABASE_ANON_KEY) throw new Error("Supabase nu este configurat pe Cloudflare.");
  const headers = new Headers(options.headers || {});
  headers.set("apikey", env.SUPABASE_ANON_KEY);
  return fetch(`${base}${path}`, {...options, headers});
}

async function getUser(env, authHeader) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const r = await supabaseRequest(env, "/auth/v1/user", {headers:{Authorization:authHeader}});
  if (!r.ok) return null;
  return r.json();
}

async function consumeCredit(env, userId) {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("Supabase service key nu este configurată pe Cloudflare.");
  const base = String(env.SUPABASE_URL || "").replace(/\/$/, "");
  const monthKey = new Date().toISOString().slice(0,7);
  const r = await fetch(`${base}/rest/v1/rpc/toolora_consume_credit`, {
    method:"POST",
    headers:{
      "apikey":env.SUPABASE_SERVICE_ROLE_KEY,
      "Authorization":`Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type":"application/json"
    },
    body:JSON.stringify({p_user_id:userId,p_month_key:monthKey,p_limit:FREE_LIMIT})
  });
  if(!r.ok) throw new Error("Nu am putut verifica limita contului.");
  const data=await r.json();
  const row=Array.isArray(data)?data[0]:data;
  return row || {allowed:false,used:0,remaining:0,plan:"free"};
}

export async function onRequestPost(context) {
  const { request, env } = context;
  let body;
  try { body = await request.json(); } catch { return Response.json({error:"Cerere invalidă."},{status:400}); }
  const action = String(body.action || "");
  const input = String(body.input || "").trim().slice(0,12000);
  if (!input) return Response.json({error:"Lipsește textul."},{status:400});
  if (!env.AI) return Response.json({error:"Workers AI nu este conectat încă. În Cloudflare: Workers & Pages → Toolora → Settings → Bindings → Workers AI, variable `AI`, apoi Redeploy."},{status:503});

  const user = await getUser(env, request.headers.get("Authorization"));
  if (!user?.id) return Response.json({error:"Trebuie să fii conectat la un cont Toolora pentru funcțiile AI."},{status:401});

  let credit;
  try { credit = await consumeCredit(env, user.id); }
  catch (e) { return Response.json({error:e.message || "Nu am putut verifica limita contului."},{status:503}); }
  if (!credit.allowed) return Response.json({error:"Ai folosit cele 5 credite AI gratuite pentru luna aceasta. Treci la Toolora Pro pentru mai multe utilizări.",used:credit.used,remaining:0,plan:credit.plan},{status:402});

  const model = "@cf/zai-org/glm-4.7-flash";
  let system = "Ești motorul AI al Toolora. Răspunde în limba utilizatorului, natural, clar și fără introduceri inutile.";
  let prompt = input;

  if (action === "assistant") {
    system = "Ești Toolora Assistant. Ajută utilizatorul să rezolve rapid problema. Fii practic, explică în pași scurți, oferă exemple când ajută și nu inventa date. Răspunde în română.";
    prompt = input;
  } else if (action === "image") {
    const ratio = body.ratio === "wide" ? "landscape composition, 16:9 framing" : body.ratio === "portrait" ? "portrait composition, vertical framing" : "square composition";
    try {
      const response = await env.AI.run("@cf/black-forest-labs/flux-1-schnell", {prompt:`${input}. ${ratio}. High detail, strong composition, realistic materials, professional lighting.`,steps:4,seed:Math.floor(Math.random()*1000000000)});
      const encoded=response?.image || response?.response || response?.result?.image;
      if(!encoded) throw new Error("Imaginea nu a fost returnată de model.");
      return Response.json({dataURI:`data:image/jpeg;base64,${encoded}`,used:credit.used,remaining:credit.remaining,plan:credit.plan});
    } catch {
      return Response.json({error:"Generarea imaginii a eșuat. Verifică Workers AI și încearcă din nou."},{status:502});
    }
  } else if (action === "rewrite") {
    const style = String(body.style || "natural");
    prompt = `Rescrie următorul text în stil ${style}. Păstrează ideea și informația, dar schimbă real formulările, ordinea unde ajută și ritmul. Nu copia propozițiile doar cu sinonime. Nu adăuga afirmații noi. Returnează doar varianta rescrisă.\n\nTEXT:\n${input}`;
  } else if (action === "description") {
    const tone = String(body.tone || "natural");
    prompt = `Scrie o descriere originală pentru produsul de mai jos, în ton ${tone}. Include un titlu scurt, 4 beneficii în bullets și un paragraf de descriere. Nu inventa specificații care nu apar în input. Returnează în română.\n\nPRODUS:\n${input}`;
  } else if (action === "translate") {
    const language = String(body.language || "English");
    prompt = `Tradu exact sensul textului în ${language}. Păstrează tonul și formatarea pe cât posibil. Nu explica traducerea și nu adăuga comentarii.\n\nTEXT:\n${input}`;
  } else if (action === "compare") {
    const category = String(body.category || "products");
    system = "Ești motorul de comparații Toolora. Fii practic. Nu inventa specificații exacte dacă nu ești sigur. Separă clar ce este cert de ce poate varia după an/model. Răspunde în română.";
    prompt = `Compară aceste două produse din categoria ${category}: ${input}. Structurează răspunsul astfel: Verdict scurt; Avantaje A; Avantaje B; Diferențe importante; Pentru cine aș alege A; Pentru cine aș alege B; Ce trebuie verificat înainte de cumpărare. Dacă modelul e necunoscut sau există mai multe generații, spune asta în loc să inventezi.`;
  } else {
    return Response.json({error:"Acțiune necunoscută."},{status:400});
  }

  try {
    const response = await env.AI.run(model,{messages:[{role:"system",content:system},{role:"user",content:prompt}],max_completion_tokens:1200,temperature:action === "rewrite" || action === "description" ? 0.85 : 0.35});
    const text=response?.choices?.[0]?.message?.content||response?.response||"";
    return Response.json({text:String(text).trim(),used:credit.used,remaining:credit.remaining,plan:credit.plan});
  } catch {
    return Response.json({error:"Motorul AI a returnat o eroare. Verifică binding-ul Workers AI și încearcă din nou."},{status:502});
  }
}

export async function onRequestGet() { return Response.json({ok:true,service:"Toolora AI",message:"POST /api/ai pentru funcțiile AI. Necesită cont Toolora."}); }
