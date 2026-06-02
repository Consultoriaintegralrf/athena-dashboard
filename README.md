# Athena Dashboard 🦉

Dashboard interactivo de analítica de redes sociales para RF Consultoría Integral.

## Stack
- **Frontend:** HTML5 + CSS3 + Chart.js (CDN)
- **Backend:** Vercel Serverless Functions (Node.js)
- **Datos:** Baserow API + n8n Data Table

## Estructura
```
athena-dashboard/
├── api/
│   └── metrics.js          # API serverless (proxy a Baserow)
├── public/
│   └── index.html           # Dashboard interactivo
├── vercel.json              # Config Vercel
├── package.json
└── .env.example             # Variables de entorno requeridas
```

## Despliegue en Vercel

### Opción 1: Vercel CLI (recomendado)
```bash
cd athena-dashboard
npm install
npx vercel login        # Solo la primera vez
npx vercel              # Deploy a preview
npx vercel --prod       # Deploy a producción
```

### Opción 2: GitHub + Vercel Dashboard
1. Sube este proyecto a un repo de GitHub
2. En [vercel.com](https://vercel.com), importa el repo
3. Agrega las variables de entorno (ver .env.example)
4. Deploy automático en cada push

## Variables de Entorno (Vercel Dashboard)
Configurar en Settings > Environment Variables:

| Variable | Valor |
|---|---|
| `BASEROW_URL` | URL de tu instancia Baserow |
| `BASEROW_TOKEN` | Token de API de Baserow |
| `N8N_URL` | URL de tu instancia n8n |
| `N8N_TOKEN` | API Key de n8n |
