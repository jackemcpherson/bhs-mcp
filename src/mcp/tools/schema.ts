export function getSchemaInfo(): string {
  return `# BHS API — TypeScript Type Definitions & Reference

## Available Object: \`bhs\`

The sandbox has access to a \`bhs\` object with methods for searching products, managing carts, and querying store data.

## Type Definitions

\`\`\`typescript
interface ProductNamedField {
  name: string | null;
  code: string | null;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  productType: string;          // "Wine", "Beer", "Spirits", etc.
  masterSku: string;
  price: number;
  isInStock: boolean;
  stockStatus: string;
  totalAvailableQty: number;
  isFeaturedProduct: boolean;
  soldCount: number;            // popularity indicator
  variants: ProductVariant[];
  productAttributes: ProductAttribute[];  // includes body info (type: "BODY")
  warehouses: ProductWarehouse[];
  tags: readonly string[];

  // Classification
  drinkability: ProductNamedField;        // "Guzzle", "Impress", "Contemplate"
  dietary: ProductNamedField;
  style: ProductNamedField;
  type: ProductNamedField;

  // Varietal hierarchy
  varietal_lvl0: string | null;           // Primary grape (e.g. "Red")
  varietal_lvl1: string | null;           // Specific grape (e.g. "Grenache")

  // Region hierarchy (may be undefined for non-wine products)
  region_lvl0?: string | null;            // Country (Australia, France, Italy, etc.)
  region_lvl1?: string | null;            // Sub-region (e.g. "Barossa Valley")
  region_lvl2?: string | null;            // Micro-region

  // Tasting & descriptors
  tastesLike: string | null;
  crush: string | null;
  setting: string | null;
  farming: string | readonly string[] | null;   // "Organic", "Biodynamic", etc.

  // Marketing
  callOutPrimary: string;
  callOutSecondary: string;

  // Collections & tags
  customCollections: readonly string[] | null;
  dietaryTags: string | readonly string[] | null;
  stylisticChoices: string | readonly string[] | null;

  coverImageUrl: string;
}

// Note: body info is NOT a direct Product field. Access it via
// productAttributes (entries with type "BODY") or the body.name facet.

interface ProductVariant {
  sku: string;
  packageName: string;          // "Bottle", "Can", "6 Pack", etc.
  price: number;
  quantityAvailable: number;
  quantityInVariant: number;
  status: string;
}

interface ProductAttribute {
  name: string;
  code: string;
  type: string;                 // "BODY", "COUNTRY", "REGION", "VARIETAL", "DRINKABILI", etc.
  hexColor: string;
}

interface ProductWarehouse {
  code: string;
  availableQty: number;
}

interface SearchResult {
  hits: Product[];
  query: string;
  processingTimeMs: number;
  estimatedTotalHits: number;
  limit: number;
  offset: number;
}

interface Store {
  id: string;
  slug: string;
  name: string;
  postCode: string | null;
  warehouseCode: string;
  address: string | null;
  phone: string | null;
  allowCNC: boolean | null;     // click & collect availability
}

// Note: subtotal and discountedSubtotal may return the same value even when
// line-item discounts are applied. For accurate discounted totals, sum
// lineItems[].discountedPrice * quantity.
interface Checkout {
  uid: string;
  status: string;
  subtotal: number;
  discountedSubtotal: number;
  gst: number;
  total: number;
  lineItems: LineItem[];
}

interface LineItem {
  id: string;
  masterSku: string;
  sku: string;
  quantity: number;
  title: string;
  packageName: string;
  productType: string;
  singlePrice: number;
  discountedPrice: number;
  discounts: LineItemDiscount[];
}

interface LineItemDiscount {
  discountName: string;         // e.g. "10% off 6+ Wines"
  discountAmount: number;
  discountedItemPrice: number;
}

interface LineItemInput {
  sku: string;
  masterSku: string;
  quantity: number;
}

interface FacetResult {
  facetDistribution: Record<string, Record<string, number>>;
  facetStats: Record<string, { min: number; max: number }> | undefined;
}
\`\`\`

## API Methods

### \`bhs.search(params?)\`
Search products with filters. Returns \`Promise<SearchResult>\`.

Parameters (all optional):
- \`query\`: string — free-text search
- \`type\`: string — "Wine", "Spirits", "Beer", "AlcoholFree", "Food", "Giftware"
- \`country\`: string — filter by region_lvl0 (e.g., "France", "Australia", "Italy")
- \`region\`: string — exact match on productAttributes.name. Use \`bhs.facets("region_lvl1")\` to discover valid values
- \`varietal\`: string — exact match on productAttributes.name (e.g., "Grenache", "Pinot Noir"). Note: sparkling wines use "Bubbles" not "Sparkling". Use \`bhs.facets("varietal_lvl1")\` to discover valid values. Rosé requires the accent: "Rosé" not "Rose"
- \`body\`: string — "Light", "Light - Medium", "Medium", "Medium - Full", "Full"
- \`drinkability\`: string — "Guzzle", "Impress", "Contemplate"
- \`farming\`: string — "Organic", "Biodynamic", "Sustainable", "Conventional"
- \`dietary\`: string — "Vegan", "Vegan & Sulphur Free", "Sulphur Free"
- \`priceMin\`: number
- \`priceMax\`: number
- \`inStock\`: boolean — filters to products with actual per-warehouse stock (availableQty > 0). May return fewer results than \`limit\` when many indexed products are out of stock
- \`sort\`: "price:asc" | "price:desc"
- \`limit\`: number (default 20, max 100)
- \`store\`: string — warehouse code for stock filtering. Use \`bhs.stores()\` to find codes

### \`bhs.product(sku)\`
Get a single product by SKU. Returns \`Promise<Product>\`.

### \`bhs.facets(name?)\`
Get facet distributions. Without name, returns all facet names. With name, returns values and counts. Returns \`Promise<FacetResult>\`.

Available facet names: varietal_lvl0, varietal_lvl1, drinkability.name, region_lvl0, region_lvl1, region_lvl2, customCollections, body.name, farming, dietaryTags, type.name, stylisticChoices

### \`bhs.stores()\`
List all store locations. Returns \`Promise<Store[]>\`.

### \`bhs.cart.create()\`
Create a new checkout. Returns \`Promise<Checkout>\`.

### \`bhs.cart.get(uid)\`
Get checkout by UID. Returns \`Promise<Checkout>\`.

### \`bhs.cart.addItems(uid, items)\`
Add items to checkout. \`items\` is \`LineItemInput[]\`. Returns \`Promise<Checkout>\`.

### \`bhs.cart.updateQuantity(uid, items)\`
Update item quantities. Set quantity to 0 to remove. Returns \`Promise<Checkout>\`.

### \`bhs.cart.delete(uid)\`
Delete a checkout. Returns \`Promise<void>\`.

### \`bhs.cart.checkoutUrl(uid)\`
Get the browser checkout URL. Returns \`Promise<string>\`. **Must be awaited.**

## Example Queries

**Find affordable Grenache wines in stock:**
\`\`\`typescript
const results = await bhs.search({
  varietal: "Grenache",
  priceMax: 35,
  inStock: true,
  sort: "price:asc",
  limit: 5,
});
return results.hits.map(w => ({
  name: w.name,
  price: w.price,
  region: w.region_lvl0,
  subRegion: w.region_lvl1,
  varietal: w.varietal_lvl1,
  style: w.style?.name,
  tastesLike: w.tastesLike,
}));
\`\`\`

**Build a cart and get checkout link:**
\`\`\`typescript
const checkout = await bhs.cart.create();
const updated = await bhs.cart.addItems(checkout.uid, [
  { sku: "44253", masterSku: "44253", quantity: 6 },
]);
return {
  total: updated.total,
  discount: updated.lineItems[0]?.discounts[0]?.discountName,
  checkoutUrl: await bhs.cart.checkoutUrl(checkout.uid),
};
\`\`\`

**Discover valid filter values with facets:**
\`\`\`typescript
// Find what varietals are available before filtering
const facets = await bhs.facets("varietal_lvl1");
return Object.entries(facets.facetDistribution["varietal_lvl1"])
  .sort(([,a], [,b]) => b - a)
  .slice(0, 10);
\`\`\`
`;
}
