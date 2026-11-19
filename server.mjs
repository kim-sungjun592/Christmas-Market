import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { isIP } from 'node:net';
import { resolve, extname, sep } from 'node:path';
import { handleRequest } from './dist/server/entry-server.js';

const port = Number(process.env.PORT || 3000);
const manifest = JSON.parse(await readFile('./dist/client/.vite/manifest.json', 'utf8'));
const entry = manifest['app/entry-client.tsx'];
if (!entry?.file) throw new Error('Client build manifest is missing');
const assets = { script: `/${entry.file}`, css: (entry.css || []).map((p) => `/${p}`) };
const types = { '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.ico': 'image/x-icon' };

function validHost(host) {
  // Accept a DNS name, IPv4 address, or bracketed IPv6 address with an optional
  // decimal port, but never a URL, userinfo, escaped delimiter, or path.
  const match = /^(\[[0-9a-fA-F:.]+\]|[A-Za-z0-9.-]+)(?::([0-9]{1,5}))?$/.exec(host);
  if (!match) return false;
  const [, hostname, port] = match;
  if (port && (Number(port) < 1 || Number(port) > 65535)) return false;
  if (hostname.startsWith('[')) return isIP(hostname.slice(1, -1)) === 6;
  if (/^[0-9.]+$/.test(hostname)) return isIP(hostname) === 4;
  const name = hostname.endsWith('.') ? hostname.slice(0, -1) : hostname;
  return name.length <= 253 && name.split('.').every((label) =>
    /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/.test(label));
}

function safeLocation(value, requestUrl) {
  try {
    const destination = new URL(value, requestUrl);
    if (destination.origin !== requestUrl.origin) return value;
    const path = `${destination.pathname}${destination.search}${destination.hash}`;
    // A leading // would itself be a network-path reference in a Location header.
    return path.startsWith('//') ? `/.${path}` : path;
  } catch { return value; }
}

async function staticFile(pathname) {
  let relative;
  try { relative = decodeURIComponent(pathname).replace(/^\/+/, ''); } catch { return null; }
  if (!relative || relative.includes('\0')) return null;
  for (const root of [resolve('dist/client'), resolve('public')]) {
    const target = resolve(root, relative);
    if (!target.startsWith(root + sep)) continue;
    try {
      if (!(await stat(target)).isFile()) continue;
      return new Response(await readFile(target), { headers: { 'content-type': types[extname(target)] || 'application/octet-stream', 'x-content-type-options': 'nosniff', 'cache-control': relative.startsWith('assets/') ? 'public, max-age=31536000, immutable' : 'no-cache' } });
    } catch { /* not a file in this root */ }
  }
  return null;
}

createServer(async (req, res) => {
  try {
    const forwardedProto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
    const protocol = forwardedProto === 'https' ? 'https' : 'http';
    const forwardedHost = req.headers['x-forwarded-host'];
    const hosts = forwardedHost === undefined
      ? [String(req.headers.host || 'localhost:3000').trim()]
      : String(forwardedHost).split(',').map((value) => value.trim());
    const host = hosts[0];
    const target = req.url || '';
    // WHATWG URL resolves //host, backslashes and absolute URLs as a new origin.
    // Only HTTP origin-form request targets are valid at this server boundary.
    if (hosts.some((value) => !validHost(value)) || !/^\/(?!\/)/.test(target) || /[\\#\s\x00-\x1f\x7f]/.test(target)) {
      res.statusCode = 400; res.setHeader('content-type', 'text/plain; charset=utf-8'); res.end('Bad request'); return;
    }
    const base = new URL(`${protocol}://${host}/`);
    const url = new URL(target, base);
    if (url.origin !== base.origin) {
      res.statusCode = 400; res.setHeader('content-type', 'text/plain; charset=utf-8'); res.end('Bad request'); return;
    }
    let response;
    if (url.pathname === '/api/health') response = new Response('ok', { headers: { 'cache-control': 'no-store' } });
    else if (req.method === 'GET' || req.method === 'HEAD') response = await staticFile(url.pathname);
    if (!response) {
      let body;
      if (!['GET', 'HEAD'].includes(req.method || 'GET')) {
        const chunks = []; let size = 0;
        for await (const chunk of req) { size += chunk.length; if (size > 1024 * 1024) throw new Error('Request too large'); chunks.push(chunk); }
        body = Buffer.concat(chunks);
      }
      const headers = new Headers();
      for (const [name, value] of Object.entries(req.headers)) if (value !== undefined) headers.set(name, Array.isArray(value) ? value.join(', ') : value);
      const request = new Request(url, { method: req.method, headers, body });
      response = await handleRequest(request, assets);
    }
    res.statusCode = response.status;
    for (const [name, value] of response.headers) if (name !== 'set-cookie') res.setHeader(name, name === 'location' ? safeLocation(value, url) : value);
    const cookies = response.headers.getSetCookie();
    if (cookies.length) res.setHeader('set-cookie', cookies);
    if (req.method === 'HEAD') res.end(); else res.end(Buffer.from(await response.arrayBuffer()));
  } catch {
    res.statusCode = 500; res.setHeader('content-type', 'text/plain; charset=utf-8'); res.end('Unexpected server error');
  }
}).listen(port, '0.0.0.0', () => console.log(`Vert Club listening on 0.0.0.0:${port}`));
