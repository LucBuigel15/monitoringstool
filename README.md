# Monitoringstool

Een vragenlijst-tool voor kindbezoeken (kindbezoeken) bij detentiecentra in Nederland. Meet tevredenheid en welzijn van kinderen tijdens bezoeken.

## Techstack

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Express.js (Node.js)
- **Database**: PostgreSQL (Supabase)
- **Auth**: Supabase Auth

## Features

- 2FA met QR code (lokaal opgeslagen in localStorage)
- Password protection (instelbaar via admin)
- Leeftijdscheiding: <12 = smileys, 12+ = cijfers 1-5
- Drie survey types: regular, ouder_kind, extra_vader_kind
- Admin dashboard met statistics en responses

## Installatie

```bash
cd monitoringstool
npm install
```

## Starten

```bash
# Backend server
npm run server

# Frontend development
npm run dev
```

## Environment Variabelen

Kopieer `.env.example` naar `.env` en vul in:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_ACCESS_PASSWORD=your_password
VITE_ADMIN_EMAILS=admin@example.com
```

## Project Structuur

```
monitoringstool/
├── api/                 # Express API routes
├── src/
│   ├── components/      # React components
│   ├── pages/          # Pagina's (Admin, Survey)
│   ├── services/       # API en Auth services
│   └── constants/     # Constanten (vragen, ratings)
├── supabase/
│   └── schema.sql      # Database schema
└── server.js          # Express server entry
```