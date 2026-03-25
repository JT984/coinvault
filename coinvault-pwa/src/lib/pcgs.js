/**
 * PCGS API lookup service.
 *
 * The PCGS API uses OAuth2 (password grant). Because this is a client-side
 * app, credentials must NEVER be hard-coded. Store them in app Settings
 * (saved to localStorage) and pass them here at call time.
 *
 * To get PCGS API credentials:
 *   1. Create a free account at https://www.pcgs.com
 *   2. Apply for API access at https://www.pcgs.com/publicapi
 *   3. Paste your Client ID, Client Secret, username, and password
 *      into the Settings screen in this app.
 */

const PCGS_TOKEN_KEY = 'coinvault_pcgs_token';
const PCGS_TOKEN_EXPIRY_KEY = 'coinvault_pcgs_token_expiry';

async function getPCGSToken(creds) {
  // Return cached token if still valid
  const cached = localStorage.getItem(PCGS_TOKEN_KEY);
  const expiry = localStorage.getItem(PCGS_TOKEN_EXPIRY_KEY);
  if (cached && expiry && Date.now() < parseInt(expiry)) return cached;

  const body = new URLSearchParams({
    grant_type: 'password',
    client_id: creds.clientId,
    client_secret: creds.clientSecret,
    username: creds.username,
    password: creds.password,
  });

  const res = await fetch('https://api.pcgs.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) throw new Error('PCGS authentication failed');
  const data = await res.json();
  const token = data.access_token;
  const expiresIn = (data.expires_in || 3600) * 1000;

  localStorage.setItem(PCGS_TOKEN_KEY, token);
  localStorage.setItem(PCGS_TOKEN_EXPIRY_KEY, String(Date.now() + expiresIn - 60000));
  return token;
}

export async function lookupPCGS(certNumber, creds) {
  if (!creds?.clientId) throw new Error('PCGS credentials not configured');
  const token = await getPCGSToken(creds);
  const clean = certNumber.replace(/-/g, '');

  const res = await fetch(
    `https://api.pcgs.com/coindetail/GetCoinByBarcode?barcode=${clean}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) return null;
  const json = await res.json();

  const name = json.coinName || json.CoinName || '';
  if (!name) return null;

  return {
    name,
    year: json.year || json.Year || null,
    denomination: json.denomination || json.Denomination || '',
    mint: json.mintMark || json.MintMark || '',
    grade: json.grade || json.Grade || '',
    certURL: `https://www.pcgs.com/cert/${clean}`,
    currentValue: json.priceGuideValue || json.PriceGuideValue || null,
    pcgsPopulation: json.populationTotal || json.PopulationTotal || null,
    ngcPopulation: null,
    gradingService: 'PCGS',
  };
}

export function loadPCGSCreds() {
  try {
    return JSON.parse(localStorage.getItem('coinvault_pcgs_creds') || 'null');
  } catch {
    return null;
  }
}

export function savePCGSCreds(creds) {
  localStorage.setItem('coinvault_pcgs_creds', JSON.stringify(creds));
}
