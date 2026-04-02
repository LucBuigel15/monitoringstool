# Monitoringstool

## Setup

1) Install dependencies
```bash
npm install
```

2) Environment variables: create a `.env` file next to `package.json`
```
# Frontend
CORS_ORIGIN = https://monitoringstool-three.vercel.app
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtbHNhZHZseGhybHVzaG93bWVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2ODkxOTQsImV4cCI6MjA3NzI2NTE5NH0.QVFZYjY240QBwtrK6gXf7WVfTX4DfyUhB9P0XzlLjmw
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtbHNhZHZseGhybHVzaG93bWVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY4OTE5NCwiZXhwIjoyMDc3MjY1MTk0fQ.CKAJlemCosPHlI5bFgwo40okBUl7RaugPSbd-Zefes0
VITE_API_BASE_URL = https://monitoringstool-three.vercel.app/api
LOG_LEVEL = info
NODE_ENV = development
VITE_SUPABASE_URL = https://umlsadvlxhrlushowmef.supabase.co
VITE_ADMIN_EMAILS = admin@jouwbedrijf.nl
ADMIN_EMAILS = admin@jouwbedrijf.nl
watchwoord = Appel1
SUPABASE_URL = https://umlsadvlxhrlushowmef.supabase.co
RATE_LIMIT_WINDOW_MS = 900000
RATE_LIMIT_MAX_REQUESTS = 100
```

3) Run servers
```bash
npm run server   # API (Express)
npm run dev      # Frontend (Vite)
```

After changing `.env`, restart both processes.
