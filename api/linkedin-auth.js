// api/linkedin-auth.js — Vercel serverless: LinkedIn OAuth redirect
export default async function handler(req, res) {
  const CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
  const REDIRECT_URI = process.env.LINKEDIN_REDIRECT_URI || 'https://athena-dashboard-six.vercel.app/api/linkedin-callback';
  
  if (!CLIENT_ID) {
    return res.status(500).json({ error: 'LINKEDIN_CLIENT_ID not configured' });
  }

  const authUrl = 'https://www.linkedin.com/oauth/v2/authorization' +
    `?response_type=code` +
    `&client_id=${CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&scope=openid%20profile%20email%20w_member_social%20r_organization_social%20rw_organization_admin`;

  res.redirect(302, authUrl);
}
