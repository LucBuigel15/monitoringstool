# Monitoringstool

Vragenlijst-tool voor kindbezoeken bij detentiecentra in Nederland.

## Techstack
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Express.js
- **Database**: PostgreSQL (Supabase)
- **Auth**: Supabase Auth

## Features
- 2FA met QR code (localStorage)
- Password protection
- Leeftijdscheiding: <12 = smileys, 12+ = cijfers
- Survey types: regular, ouder_kind, extra_vader_kind
- Admin dashboard

## Starten
```bash
npm install
npm run server  # API
npm run dev     # Frontend
```

## Env variabelen
Kopieer `.env.example` naar `.env`