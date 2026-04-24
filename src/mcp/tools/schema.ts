export function getSchemaInfo(): string {
  return `# BHS API — TypeScript Type Definitions & Reference

## Available Object: \`bhs\`

The sandbox has access to a \`bhs\` object with methods for searching products, managing carts, and querying store data.

## Type Definitions

\`\`\`typescript
interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  productType: string;          // "Wine", "Beer", "Spirits", etc.
  masterSku: string;
  price: number;
  isInStock: boolean;
  totalAvailableQty: number;
  variants: ProductVariant[];
  productAttributes: ProductAttribute[];
  warehouses: ProductWarehouse[];
  drinkability: { name: string | null; code: string | null };
  dietary: { name: string | null; code: string | null };
  body: { name: string | null; code: string | null };
  farming: string | null;
  region_lvl0: string | null;   // Country (Australia, France, Italy, etc.)
  coverImageUrl: string;
}

interface ProductVariant {
  sku: string;
  packageName: string;          // "Bottle", "Can", "6 Pack", etc.
  price: number;
  quantityAvailable: number;
  quantityInVariant: number;
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
  estimatedTotalHits: number;
  limit: number;
  offset: number;
}

interface Store {
  id: string;
  name: string;
  postCode: string | null;
  warehouseCode: string;
  address: string | null;
  phone: string | null;
}

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
- \`region\`: string — filter by region/subregion via productAttributes.name
- \`varietal\`: string — grape variety via productAttributes.name
- \`body\`: string — "Light", "Light - Medium", "Medium", "Medium - Full", "Full"
- \`drinkability\`: string — "Guzzle", "Impress", "Contemplate"
- \`farming\`: string — "Organic", "Biodynamic", "Sustainable", "Conventional"
- \`dietary\`: string — "Vegan", "Vegan & Sulphur Free", "Sulphur Free"
- \`priceMin\`: number
- \`priceMax\`: number
- \`inStock\`: boolean
- \`sort\`: "price:asc" | "price:desc"
- \`limit\`: number (default 20, max 100)
- \`store\`: string — warehouse code for stock filtering

### \`bhs.product(sku)\`
Get a single product by SKU. Returns \`Promise<Product>\`.

### \`bhs.facets(name?)\`
Get facet distributions. Without name, returns all facet names. With name, returns values and counts. Returns \`Promise<FacetResult>\`.

Available facet names: varietal_lvl0, varietal_lvl1, drinkability.name, region_lvl0, region_lvl1, region_lvl2, customCollections, body, farming, dietaryTags, type.name, stylisticChoices

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
  name: w.name, price: w.price, region: w.region_lvl0
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
`;
}
