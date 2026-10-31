// Mise web server. One process serves the app, the AI endpoints and the Swiggy relay.
//   production:  node dist-server/index.mjs   (Cloud Run; serves the built app in dist/)
//   development: npm run dev                  (Vite runs inside this server with hot reload)
import express, { type Request, type Response, type NextFunction } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { createProxyMiddleware } from 'http-proxy-middleware';
import * as gemini from './gemini';

const isProd = process.env.NODE_ENV === 'production';
const port = Number(process.env.PORT) || (isProd ? 8080 : 3000);
const root = process.cwd();

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', true); // Cloud Run sits behind Google's front end

app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  next();
});

app.get('/healthz', (_req, res) => {
  res.json({ ok: true, ai: gemini.isAiConfigured() });
});

// ---- Swiggy Instamart MCP relay ----
// mcp.swiggy.com sends no CORS headers, so the browser can't call it directly.
// Its firewall also rejects /auth/register when it sees a browser Origin/Referer,
// so those are stripped to make this look like the server-to-server call it is.
// Mounted before the JSON body parser so request bodies pass through untouched.
app.use(
  '/swiggy-api',
  createProxyMiddleware({
    target: process.env.SWIGGY_MCP_ORIGIN || 'https://mcp.swiggy.com',
    changeOrigin: true,
    on: {
      proxyReq: (proxyReq) => {
        proxyReq.removeHeader('origin');
        proxyReq.removeHeader('referer');
        proxyReq.removeHeader('cookie');
      },
    },
  })
);

// ---- AI endpoints ----

// Simple per-IP limit so the public endpoints can't drain the Gemini quota.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_CALLS = Number(process.env.AI_RATE_LIMIT) || 30;
const hits = new Map<string, { count: number; resetAt: number }>();

const rateLimit = (req: Request, res: Response, next: NextFunction) => {
  const key = req.ip || 'unknown';
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || entry.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    if (hits.size > 10_000) {
      for (const [k, v] of hits) if (v.resetAt < now) hits.delete(k);
    }
    return next();
  }
  if (entry.count >= MAX_CALLS) {
    res.setHeader('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
    return res.status(429).json({ error: 'You’ve used the AI a lot in a short time. Please try again in a few minutes.' });
  }
  entry.count += 1;
  next();
};

const MAX_IMAGE_BASE64 = 10 * 1024 * 1024; // ~7.5 MB image

const asImage = (value: any): gemini.InlineImage => {
  if (!value || typeof value.data !== 'string' || typeof value.mimeType !== 'string') {
    throw new HttpError(400, 'An image is required.');
  }
  if (!value.mimeType.startsWith('image/')) throw new HttpError(400, 'Only image files are supported.');
  if (value.data.length > MAX_IMAGE_BASE64) throw new HttpError(413, 'That image is too large. Please use a smaller photo.');
  return { data: value.data, mimeType: value.mimeType };
};

const asStrings = (value: any, max = 300): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string').slice(0, max).map(v => v.slice(0, 120)) : [];

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const handlers: Record<string, (body: any) => Promise<unknown>> = {
  receipt: (b) => gemini.analyzeReceiptImage(asImage(b.image)),
  fridge: (b) => gemini.analyzeFridgeImage(asImage(b.image)),
  'pantry-recipes': (b) =>
    gemini.generateRecipesFromPantry(
      asStrings(b.pantryIngredients),
      b.prefs ? { diets: asStrings(b.prefs.diets, 20), allergies: asStrings(b.prefs.allergies, 20) } : undefined,
      asStrings(b.useSoon, 50)
    ),
  recipes: (b) => gemini.generateRecipes({ ...b, images: (b.images || []).slice(0, 12).map(asImage) }),
  'feast-menu': (b) => gemini.generateFeastMenu({ ...b.formData, images: [] }),
  'feast-plan': (b) =>
    gemini.generateFeastPlan({ ...b.formData, images: (b.formData?.images || []).slice(0, 12).map(asImage) }, b.menuConcept),
};

app.post('/api/ai/:action', rateLimit, express.json({ limit: '25mb' }), async (req, res) => {
  const handler = handlers[req.params.action];
  if (!handler) return res.status(404).json({ error: 'Unknown AI action.' });
  try {
    res.json(await handler(req.body || {}));
  } catch (err: any) {
    const status = err instanceof HttpError ? err.status : 502;
    if (!(err instanceof HttpError)) console.error(`[ai:${req.params.action}]`, err?.message || err);
    res.status(status).json({ error: err?.message || 'The AI request failed. Please try again.' });
  }
});

app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

// ---- The app itself ----

async function start() {
  if (isProd) {
    const dist = path.join(root, 'dist');
    // Hashed build assets never change, so cache them for a year.
    app.use('/assets', express.static(path.join(dist, 'assets'), { immutable: true, maxAge: '1y' }));
    // Everything else (index.html, sw.js, manifest) must always be fresh.
    app.use(express.static(dist, { index: false, setHeaders: (res) => res.setHeader('Cache-Control', 'no-cache') }));
    const indexHtml = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
    // Client-side routes (e.g. /swiggy/callback after Swiggy sign-in) all load the app.
    app.get('*', (_req, res) => {
      res.setHeader('Cache-Control', 'no-cache');
      res.type('html').send(indexHtml);
    });
  } else {
    const { createServer, loadEnv } = await import('vite');
    // In development, read GEMINI_API_KEY etc. from .env like Vite does.
    for (const [k, v] of Object.entries(loadEnv('development', root, ''))) {
      if (process.env[k] === undefined) process.env[k] = v;
    }
    const vite = await createServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  }

  app.listen(port, () => {
    console.log(`Mise listening on http://localhost:${port} (${isProd ? 'production' : 'development'})`);
    if (!gemini.isAiConfigured()) console.warn('GEMINI_API_KEY is not set: AI features will return an error.');
  });
}

start();
