import { WorkerEntrypoint } from "cloudflare:workers";
import {
  addLineItems,
  buildFilter,
  createCheckout,
  deleteCheckout,
  fetchStores,
  getCheckout,
  getFacets,
  getProductBySku,
  searchProducts,
  updateLineItemQuantity,
} from "@jackemcpherson/bhs-cli";
import type { Env } from "../types";

const DEFAULT_WAREHOUSE = "311";
const SHARECART_BASE = "https://blackheartsandsparrows.com.au/sharecart";

export class BhsProxy extends WorkerEntrypoint<Env> {
  async search(params?: {
    query?: string;
    type?: string;
    country?: string;
    region?: string;
    varietal?: string;
    body?: string;
    drinkability?: string;
    farming?: string;
    dietary?: string;
    priceMin?: number;
    priceMax?: number;
    inStock?: boolean;
    sort?: string;
    limit?: number;
    store?: string;
  }) {
    const warehouseCode = params?.store ?? DEFAULT_WAREHOUSE;
    const filter = buildFilter(
      {
        type: params?.type,
        country: params?.country,
        region: params?.region,
        varietal: params?.varietal,
        body: params?.body,
        drinkability: params?.drinkability,
        farming: params?.farming,
        dietary: params?.dietary,
        "price-min": params?.priceMin?.toString(),
        "price-max": params?.priceMax?.toString(),
        "in-stock": params?.inStock,
        collection: undefined,
        filter: undefined,
      },
      warehouseCode,
    );

    const result = await searchProducts({
      q: params?.query ?? "",
      limit: params?.limit ?? 20,
      offset: 0,
      filter,
      sort: params?.sort ? [params.sort] : undefined,
      facets: undefined,
    });

    if (!result.success) throw new Error(result.error.message);
    return result.data;
  }

  async product(sku: string) {
    const result = await getProductBySku(sku, DEFAULT_WAREHOUSE);
    if (!result.success) throw new Error(result.error.message);
    return result.data;
  }

  async facets(name?: string) {
    const { FACET_NAMES } = await import("@jackemcpherson/bhs-cli");
    if (!name) {
      const result = await getFacets(FACET_NAMES, DEFAULT_WAREHOUSE);
      if (!result.success) throw new Error(result.error.message);
      return result.data;
    }
    const lower = name.toLowerCase();
    const resolved =
      FACET_NAMES.find((f: string) => f.toLowerCase() === lower) ??
      FACET_NAMES.find((f: string) => f.toLowerCase().startsWith(lower));
    if (!resolved) throw new Error(`Invalid facet: "${name}" — valid facets are: ${FACET_NAMES.join(", ")}`);
    const result = await getFacets([resolved], DEFAULT_WAREHOUSE);
    if (!result.success) throw new Error(result.error.message);
    return result.data;
  }

  async stores() {
    const result = await fetchStores();
    if (!result.success) throw new Error(result.error.message);
    return result.data;
  }

  async cartCreate() {
    const result = await createCheckout();
    if (!result.success) throw new Error(result.error.message);
    return result.data;
  }

  async cartGet(uid: string) {
    const result = await getCheckout(uid);
    if (!result.success) throw new Error(result.error.message);
    return result.data;
  }

  async cartAddItems(uid: string, items: { sku: string; masterSku: string; quantity: number }[]) {
    const result = await addLineItems(uid, items);
    if (!result.success) throw new Error(result.error.message);
    return result.data;
  }

  async cartUpdateQuantity(
    uid: string,
    items: { sku: string; masterSku: string; quantity: number }[],
  ) {
    const result = await updateLineItemQuantity(uid, items);
    if (!result.success) throw new Error(result.error.message);
    return result.data;
  }

  async cartDelete(uid: string) {
    const result = await deleteCheckout(uid);
    if (!result.success) throw new Error(result.error.message);
  }

  async cartCheckoutUrl(uid: string) {
    return `${SHARECART_BASE}/${uid}`;
  }
}

export interface ExecuteResult {
  result: unknown;
  error?: string;
  execution_time_ms: number;
}

export async function executeCode(
  code: string,
  env: Env,
  ctx: ExecutionContext,
): Promise<ExecuteResult> {
  const start = Date.now();

  try {
    // Instantiate BhsProxy via ctx.exports (WorkerEntrypoint RPC pattern)
    const bhsProxy = (ctx as unknown as { exports: { BhsProxy: (opts: { props: object }) => unknown } }).exports.BhsProxy({ props: {} });

    const wrappedCode = `
      export default {
        async fetch(request, env) {
          const bhs = {
            search: (p) => env.__bhs.search(p),
            product: (sku) => env.__bhs.product(sku),
            facets: (name) => env.__bhs.facets(name),
            stores: () => env.__bhs.stores(),
            cart: {
              create: () => env.__bhs.cartCreate(),
              get: (uid) => env.__bhs.cartGet(uid),
              addItems: (uid, items) => env.__bhs.cartAddItems(uid, items),
              updateQuantity: (uid, items) => env.__bhs.cartUpdateQuantity(uid, items),
              delete: (uid) => env.__bhs.cartDelete(uid),
              checkoutUrl: async (uid) => env.__bhs.cartCheckoutUrl(uid),
            },
          };
          const __result = await (async () => { ${code} })();
          return new Response(JSON.stringify(__result), {
            headers: { "Content-Type": "application/json" },
          });
        }
      }
    `;

    const worker = env.LOADER.load({
      compatibilityDate: "2026-04-01",
      mainModule: "agent.js",
      modules: { "agent.js": wrappedCode },
      env: { __bhs: bhsProxy },
      globalOutbound: null,
    });

    const response = await worker.getEntrypoint().fetch(new Request("https://internal/"));
    const result = await response.json();

    return { result, execution_time_ms: Date.now() - start };
  } catch (err) {
    return {
      result: null,
      error: err instanceof Error ? err.message : String(err),
      execution_time_ms: Date.now() - start,
    };
  }
}
