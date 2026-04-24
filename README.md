# bhs-mcp

MCP server for [Blackhearts & Sparrows](https://blackheartsandsparrows.com.au) product data, deployed as a Cloudflare Worker.

Uses the [Code Mode](https://blog.cloudflare.com/code-mode/) pattern — the LLM writes TypeScript that executes against a typed BHS API in a sandboxed Dynamic Worker, rather than calling fixed tools directly.

## Architecture

```
LLM -> code tool -> Dynamic Worker (sandbox)
                        | bhs.search(...)
                     BhsProxy (RPC bridge)
                        |
                     Host Worker
                        |
                     Meilisearch / GraphQL APIs
```

The sandbox has no network access. All external calls go through the `BhsProxy` RPC bridge to the host worker.

## MCP Tools

| Tool | Description |
|------|-------------|
| `schema` | TypeScript type definitions, method signatures, and example queries |
| `tools` | Sandbox capabilities, constraints, and guidance |
| `code` | Execute TypeScript with access to the `bhs` API object |

## Sandbox API

```typescript
// Search products
const wines = await bhs.search({ type: "Wine", country: "France", priceMax: 30 });

// Get product details
const product = await bhs.product("44253");

// List stores
const stores = await bhs.stores();

// Manage cart
const cart = await bhs.cart.create();
await bhs.cart.addItems(cart.uid, [{ sku: "44253", masterSku: "44253", quantity: 6 }]);
const url = bhs.cart.checkoutUrl(cart.uid);
```

## Development

```bash
npm install
npm run dev        # wrangler dev
npm run typecheck  # tsc --noEmit
npm run deploy     # wrangler deploy
```

## Deployment

Route: `bhs.jackemcpherson.com/mcp*`

Depends on [`@jackemcpherson/bhs-cli`](https://www.npmjs.com/package/@jackemcpherson/bhs-cli) for API functions and types.
