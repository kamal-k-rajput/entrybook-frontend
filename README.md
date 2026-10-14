# Entrybook admin

Next.js admin panel for `https://entrybook.greenworldlighting.com`.

The browser calls `/api/v1` on this same host. Next.js forwards those requests to the Nest API (`API_PROXY_TARGET`, default `http://127.0.0.1:3000`).

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Local site: `http://localhost:3001`

Sign in with the API administrator account. Merchants are directed to the mobile app.
