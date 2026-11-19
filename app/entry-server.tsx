import { renderToString } from 'react-dom/server';
import { getCartId, parseCartRequest, renderShopifyScriptTags } from '@shopify/hydrogen';
import { App, type InitialData } from './root';
import { previewProducts } from './preview-products';
import { applyPromotion, currentCart, loadCatalog, makeRuntime, sameOriginMutation, shopifyRedirect, shopifyRoute } from './storefront.server';
import './runtime.css';

export type Assets = { script: string; css: string[] };
const escape = (value: string) => value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));
const json = (value: unknown) => JSON.stringify(value).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');

function salePhase(): InitialData['salePhase'] {
  const now = Date.now();
  if (now < Date.parse('2026-12-01T00:00:00-05:00')) return 'scheduled';
  if (now < Date.parse('2026-12-25T00:00:00-05:00')) return 'active';
  return 'ended';
}

function isShopifyCommerceRoute(pathname: string): boolean {
  // Hydrogen also intercepts localized AJAX cart paths, the generic Shopify
  // proxy, Storefront GraphQL, MCP and well-known proxy endpoints.
  return /^\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?(?:api(?:\/|$)|__shopify(?:\/|$)|cart(?:\/|\.|$)|checkout(?:\/|$)|buy(?:\/|$))/i.test(pathname)
    || /^\/(?:\.well-known\/(?:ucp|shopify\/fec\/produce|apple-developer-merchantid-domain-association)|graphiql)(?:\/|$)/i.test(pathname);
}

export async function handleRequest(request: Request, assets: Assets): Promise<Response> {
  const url = new URL(request.url);
  if (!sameOriginMutation(request)) return new Response('Forbidden', { status: 403 });
  try {
    const runtime = makeRuntime(request);
    const protectedRoute = isShopifyCommerceRoute(url.pathname);
    const mutation = !['GET', 'HEAD', 'OPTIONS'].includes(request.method);
    if (protectedRoute || mutation) {
      const catalog = await loadCatalog(runtime);
      if (!catalog.ready) return new Response('Preview only: purchasing is unavailable.', { status: 403, headers: { 'cache-control': 'no-store' } });
      // GET /api/cart and /checkout both prefer a query cartId over the cookie.
      // These routes only serve the cookie-bound cart, never a supplied ID.
      if (protectedRoute && url.searchParams.has('cartId')) return new Response('Cart ID override is not allowed.', { status: 403, headers: { 'cache-control': 'no-store' } });
      const cart = await currentCart(runtime);
      if (cart.cart && (cart.cart.cost.totalAmount.currencyCode !== 'USD' || cart.cart.cost.subtotalAmount.currencyCode !== 'USD')) {
        return new Response('This cart does not use USD.', { status: 403, headers: { 'cache-control': 'no-store' } });
      }
      if (request.method === 'POST' && /^\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?api\/cart$/i.test(url.pathname) && request.headers.get('content-type')?.includes('application/json')) {
        // Use the same parser and ID normalization as the official handler;
        // malformed requests are left to the handler's existing error routing.
        let bodyCartId: string | null = null;
        try { ({ cartId: bodyCartId } = await parseCartRequest(request.clone())); } catch { /* handler reports its own error */ }
        const cookieCartId = getCartId({ cookie: request.headers.get('cookie') ?? undefined });
        if (bodyCartId && bodyCartId !== cookieCartId) return new Response('Cart ID override is not allowed.', { status: 403, headers: { 'cache-control': 'no-store' } });
      }
      if (request.method === 'POST' && url.pathname === '/api/promo') {
        try { return await applyPromotion(request, runtime); }
        catch { return new Response(null, { status: 303, headers: { location: '/shop?promotion=unavailable', 'cache-control': 'no-store' } }); }
      }
    }
    const matched = await shopifyRoute(request, runtime);
    if (matched) return matched;
    if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method not allowed', { status: 405 });
    if (url.pathname !== '/' && url.pathname !== '/shop') {
      const redirect = await shopifyRedirect(request, runtime);
      return redirect ?? new Response('Not found', { status: 404 });
    }
    let catalog: Awaited<ReturnType<typeof loadCatalog>> | null = null;
    let cartData: Awaited<ReturnType<typeof currentCart>> = { cart: null };
    try { [catalog, cartData] = await Promise.all([loadCatalog(runtime), currentCart(runtime)]); }
    catch { /* A failed store lookup never turns sample data into live merchandise. */ }
    const cartCurrencyOk = !cartData.cart || (cartData.cart.cost.totalAmount.currencyCode === 'USD' && cartData.cart.cost.subtotalAmount.currencyCode === 'USD');
    const previewOnly = !catalog?.ready || !cartCurrencyOk;
    const initial: InitialData = {
      page: url.pathname as '/' | '/shop', products: previewOnly ? previewProducts : catalog!.products,
      previewOnly, cartData: previewOnly ? { cart: null } : cartData,
      salePhase: salePhase(), cartOpen: url.searchParams.get('cart') === 'open',
      shop: { shopId: catalog?.shopId ?? '0', storefrontId: '0', myshopifyDomain: runtime.domain.replace(/^https?:\/\//, '').replace(/\/$/, '') },
      currency: catalog?.currency ?? '',
    };
    const app = renderToString(<App initial={initial} />);
    const shopifyScripts = renderShopifyScriptTags({ shop: initial.shop, i18n: { country: 'US', language: 'EN', currency: initial.currency || undefined }, shopifyAnalytics: false }).join('');
    const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#1f3b2d"><title>${initial.page === '/' ? 'The Long Night Sale | Vert Club' : 'Shop | Vert Club'}</title><meta name="description" content="Vert Club holiday 2026: the Long Night Sale, December 1–24 Eastern Time.">${assets.css.map((css) => `<link rel="stylesheet" href="${escape(css)}">`).join('')}${shopifyScripts}</head><body><div id="root">${app}</div><script>window.__VERT_INITIAL__=${json(initial)}</script><script type="module" src="${escape(assets.script)}"></script></body></html>`;
    const headers = new Headers({ 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' });
    runtime.requestContext.applyResponseHeaders(headers);
    return new Response(request.method === 'HEAD' ? null : html, { headers });
  } catch {
    return new Response('The storefront is temporarily unavailable.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } });
  }
}
