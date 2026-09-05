TOOLORA SCHOOL

Versiune nouă, fără cont și fără abonament.

Structură:
- index.html — interfața principală
- style.css — design minimalist, student-focused
- script.js — upload/camera, rezolvare, chatbot, UI
- functions/api/ai.js — Cloudflare Pages Function pentru Workers AI

AI:
- Model: @cf/google/gemma-4-26b-a4b-it
- Vision + OCR + handwriting + reasoning
- Workers AI binding necesar: AI

Cloudflare Pages:
1. Urcă toate fișierele în repo.
2. Project settings → Functions/Workers AI → binding AI.
3. Deploy.
4. Testează /api/ai în browser: trebuie să răspundă JSON cu service/status.

IMPORTANT:
- Site-ul este pregătit pentru imagini JPG/PNG/WEBP/HEIC până la 8 MB.
- Camera de pe telefon este declanșată prin input capture=environment.
- PDF este afișat în textul UI pentru compatibilitate viitoare, dar endpointul de rezolvare din această versiune acceptă imagine.
- Fără cont înseamnă că trebuie adăugată ulterior o protecție anti-abuz/rate limit înainte de trafic mare, pentru a proteja bugetul Workers AI.
- AdSense scriptul și sloturile automate sunt păstrate.
- Nu există Supabase, Stripe, login, credite, Pro sau Ultimate în această versiune.
