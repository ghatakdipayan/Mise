// Real OAuth 2.1 (PKCE) + MCP client for Swiggy's Instamart MCP server.
// Docs: https://mcp.swiggy.com/builders/docs/start/authenticate/
//       https://mcp.swiggy.com/builders/docs/reference/instamart/
//
// mcp.swiggy.com sends no Access-Control-Allow-Origin header, so direct
// browser fetch() calls are blocked by CORS. All network calls here go
// through the Vite dev server proxy (see vite.config.ts: /swiggy-api ->
// https://mcp.swiggy.com), which makes the request server-side where CORS
// doesn't apply. The one exception is the authorize step, which is a full
// page navigation (like Firebase's signInWithRedirect) rather than a fetch,
// so it's unaffected and goes straight to the real domain.

const AUTH_ORIGIN = 'https://mcp.swiggy.com';
const API_BASE = '/swiggy-api'; // proxied
const SCOPES = 'mcp:tools mcp:resources';
const PROTOCOL_VERSION = '2025-06-18';

const CLIENT_KEY = 'mise_swiggy_client';
const TOKENS_KEY = 'mise_swiggy_tokens';
const PKCE_VERIFIER_KEY = 'mise_swiggy_pkce_verifier';
const OAUTH_STATE_KEY = 'mise_swiggy_oauth_state';
const RESUME_KEY = 'mise_swiggy_resume';

export const CALLBACK_PATH = '/swiggy/callback';

interface RegisteredClient {
  client_id: string;
  redirect_uri: string;
}

interface TokenSet {
  access_token: string;
  refresh_token?: string;
  expires_at: number; // epoch ms
}

// ---- small crypto/base64url helpers (Web Crypto, browser-native) ----

function base64UrlEncode(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let str = '';
  arr.forEach((b) => (str += String.fromCharCode(b)));
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function randomString(byteLength: number): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

async function sha256Base64Url(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return base64UrlEncode(digest);
}

// ---- client registration (RFC 7591 Dynamic Client Registration) ----

async function getOrRegisterClient(): Promise<RegisteredClient> {
  const redirectUri = `${window.location.origin}${CALLBACK_PATH}`;
  const cached = localStorage.getItem(CLIENT_KEY);
  if (cached) {
    const parsed: RegisteredClient = JSON.parse(cached);
    if (parsed.redirect_uri === redirectUri) return parsed;
  }

  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_name: 'Mise Pantry Assistant',
      redirect_uris: [redirectUri],
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      token_endpoint_auth_method: 'none',
    }),
  });

  if (!res.ok) {
    throw new Error(`Swiggy client registration failed (${res.status})`);
  }

  const data = await res.json();
  const client: RegisteredClient = { client_id: data.client_id, redirect_uri: redirectUri };
  localStorage.setItem(CLIENT_KEY, JSON.stringify(client));
  return client;
}

// ---- connection state ----

export function isConnected(): boolean {
  return !!localStorage.getItem(TOKENS_KEY);
}

export function disconnect(): void {
  localStorage.removeItem(TOKENS_KEY);
}

function readTokens(): TokenSet | null {
  const raw = localStorage.getItem(TOKENS_KEY);
  return raw ? JSON.parse(raw) : null;
}

function storeTokens(payload: any): TokenSet {
  const tokens: TokenSet = {
    access_token: payload.access_token,
    refresh_token: payload.refresh_token,
    expires_at: Date.now() + (payload.expires_in ?? 3600) * 1000,
  };
  localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
  return tokens;
}

