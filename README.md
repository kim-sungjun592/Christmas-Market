# Christmas-Market

## Vert Club storefront

This is a server-rendered React storefront using Shopify Hydrogen 2026.10.3. Both `/` and `/shop` are rendered by the Node server and hydrated in the browser. Shopify’s request handler, Storefront client, cart handlers, cart provider, forms, and Standard Actions power the live shopping path.

## Run

The project requires Node 22 and the platform-injected `SHOPIFY_STORE_DOMAIN` and `SHOPIFY_STOREFRONT_ACCESS_TOKEN` runtime variables. Do not add their values to source files.

```sh
npm ci
npm run typecheck
npm run build
npm start
```

The listener uses `0.0.0.0` and port 3000 by default, or `PORT` if set. `/api/health` is the unauthenticated health endpoint. The root Dockerfile builds and starts the same server. Campaign and product images are bundled in `public/assets/generated/` and served directly by the Node server.

## Preview and checkout

The current store is KRW and the requested products are drafts. When Shopify does not provide a usable USD catalog, the shop displays the four approved design examples with an explicit preview notice, disables purchase and checkout, and blocks cart mutations on the server. The example prices are not live Shopify prices. Once the store currency is USD and products are active and published to the Storefront channel, the server uses actual Shopify records, and the cart proceeds to Shopify’s `checkoutUrl`. Because the visual component contract has one price per product, products with differently priced variants are withheld instead of misrepresenting a price.

The campaign requests LONGNIGHT20 on the Shopify cart before navigating to the shop when live purchasing is enabled. Shopify’s `applicable` result controls whether the code is described as applied. The intended window is December 1, 2026 at 00:00 through December 25 at 00:00 America/New_York; before it, the code is labeled scheduled.

The SDK’s cart cookie is hardened on HTTPS to `HttpOnly; Secure; SameSite=None; Path=/; Partitioned`, and on local HTTP to `HttpOnly; SameSite=Lax; Path=/`. Origin/Referer checks remain required for mutations. Partitioned iframe and standalone carts may be separate. Browser third-party-cookie policy can still prevent persistence: test the embedded Preview and standalone flows once live USD products are available. The present visual component callbacks require hydration and do not provide a full no-JavaScript cart page.

## Generated image backup

The five generated campaign and product photographs are bundled under `public/assets/generated/` and served directly by the Node server, so the storefront images work in a standalone deployment as well as in this repository.

Shopify credentials are not included in this repository. Store domain and Storefront API token must be supplied through the host environment when deploying outside Manus. The development store currently uses KRW and the four products are drafts; after the owner changes the store currency to USD, verify the $36/$34/$64/$22 variant prices and publish the products to the Manus sales channel before enabling actual sales. The discount is scheduled for December 1–24, 2026 in the store's America/New_York time zone. Actual cart persistence, discount application and Shopify checkout must be tested after those changes.
