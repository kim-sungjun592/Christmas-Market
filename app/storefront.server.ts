import {
  cartQueries,
  createCartCookie,
  createCartServerHandlers,
  createShopifyRequestContext,
  createStorefrontClient,
  defineShopifyI18n,
  defineShopifyRouteTemplates,
  getCartId,
  gql,
  handleShopifyRoutes,
  handleShopifyRedirects,
} from '@shopify/hydrogen';
import type { Product } from './components/Shop';

const CART_FRAGMENT = gql(`fragment CartFragment on Cart {
  lines(first: 250) { nodes { discountAllocations(lineLevelOnly: false) { discountedAmount { amount currencyCode } } } }
}`);
export const cartHandlers = createCartServerHandlers({ fragment: CART_FRAGMENT });
export const routes = defineShopifyRouteTemplates({});
const i18n = defineShopifyI18n({ defaultLocale: { language: 'EN', country: 'US' } });
const CATALOG = gql(`query VertCatalog($country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    shop { id paymentSettings { currencyCode } }
    cap: product(handle: "five-panel-run-cap") { ...VertCatalogProduct }
    trucker: product(handle: "vert-club-trucker-cap") { ...VertCatalogProduct }
    tee: product(handle: "merino-trail-tee") { ...VertCatalogProduct }
    socks: product(handle: "crew-socks-2-pack") { ...VertCatalogProduct }
  }
  fragment VertCatalogProduct on Product {
    id handle title description availableForSale requiresSellingPlan
    featuredImage { url }
    variants(first: 100) {
      pageInfo { hasNextPage }
      nodes { id title availableForSale selectedOptions { name value } price { amount currencyCode } }
    }
  }`);

export type Catalog = { products: Product[]; ready: boolean; shopId: string; currency: string; reason?: string };