async function refreshTokens(client: RegisteredClient, refreshToken: string): Promise<TokenSet> {
  const res = await fetch(`${API_BASE}/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: client.client_id,
    }),
  });
  if (!res.ok) throw new Error('Swiggy session expired. Please reconnect.');
  return storeTokens(await res.json());
}

async function getValidAccessToken(): Promise<string> {
  const tokens = readTokens();
  if (!tokens) throw new Error('Swiggy account not connected.');
  if (Date.now() < tokens.expires_at - 30_000) return tokens.access_token;
  if (!tokens.refresh_token) throw new Error('Swiggy session expired. Please reconnect.');
  const client = await getOrRegisterClient();
  const fresh = await refreshTokens(client, tokens.refresh_token);
  return fresh.access_token;
}

// ---- one-time connect (OAuth 2.1 + PKCE, authorization_code) ----

export async function startConnect(): Promise<void> {
  const client = await getOrRegisterClient();

  const verifier = randomString(32);
  const challenge = await sha256Base64Url(verifier);
  const state = randomString(16);

  sessionStorage.setItem(PKCE_VERIFIER_KEY, verifier);
  sessionStorage.setItem(OAUTH_STATE_KEY, state);
  sessionStorage.setItem(RESUME_KEY, '1');

  const url = new URL(`${AUTH_ORIGIN}/auth/authorize`);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', client.client_id);
  url.searchParams.set('redirect_uri', client.redirect_uri);
  url.searchParams.set('code_challenge', challenge);
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('scope', SCOPES);
  url.searchParams.set('state', state);

  window.location.assign(url.toString());
}

export interface CallbackResult {
  handled: boolean;
  success: boolean;
  error?: string;
  shouldResumeRefresh: boolean;
}

// Call once on app mount. Detects & completes an in-flight OAuth redirect,
// then cleans the URL back to '/' so the SPA boots normally either way.
export async function handleRedirectCallback(): Promise<CallbackResult> {
  if (window.location.pathname !== CALLBACK_PATH) {
    return { handled: false, success: false, shouldResumeRefresh: false };
  }

  const params = new URLSearchParams(window.location.search);
  const shouldResumeRefresh = sessionStorage.getItem(RESUME_KEY) === '1';
  sessionStorage.removeItem(RESUME_KEY);
  window.history.replaceState({}, '', '/');

  const code = params.get('code');
  const returnedState = params.get('state');
  const expectedState = sessionStorage.getItem(OAUTH_STATE_KEY);
  const verifier = sessionStorage.getItem(PKCE_VERIFIER_KEY);
  sessionStorage.removeItem(OAUTH_STATE_KEY);
  sessionStorage.removeItem(PKCE_VERIFIER_KEY);

  if (params.get('error')) {
    return { handled: true, success: false, error: params.get('error_description') || params.get('error')!, shouldResumeRefresh };
  }
  if (!code || !returnedState || returnedState !== expectedState || !verifier) {
    return { handled: true, success: false, error: 'Swiggy sign-in could not be verified. Please try again.', shouldResumeRefresh };
  }

  try {
    const client = await getOrRegisterClient();
    const res = await fetch(`${API_BASE}/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: client.redirect_uri,
        client_id: client.client_id,
        code_verifier: verifier,
      }),
    });
    if (!res.ok) throw new Error(`Token exchange failed (${res.status})`);
    storeTokens(await res.json());
    return { handled: true, success: true, shouldResumeRefresh };
  } catch (err: any) {
    return { handled: true, success: false, error: err.message || 'Could not finish connecting to Swiggy.', shouldResumeRefresh };
  }
}

// ---- MCP JSON-RPC over the Instamart (/im) server ----

let rpcId = 0;

async function callImRpc(accessToken: string, method: string, params: Record<string, any>): Promise<any> {
  const res = await fetch(`${API_BASE}/im`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'Authorization': `Bearer ${accessToken}`,
      'mcp-protocol-version': PROTOCOL_VERSION,
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: ++rpcId, method, params }),
  });

  if (res.status === 401) throw new Error('Swiggy session expired. Please reconnect.');
  if (!res.ok) throw new Error(`Swiggy request failed (${res.status})`);

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('text/event-stream')) {
    const text = await res.text();
    const messages = text
      .split('\n')
      .filter((line) => line.startsWith('data:'))
      .map((line) => {
        try { return JSON.parse(line.slice(5).trim()); } catch { return null; }
      })
      .filter(Boolean);
    const match = messages.reverse().find((m: any) => m.id === rpcId) || messages[0];
    if (!match) throw new Error('No response from Swiggy.');
    if (match.error) throw new Error(match.error.message || 'Swiggy MCP error.');
    return match.result;
  }

  const json = await res.json();
  if (json.error) throw new Error(json.error.message || 'Swiggy MCP error.');
  return json.result;
}

function extractToolPayload(result: any): any {
  if (!result) return null;
  if (result.structuredContent) return result.structuredContent;
  const textBlock = result.content?.find((c: any) => c.type === 'text');
  if (textBlock?.text) {
    try { return JSON.parse(textBlock.text); } catch { return textBlock.text; }
  }
  return result;
}

async function callImTool(accessToken: string, name: string, args: Record<string, any>): Promise<any> {
  const result = await callImRpc(accessToken, 'tools/call', { name, arguments: args });
  return extractToolPayload(result);
}

// ---- category/icon inference for pulled order items ----

