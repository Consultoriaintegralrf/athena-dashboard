// api/metrics.js — Vercel serverless: retorna métricas desde Baserow + n8n Data Table
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const BASEROW_URL = process.env.BASEROW_URL || 'https://api.baserow.io';
  const BASEROW_TOKEN = process.env.BASEROW_TOKEN || '';
  const N8N_URL = process.env.N8N_URL || '';
  const N8N_TOKEN = process.env.N8N_TOKEN || '';

  const days = parseInt(req.query.days || '14');

  try {
    // 1. Fetch posts from Baserow Contenido table (891)
    const postsRes = await fetch(
      `${BASEROW_URL}/api/database/rows/table/891/?user_field_names=true&size=50`,
      { headers: { Authorization: `Token ${BASEROW_TOKEN}` } }
    );
    const postsData = await postsRes.json();
    const posts = (postsData.results || []).filter(p => p.Estado === 'Listo' || p.Estado === 'Programado');

    // 2. Fetch analytics from n8n Data Table
    let analytics = [];
    if (N8N_URL && N8N_TOKEN) {
      try {
        const analyticsRes = await fetch(
          `${N8N_URL}/api/v1/data-tables/XS1zmOHJecBz0N5e/rows?limit=100`,
          { headers: { 'X-N8N-API-KEY': N8N_TOKEN } }
        );
        const aData = await analyticsRes.json();
        analytics = aData.data || aData.rows || aData || [];
      } catch (e) {
        // n8n data table might not be accessible
      }
    }

    // 3. Build metrics summary
    const platformCounts = { Instagram: 0, Facebook: 0, LinkedIn: 0 };
    const pilarCounts = {};
    const pilarEngagement = {};
    
    posts.forEach(p => {
      const plat = p.Plataforma || 'Instagram';
      platformCounts[plat] = (platformCounts[plat] || 0) + 1;
      const pilar = p.Pilar || 'Sin clasificar';
      pilarCounts[pilar] = (pilarCounts[pilar] || 0) + 1;
    });

    // Match analytics with posts
    const recentPosts = posts.slice(0, 20).map(p => {
      const match = analytics.find(a => {
        const aTitle = typeof a === 'object' ? (a.post_titulo || a.data?.post_titulo || '') : '';
        return aTitle === p.Titulo;
      });
      return {
        titulo: (p.Titulo || '').slice(0, 80),
        plataforma: p.Plataforma || 'Instagram',
        pilar: p.Pilar || '',
        formato: p.Formato || '',
        fecha: p.Fecha_publicacion || '',
        objetivo: p.Objetivo || '',
        likes: match ? (match.likes || match.data?.likes || 0) : null,
        comentarios: match ? (match.comentarios || match.data?.comentarios || 0) : null,
        shares: match ? (match.shares || match.data?.shares || 0) : null,
        alcance: match ? (match.alcance || match.data?.alcance || 0) : null,
      };
    });

    res.status(200).json({
      total: posts.length,
      platformCounts,
      pilarCounts,
      recentPosts,
      lastUpdated: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
