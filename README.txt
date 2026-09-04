TOOLORA V4
==========

Ce este nou:
- meniu hamburger cu căutare internă;
- bara principală de căutare funcționează pentru tool-uri și produse;
- AI real pentru rescriere, descrieri, traducere și Smart Compare;
- generator de imagini prin Cloudflare Workers AI + FLUX.1 schnell;
- catalog extins pentru mașini, telefoane și laptopuri;
- Smart Compare acceptă și modele scrise manual, nu doar cele din catalog;
- QR Code reparat cu input de tip text + link de descărcare/deschidere;
- sunete subtile la apăsarea butoanelor, cu buton ON/OFF;
- Text Counter, JSON Formatter, Color Palette, Unit Converter, Age, Slug, Color Picker;
- Image Compressor local în browser;
- design nou cosmic/futurist, textură, grid, orbită și footer „Built by Society.”;
- codul AdSense existent a fost păstrat în <head>.

IMPORTANT — ACTIVAREA AI ÎN CLOUDFLARE
1. Cloudflare Dashboard → Workers & Pages.
2. Deschide proiectul Pages „toolora”.
3. Settings → Bindings.
4. Add → Workers AI.
5. Variable name: AI.
6. Salvează.
7. Redeploy proiectul.

După binding, endpointul /api/ai va activa:
- rewrite
- description
- translate
- compare
- image

Workers AI are o alocare gratuită zilnică de 10.000 Neurons, iar unele modele/consumuri pot necesita plan Paid sau pot genera costuri după depășirea alocării. Verifică dashboard-ul Cloudflare înainte de trafic mare.

NOTĂ DESPRE QR
QR-ul folosește un serviciu extern de generare prin imagine. Dacă serviciul extern nu răspunde temporar, butonul va afișa o eroare și utilizatorul poate încerca din nou.

DEPLOY
Pentru GitHub + Cloudflare Pages, urcă:
- index.html
- style.css
- script.js
- functions/api/ai.js
- README.txt

Nu șterge codul AdSense din index.html.
