// api/metrics.js — Vercel serverless: retorna métricas desde Baserow
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const BASEROW_URL = process.env.BASEROW_URL || 'https://api.baserow.io';
  const BASEROW_TOKEN = process.env.BASEROW_TOKEN || '';

  const days = parseInt(req.query.days || '30');

  try {
    // Fetch ALL posts from Baserow Contenido table (891) — sin filtrar por estado
    const postsRes = await fetch(
      `${BASEROW_URL}/api/database/rows/table/891/?user_field_names=true&size=200`,
      { headers: { Authorization: `Token ${BASEROW_TOKEN}` } }
    );
    
    if (!postsRes.ok) throw new Error(`Baserow API error: ${postsRes.status}`);
    
    const postsData = await postsRes.json();
    let posts = postsData.results || [];

    // Filter by date range
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    
    const filteredPosts = posts.filter(p => {
      if (!p.Fecha_publicacion) return false;
      const postDate = new Date(p.Fecha_publicacion + 'T12:00:00');
      return postDate >= cutoff;
    });

    // Build metrics summary
    const platformCounts = {};
    const pilarCounts = {};
    
    filteredPosts.forEach(p => {
      const plat = p.Plataforma || 'Instagram';
      platformCounts[plat] = (platformCounts[plat] || 0) + 1;
      const pilar = p.Pilar || 'Sin clasificar';
      pilarCounts[pilar] = (pilarCounts[pilar] || 0) + 1;
    });

    // Map posts to response format with all fields
    const recentPosts = filteredPosts.map(p => ({
      titulo: p.Titulo || '',
      plataforma: p.Plataforma || 'Instagram',
      pilar: p.Pilar || '',
      formato: p.Formato || '',
      fecha: p.Fecha_publicacion || '',
      horario: p.Horario_recomendado || '',
      objetivo: p.Objetivo || '',
      estado: p.Estado || '',
      cta: p.CTA || '',
      // Métricas pendientes de scrapear por Athena
      likes: null,
      comentarios: null,
      shares: null,
      alcance: null,
    }));

    // Sort by date descending
    recentPosts.sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));

    res.status(200).json({
      total: filteredPosts.length,
      platformCounts,
      pilarCounts,
      recentPosts,
      lastUpdated: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
