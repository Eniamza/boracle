/**
 * Cloudflare Worker – R2 Upload Proxy
 *
 * Accepts browser PUT requests (up to 100 MB on Workers Paid / 25 MB Free)
 * and streams them straight into the bound R2 bucket.
 *
 * Auth: every request must carry an `X-Upload-Token` header whose value
 * matches the `UPLOAD_SECRET` secret configured via `wrangler secret put`.
 *
 * Expected URL format:  PUT https://<worker>/upload/<objectKey>
 *   e.g. PUT https://r2-upload.boracle.workers.dev/upload/PHY112/abc.pdf
 *
 * The Content-Type header from the client is forwarded to R2.
 *
 * CORS is handled here so the browser can call the Worker directly.
 */

const ALLOWED_ORIGINS = [
	'https://boracle.app',
	'http://localhost:3000',
];

function corsHeaders(request) {
	const origin = request.headers.get('Origin') || '';
	const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
	return {
		'Access-Control-Allow-Origin': allowedOrigin,
		'Access-Control-Allow-Methods': 'PUT, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type, X-Upload-Token',
		'Access-Control-Max-Age': '86400',
	};
}

export default {
	async fetch(request, env) {
		// ── Preflight ──────────────────────────────────────────────
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				status: 204,
				headers: corsHeaders(request),
			});
		}

		// ── Only accept PUT ────────────────────────────────────────
		if (request.method !== 'PUT') {
			return new Response(JSON.stringify({ error: 'Method not allowed' }), {
				status: 405,
				headers: { ...corsHeaders(request), 'Content-Type': 'application/json' },
			});
		}

		// ── Parse object key from path ─────────────────────────────
		const url = new URL(request.url);
		const pathPrefix = '/upload/';
		if (!url.pathname.startsWith(pathPrefix)) {
			return new Response(JSON.stringify({ error: 'Invalid path. Use /upload/<key>' }), {
				status: 400,
				headers: { ...corsHeaders(request), 'Content-Type': 'application/json' },
			});
		}

		const objectKey = decodeURIComponent(url.pathname.slice(pathPrefix.length));
		if (!objectKey || objectKey.includes('..')) {
			return new Response(JSON.stringify({ error: 'Invalid object key' }), {
				status: 400,
				headers: { ...corsHeaders(request), 'Content-Type': 'application/json' },
			});
		}

		// ── Auth ───────────────────────────────────────────────────
		const token = request.headers.get('X-Upload-Token');
		if (!token || token !== env.UPLOAD_SECRET) {
			return new Response(JSON.stringify({ error: 'Unauthorized' }), {
				status: 401,
				headers: { ...corsHeaders(request), 'Content-Type': 'application/json' },
			});
		}

		// ── Size guard (25 MB) ─────────────────────────────────────
		const MAX_SIZE = 25 * 1024 * 1024;
		const contentLength = Number(request.headers.get('Content-Length') || 0);
		if (contentLength > MAX_SIZE) {
			return new Response(JSON.stringify({ error: 'File too large (max 25 MB)' }), {
				status: 413,
				headers: { ...corsHeaders(request), 'Content-Type': 'application/json' },
			});
		}

		// ── Stream body to R2 ──────────────────────────────────────
		try {
			const contentType = request.headers.get('Content-Type') || 'application/octet-stream';

			await env.BUCKET.put(objectKey, request.body, {
				httpMetadata: { contentType },
			});

			return new Response(JSON.stringify({ success: true, key: objectKey }), {
				status: 200,
				headers: { ...corsHeaders(request), 'Content-Type': 'application/json' },
			});
		} catch (err) {
			console.error('R2 put error:', err);
			return new Response(JSON.stringify({ error: 'Upload failed', detail: err.message }), {
				status: 500,
				headers: { ...corsHeaders(request), 'Content-Type': 'application/json' },
			});
		}
	},
};