function inferCategory(name: string): string {
  const n = name.toLowerCase();
  if (/tomato|spinach|avocado|lemon|onion|pepper|garlic|coriander|carrot|banana|potato|greens|fruit|veg/.test(n)) return 'Produce';
  if (/egg|yogurt|curd|parmesan|butter|cheese|milk|paneer|ghee/.test(n)) return 'Dairy & eggs';
  if (/chicken|salmon|fish|meat|mutton|prawn|paneer|tofu|dal|lentil/.test(n)) return 'Proteins';
  if (/spaghetti|pasta|rice|quinoa|bread|sourdough|atta|noodle|oats/.test(n)) return 'Grains & pasta';
  if (/oil|soy|honey|cumin|masala|salt|sugar|spice|sauce|ketchup/.test(n)) return 'Pantry staples';
  return 'Pantry staples';
}

const CATEGORY_ICON: Record<string, string> = {
  'Produce': 'eco',
  'Dairy & eggs': 'icecream',
  'Proteins': 'set_meal',
  'Grains & pasta': 'grain',
  'Pantry staples': 'water_drop',
};

export interface FetchedOrderItem {
  name: string;
  cat: string;
  icon: string;
  qty: string;
}

const ORDER_DATE_FIELDS = ['orderTime', 'createdAt', 'orderDate', 'placedAt', 'deliveredAt', 'timestamp', 'orderedAt', 'created_at', 'order_time'];

function getOrderTimestamp(order: any): number | null {
  for (const field of ORDER_DATE_FIELDS) {
    if (order[field]) {
      const t = new Date(order[field]).getTime();
      if (!isNaN(t)) return t;
    }
  }
  return null;
}

export async function fetchRecentInstamartOrders(days: number = 7): Promise<FetchedOrderItem[]> {
  const accessToken = await getValidAccessToken();

  await callImRpc(accessToken, 'initialize', {
    protocolVersion: PROTOCOL_VERSION,
    capabilities: {},
    clientInfo: { name: 'mise', version: '1.0.0' },
  });

  // Note: no orderType filter — the /im server is already Instamart-scoped,
  // and the 'orderType' enum documented for this tool (default 'DASH') looks
  // like it's shared from the /food server's schema. Passing an unrecognized
  // value (we previously sent 'INSTAMART') seems to filter to zero matches
  // rather than error, so we leave it out and take whatever comes back.
  const payload = await callImTool(accessToken, 'get_orders', { count: 20 });

  const orders: any[] = Array.isArray(payload?.data) ? payload.data
    : Array.isArray(payload?.data?.orders) ? payload.data.orders
    : Array.isArray(payload?.orders) ? payload.orders
    : Array.isArray(payload) ? payload
    : [];

  if (orders.length === 0) {
    console.warn('[swiggyMcp] Could not find an orders array in payload. Keys:', payload && typeof payload === 'object' ? Object.keys(payload) : typeof payload);
    throw new Error('No recent Instamart orders found in the last 15 days.');
  }

  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const timestamps = orders.map(getOrderTimestamp);
  const ordersInRange = timestamps.every((t) => t === null)
    // Can't tell order dates from the response shape — fall back to everything
    // the API gave us (already capped at its own 15-day window) rather than
    // silently dropping orders we can't date.
    ? orders
    : orders.filter((_, i) => timestamps[i] === null || timestamps[i]! >= cutoff);

  const merged = new Map<string, { name: string; cat: string; qty: number }>();
  for (const order of ordersInRange) {
    const rawItems: any[] = order.items || order.products || order.orderItems || order.cartItems || [];
    for (const it of rawItems) {
      const name: string = it.name || it.productName || it.itemName || 'Unknown item';
      const qty = Number(it.quantity ?? it.qty ?? it.count ?? it.itemQuantity ?? 1) || 1;
      const key = name.trim().toLowerCase();
      const existing = merged.get(key);
      if (existing) {
        existing.qty += qty;
      } else {
        merged.set(key, { name, cat: inferCategory(name), qty });
      }
    }
  }

  if (merged.size === 0) {
    console.warn('[swiggyMcp] Orders had no recognizable items array. First order keys:', Object.keys(ordersInRange[0] || {}));
    throw new Error("Couldn't read items from your recent Swiggy orders.");
  }

  return Array.from(merged.values()).map((v) => ({
    name: v.name,
    cat: v.cat,
    icon: CATEGORY_ICON[v.cat],
    qty: String(v.qty),
  }));
}