type Runtime = ReturnType<typeof makeRuntime>;
export function makeRuntime(request: Request) {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
  if (!domain || !token) throw new Error('Shopify storefront configuration is unavailable');
  const requestContext = createShopifyRequestContext({ request, i18n });
  const storefrontClient = createStorefrontClient({
    type: 'public', requestContext,
    config: { storeDomain: domain.replace(/^https?:\/\//, '').replace(/\/$/, ''), publicStorefrontToken: token },
  });
  return { requestContext, storefrontClient, domain };
}

export async function loadCatalog(runtime: Runtime): Promise<Catalog> {
  const { data, errors } = await runtime.storefrontClient.graphql(CATALOG);
  if (errors?.length || !data?.shop) throw new Error('Shopify catalog could not be loaded');
  const currency = data.shop.paymentSettings.currencyCode;
  const shopId = data.shop.id;
  const source = [data.cap, data.trucker, data.tee, data.socks];
  const handles = ['five-panel-run-cap', 'vert-club-trucker-cap', 'merino-trail-tee', 'crew-socks-2-pack'];
  // The concurrently developed UI has a single USD price per product. Never
  // pass a non-USD amount, nor advertise one price for differently priced variants.
  const products: Product[] = source.flatMap((product, index) => {
    if (!product || product.handle !== handles[index] || !product.availableForSale || product.variants.pageInfo.hasNextPage) return [];
    const variants = product.variants.nodes;
    if (!variants.length || !variants.some((v) => v.availableForSale) || product.requiresSellingPlan) return [];
    if (variants.some((v) => v.price.currencyCode !== 'USD' || v.price.amount !== variants[0].price.amount)) return [];
    if (!Number.isFinite(Number(variants[0].price.amount)) || Number(variants[0].price.amount) < 0) return [];
    if (product.handle === 'merino-trail-tee') {
      const sizes = new Set(variants.flatMap((variant) => variant.selectedOptions
        .filter((option) => option.name.trim().toLowerCase() === 'size')
        .map((option) => option.value.trim().toUpperCase())));
      if (!['S', 'M', 'L', 'XL'].every((size) => sizes.has(size))) return [];
    }
    return [{
      id: product.id, title: product.title, description: product.description,
      image: product.featuredImage?.url ?? '', price: Number(variants[0].price.amount),
      variants: variants.map((v) => ({ id: v.id, title: v.title, available: v.availableForSale })),
    }];
  });
  const ready = currency === 'USD' && products.length === handles.length;
  return { products: ready ? products : [], ready, shopId, currency, reason: ready ? undefined : 'USD storefront or published products unavailable' };
}

export function sameOriginMutation(request: Request): boolean {
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return true;
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const expected = new URL(request.url).origin;
  try {
    // Require a genuine browser-origin or same-origin Referer; never accept null origins.
    return origin ? origin !== 'null' && new URL(origin).origin === expected
      : !!referer && new URL(referer).origin === expected;
  } catch { return false; }
}

// Hydrogen 2026.10 emits a Lax, non-HttpOnly cart cookie. At the final response
// boundary harden only that cookie. Proxy-provided scheme is reflected in request.url.
export function hardenCartCookie(response: Response, request: Request): Response {
  const cookies = response.headers.getSetCookie();
  if (!cookies.some((cookie) => /^cart=/i.test(cookie))) return response;
  const headers = new Headers(response.headers);
  headers.delete('set-cookie');
  const secure = new URL(request.url).protocol === 'https:';
  for (const cookie of cookies) {
    if (!/^cart=/i.test(cookie)) { headers.append('set-cookie', cookie); continue; }
    const hardened = cookie.replace(/;\s*SameSite=[^;]*/i, '')
      .replace(/;\s*HttpOnly/ig, '').replace(/;\s*Secure/ig, '').replace(/;\s*Partitioned/ig, '');
    headers.append('set-cookie', `${hardened}; HttpOnly; SameSite=${secure ? 'None; Secure; Partitioned' : 'Lax'}`);
  }
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export async function currentCart(runtime: Runtime) {
  // Do not allow a query-string cartId to override the cart cookie during the
  // currency check. Hydrogen's get handler otherwise prefers that parameter.
  const cookie = runtime.requestContext.cookie ?? '';
  const request = new Request(new URL('/', runtime.requestContext.url ?? 'http://localhost'), {
    headers: { cookie },
  });
  const data = (await cartHandlers.get({ request, storefrontClient: runtime.storefrontClient })).data;
  // An absent/expired cart and an incomplete upstream response are both null
  // in Hydrogen. Do not replace a cookie-bound cart when we cannot distinguish
  // those cases or when any GraphQL error was returned.
  if (data.errors || (getCartId({ cookie }) && !data.cart)) throw new Error('Shopify cart could not be loaded');
  return data;
}

export async function applyPromotion(request: Request, runtime: Runtime): Promise<Response> {
  // First apply on an existing cart with Shopify's official handler. If none
  // exists, create an empty cart using Shopify's own cart mutation document.
  const current = await currentCart(runtime);
  if (current.cart) {
    const codes = [...new Set([...current.cart.discountCodes.map((item) => item.code), 'LONGNIGHT20'])];
    const internal = new Request(new URL('/api/cart', request.url), {
      method: 'POST', headers: { cookie: request.headers.get('cookie') ?? '', 'content-type': 'application/json' },
      body: JSON.stringify({ discountCodes: codes }),
    });
    const result = await cartHandlers.post({ request: internal, storefrontClient: runtime.storefrontClient });
    if (result.type === 'json' && result.data.cart && Array.isArray(result.data.userErrors) && result.data.userErrors.length === 0) {
      const headers = new Headers(result.headers);
      headers.set('location', '/shop'); headers.set('cache-control', 'no-store');
      return hardenCartCookie(new Response(null, { status: 303, headers }), request);
    }
    throw new Error('The Shopify discount could not be requested');
  }
  const result = await runtime.storefrontClient.graphql(cartQueries.cartCreate, {
    variables: { input: { discountCodes: ['LONGNIGHT20'], buyerIdentity: { countryCode: 'US' } } },
  });
  if (result.errors?.length || !result.data?.cartCreate?.cart?.id || result.data.cartCreate.userErrors.length) {
    throw new Error('The Shopify discount could not be requested');
  }
  const headers = new Headers({ location: '/shop', 'cache-control': 'no-store' });
  headers.append('set-cookie', createCartCookie(result.data.cartCreate.cart.id));
  return hardenCartCookie(new Response(null, { status: 303, headers }), request);
}

export async function shopifyRoute(request: Request, runtime: Runtime) {
  const found = handleShopifyRoutes({ request, requestContext: runtime.requestContext, storefrontClient: runtime.storefrontClient, routeTemplates: routes, handlers: [cartHandlers] });
  if (!found) return null;
  return hardenCartCookie(await found, request);
}
export async function shopifyRedirect(request: Request, runtime: Runtime) {
  return handleShopifyRedirects({ request, storefrontClient: runtime.storefrontClient, routeTemplates: routes });
}
