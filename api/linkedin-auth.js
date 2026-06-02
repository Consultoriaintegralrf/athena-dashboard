// api/linkedin-auth.js — Vercel serverless: LinkedIn OAuth (initiates AND handles callback)
export default async function handler(req, res) {
  const CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
  const CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
  const REDIRECT_URI = 'https://athena-dashboard-six.vercel.app/api/linkedin-auth';
  
  if (!CLIENT_ID) {
    return res.status(500).json({ error: 'LINKEDIN_CLIENT_ID not configured' });
  }

  // If we received an auth code, exchange it for access token
  if (req.query.code) {
    try {
      const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: req.query.code,
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          redirect_uri: REDIRECT_URI,
        }).toString()
      });
      
      const tokenData = await tokenRes.json();
      
      if (tokenData.error) {
        return res.status(400).json({ error: tokenData.error, description: tokenData.error_description });
      }

      // Store token for future use (in-memory cache, resets on cold start)
      // In production, use a database or Vercel KV
      global.linkedinToken = tokenData.access_token;
      global.linkedinTokenExpiry = Date.now() + (tokenData.expires_in * 1000);

      // Fetch company page info to verify
      const meRes = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      });
      const meData = await meRes.json();

      return res.status(200).json({ 
        success: true, 
        message: 'LinkedIn autorizado correctamente',
        user: meData.name || meData.sub || 'LinkedIn User',
        companyPage: 'https://www.linkedin.com/company/rf-consultoria-integral'
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // No code — initiate OAuth
  const authUrl = 'https://www.linkedin.com/oauth/v2/authorization' +
    `?response_type=code` +
    `&client_id=${CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&scope=openid%20profile%20email%20w_member_social`;

  res.redirect(302, authUrl);
}
