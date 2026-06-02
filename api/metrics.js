// api/metrics.js — Vercel serverless: retorna métricas + estrategias desde Baserow
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const BASEROW_URL = process.env.BASEROW_URL || 'https://api.baserow.io';
  const BASEROW_TOKEN = process.env.BASEROW_TOKEN || '';

  const days = parseInt(req.query.days || '30');

  try {
    const postsRes = await fetch(
      `${BASEROW_URL}/api/database/rows/table/891/?user_field_names=true&size=200`,
      { headers: { Authorization: `Token ${BASEROW_TOKEN}` } }
    );
    
    if (!postsRes.ok) throw new Error(`Baserow API error: ${postsRes.status}`);
    
    const postsData = await postsRes.json();
    let posts = postsData.results || [];

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    
    // Detect strategies per post
    function detectStrategies(post) {
      const strategies = [];
      const contenido = (post.Contenido || '').toLowerCase();
      const titulo = (post.Titulo || '').toLowerCase();
      const cta = (post.CTA || '').toLowerCase();
      const formato = post.Formato || '';
      const pilar = post.Pilar || '';
      const objetivo = post.Objetivo || '';
      
      // 9a: Viaje del Héroe (storytelling posts with problem→solution structure)
      if ((objetivo === 'Prospección' || objetivo === 'Crecimiento') && 
          (contenido.includes('me dijo') || contenido.includes('cliente') || 
           contenido.includes('resultado') || contenido.includes('ahorró'))) {
        strategies.push('9a');
      }
      
      // 9b: Contraste de Precios
      if (contenido.includes('$') && (contenido.includes('vs') || contenido.includes('cobraba') || 
          contenido.includes('contra') || contenido.includes('ahorrar') || contenido.includes('costaba'))) {
        strategies.push('9b');
      }
      
      // 9c: CTA Ultra-Bajo-Esfuerzo (keyword 1 palabra)
      if (cta.includes('comenta') && (
          cta.includes('opus') || cta.includes('agente') || cta.includes('info') ||
          cta.includes('whatsapp') || cta.includes('prompts') || cta.includes('anuncio') ||
          cta.includes('automatiza') || cta.includes('ia'))) {
        strategies.push('9c');
      }
      
      // 9d: Tutorial Visual (carrusel + IA/Automatización)
      if (formato === 'Carrusel' && (pilar === 'IA' || pilar === 'Automatización')) {
        strategies.push('9d');
      }
      
      // 9e: Multiagente como Autoridad
      if (contenido.includes('agente') || contenido.includes('aria') || 
          contenido.includes('dafne') || contenido.includes('multiagente') ||
          contenido.includes('monitor') || titulo.includes('agente')) {
        strategies.push('9e');
      }
      
      // 9f: Densidad de CTAs (carrusel 6+ slides)
      if (formato === 'Carrusel' && (contenido.match(/slide\s*\d/i) || []).length >= 6) {
        strategies.push('9f');
      }
      
      return strategies;
    }

    const filteredPosts = posts.filter(p => {
      if (!p.Fecha_publicacion) return false;
      return new Date(p.Fecha_publicacion + 'T12:00:00') >= cutoff;
    });

    const platformCounts = {};
    const pilarCounts = {};
    const strategyCounts = {};
    const strategyByWeek = {};
    
    filteredPosts.forEach(p => {
      const plat = p.Plataforma || 'Instagram';
      platformCounts[plat] = (platformCounts[plat] || 0) + 1;
      const pilar = p.Pilar || 'Sin clasificar';
      pilarCounts[pilar] = (pilarCounts[pilar] || 0) + 1;
      
      // Strategy tracking
      const strategies = detectStrategies(p);
      strategies.forEach(s => { strategyCounts[s] = (strategyCounts[s] || 0) + 1; });
      
      // Weekly strategy evolution
      if (p.Fecha_publicacion) {
        const d = new Date(p.Fecha_publicacion + 'T12:00:00');
        const weekKey = `${d.getFullYear()}-W${String(Math.ceil(d.getDate()/7)).padStart(2,'0')}`;
        if (!strategyByWeek[weekKey]) strategyByWeek[weekKey] = {};
        strategies.forEach(s => { strategyByWeek[weekKey][s] = (strategyByWeek[weekKey][s]||0)+1; });
      }
    });

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
      estrategias: detectStrategies(p),
      likes: null, comentarios: null, shares: null, alcance: null,
    }));

    recentPosts.sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));

    res.status(200).json({
      total: filteredPosts.length,
      platformCounts,
      pilarCounts,
      strategyCounts,
      strategyByWeek,
      recentPosts,
      lastUpdated: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
