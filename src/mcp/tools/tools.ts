export function getToolsInfo(): string {
  return JSON.stringify(
    {
      description:
        "Write TypeScript code that executes in an isolated sandbox with access to BHS product data, store info, and cart management",
      environment: {
        bhs: {
          type: "object",
          description:
            "Typed API client for Blackhearts & Sparrows. Provides product search, store lookup, facet browsing, and cart management.",
          methods: [
            "bhs.search(params?) — search products with filters",
            "bhs.product(sku) — get product by SKU",
            "bhs.facets(name?) — get facet distributions",
            "bhs.stores() — list all stores",
            "bhs.cart.create() — create a new checkout",
            "bhs.cart.get(uid) — get checkout by UID",
            "bhs.cart.addItems(uid, items) — add items to checkout",
            "bhs.cart.updateQuantity(uid, items) — update quantities (0 to remove)",
            "bhs.cart.delete(uid) — delete checkout",
            "bhs.cart.checkoutUrl(uid) — get browser checkout URL",
          ],
        },
      },
      capabilities: [
        "Search and filter wine, beer, spirits, and food products",
        "Check stock availability across all store locations",
        "Create and manage shopping carts with automatic discount calculation",
        "Generate checkout links for browser-based payment",
        "Run multiple API calls and combine results in code",
        "Perform calculations, sorting, and transformations in TypeScript",
      ],
      constraints: [
        "No network access — all data via the bhs API object",
        "No npm packages — standard TypeScript/JavaScript only",
        "30-second execution timeout",
        "Cart operations create real checkouts on the BHS backend",
      ],
      guidance: [
        "Call schema first to see full type definitions and available filters",
        "Use bhs.search() for product discovery, bhs.product(sku) for details",
        "The 10% wine discount applies automatically at 6+ bottles in a cart",
        "Spirits do not receive multi-bottle discounts",
        "Store warehouse codes are needed for stock filtering — use bhs.stores() to find them",
        "Return your final result as a JSON-serialisable value",
      ],
    },
    null,
    2,
  );
}
