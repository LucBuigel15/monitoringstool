# Monitoringstool

Een vragenlijst-tool voor kindbezoeken bij detentiecentra in Nederland. Meet tevredenheid en welzijn van kinderen tijdens bezoeken.

---

## Techstack

<p align="left">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white" height="28" alt="React">
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" height="28" alt="Vite">
  <img src="https://img.shields.io/badge/Tailwind_CSS-38BDF8?style=for-the-badge&logo=tailwind-css&logoColor=white" height="28" alt="Tailwind">
  <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" height="28" alt="Express">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white" height="28" alt="Node.js">
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" height="28" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" height="28" alt="Supabase">
</p>

---

## Features

| Feature | Beschrijving |
|---------|-------------|
| 2FA | QR code authenticatie (localStorage) |
| Password | Wachtwoord instelbaar via admin |
| Leeftijdscheiding | <12: smileys, 12+: cijfers 1-5 |
| Survey Types | Regulier, Ouder-Kind, Extra Vader-Kind |
| Admin Dashboard | Statistics en responses |
| Auto-advance | Automatisch naar volgende vraag |
| State persistence | Survey blijft behouden bij refresh |

---

## Installatie

```bash
cd monitoringstool
npm install
```

---

## Starten

```bash
# Backend server
npm run server

# Frontend development
npm run dev
```

---

## Environment Variabelen

Kopieer `.env.example` naar `.env`:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_ACCESS_PASSWORD=je_wachtwoord
VITE_ADMIN_EMAILS=admin@example.com
```

---

## Project Structuur

```
monitoringstool/
├── server/                # Express server
│   ├── server.js          # Main server
│   ├── api/              # Vercel serverless
│   └── validation/       # Joi schemas
├── src/
│   ├── components/       # React components
│   ├── pages/            # Admin, Survey
│   ├── services/         # API en Auth
│   └── constants/        # Vragen, ratings
├── supabase/
│   └── schema.sql        # Database schema
└── docker/               # Docker bestanden
```

---

## Deployment

### Vercel (aanbevolen)

1. Connect GitHub repo aan Vercel
2. Environment variabelen instellen
3. Deploy automatisch

### Docker

```bash
docker build -t monitoringstool .
docker run -p 5000:5000 monitoringstool
```

---

## Health Check

`GET /api/health` - voor pings en status