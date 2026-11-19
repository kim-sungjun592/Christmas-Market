# Christmas-Market

## Vert Club storefront

This is a server-rendered React storefront using Shopify Hydrogen 2026.10.3. Both `/` and `/shop` are rendered by the Node server and hydrated in the browser. The campaign and four product photos are bundled under `public/assets/generated/` and served by the Node server.

## Run from VS Code on Windows

Install Node.js **22.9 or newer**, open this folder in VS Code, then open **Terminal → New Terminal**. Copy `.env.example` to `.env`:

```powershell
Copy-Item .env.example .env
```

Edit `.env` and enter your Shopify Storefront API settings. Use a Storefront API access token, **not** an Admin API token. Keep `.env` private; it is excluded from Git.

```powershell
npm ci
npm run typecheck
npm run build
npm start
```

Then open [http://localhost:3000](http://localhost:3000). To rebuild after changing the code, run `npm run build` again. The `dev` command also builds and starts the app. `/api/health` is the health endpoint. The root Dockerfile builds and starts the same server.

Shopify credentials are not included in this repository or ZIP. If no valid Storefront settings are provided, the application cannot load the storefront. The configured development store currently uses KRW and the requested products are drafts, so with a working connection it displays the design preview and keeps cart, discount application, and checkout disabled until the store is set up for live USD sales.

## Preview and checkout

When Shopify does not provide a usable USD catalog, the shop displays the four approved design examples with an explicit preview notice, disables purchase and checkout, and blocks cart mutations on the server. The example prices are not live Shopify prices. Once the store currency is USD and products are active and published to the Storefront channel, the server uses actual Shopify records, and the cart proceeds to Shopify’s `checkoutUrl`. Because the visual component contract has one price per product, products with differently priced variants are withheld instead of misrepresenting a price.

The campaign requests LONGNIGHT20 on the Shopify cart before navigating to the shop when live purchasing is enabled. Shopify’s `applicable` result controls whether the code is described as applied. The intended window is December 1, 2026 at 00:00 through December 25 at 00:00 America/New_York; before it, the code is labeled scheduled.

The SDK’s cart cookie is hardened on HTTPS to `HttpOnly; Secure; SameSite=None; Path=/; Partitioned`, and on local HTTP to `HttpOnly; SameSite=Lax; Path=/`. Origin/Referer checks remain required for mutations. Partitioned iframe and standalone carts may be separate. Browser third-party-cookie policy can still prevent persistence: test the embedded Preview and standalone flows once live USD products are available. The present visual component callbacks require hydration and do not provide a full no-JavaScript cart page.

## Shopify setup still required for real orders

The development store currently uses KRW and the four products are drafts. Before accepting orders, change the store currency to USD, verify the $36/$34/$64/$22 variant prices, and publish the products to the Storefront sales channel. The real Shopify discount code is scheduled for December 1–24, 2026 in the store's America/New_York time zone. Actual cart persistence, discount application, and Shopify checkout must be tested after those changes.
