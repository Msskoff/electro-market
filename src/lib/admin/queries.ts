import "server-only";
import type { Category, Product, Variant } from "@/lib/catalog/types";
import { parseCart } from "@/lib/cart/lines";
import { withDefaults } from "@/lib/settings/repository";
import type { StoreSettings } from "@/lib/settings/types";
import type { AdminContext } from "./session";

/**
 * Lectures de l'administration : session de l'administrateur (RLS), donc brouillons
 * compris. Jamais mises en cache : on voit toujours l'état réel de la base.
 */

type Db = AdminContext["supabase"];

/** État de publication d'un élément éditable. */
export type PublishState = "published" | "published-with-draft" | "draft-only";

export interface AdminProductRow {
  id: string;
  name: string;
  slug: string;
  category: string;
  brand: string;
  kind: Product["kind"];
  inStock: boolean;
  state: PublishState;
  minPrice: number;
  totalStock: number;
  variantCount: number;
  lowStock: boolean;
  updatedAt: string;
}

type VariantLite = Pick<Variant, "price" | "stock">;

function summarize(variants: VariantLite[]) {
  const prices = variants.map((v) => v.price);
  return {
    minPrice: prices.length ? Math.min(...prices) : 0,
    totalStock: variants.reduce((s, v) => s + v.stock, 0),
    variantCount: variants.length,
    lowStock: variants.some((v) => v.stock > 0 && v.stock <= 5),
  };
}

/** Tous les produits : publiés (avec ou sans brouillon) + brouillons jamais publiés. */
export async function listAdminProducts(db: Db): Promise<AdminProductRow[]> {
  const [published, drafts] = await Promise.all([
    db
      .from("products")
      .select("id, slug, category, brand, in_stock, position, updated_at, name:data->>name, kind:data->>kind, variants:data->variants")
      .order("position"),
    db
      .from("drafts")
      .select("key, updated_at, name:data->>name, slug:data->>slug, category:data->>category, brand:data->>brand, kind:data->>kind, variants:data->variants")
      .eq("entity", "product"),
  ]);
  if (published.error) throw new Error(published.error.message);
  if (drafts.error) throw new Error(drafts.error.message);
  const draftByKey = new Map(drafts.data.map((d) => [d.key, d]));

  const rows: AdminProductRow[] = published.data.map((p) => {
    const draft = draftByKey.get(p.id);
    draftByKey.delete(p.id);
    return {
      id: p.id,
      name: (draft?.name as string) || (p.name as string),
      slug: p.slug,
      category: p.category,
      brand: p.brand,
      kind: p.kind as Product["kind"],
      inStock: p.in_stock,
      state: draft ? "published-with-draft" : "published",
      ...summarize((p.variants as unknown as VariantLite[]) ?? []),
      updatedAt: draft?.updated_at ?? p.updated_at,
    };
  });
  // Nouveaux produits pas encore publiés : en tête de liste.
  const draftOnly: AdminProductRow[] = [...draftByKey.values()].map((d) => ({
    id: d.key,
    name: (d.name as string) || "Sans nom",
    slug: (d.slug as string) ?? "",
    category: (d.category as string) ?? "",
    brand: (d.brand as string) ?? "",
    kind: (d.kind as Product["kind"]) ?? "phone",
    inStock: true,
    state: "draft-only",
    ...summarize((d.variants as unknown as VariantLite[]) ?? []),
    updatedAt: d.updated_at,
  }));
  return [...draftOnly, ...rows];
}

export interface ProductForEdit {
  /** Contenu à éditer : le brouillon s'il existe, sinon la version en ligne. */
  data: Product;
  state: PublishState;
  inStock: boolean;
  draftSavedAt: string | null;
  publishedAt: string | null;
  /** Adresse publique actuelle (null si jamais publié). */
  publicPath: string | null;
}

export async function getProductForEdit(db: Db, id: string): Promise<ProductForEdit | null> {
  const [pub, draft] = await Promise.all([
    db.from("products").select("data, in_stock, published_at, category, slug").eq("id", id).maybeSingle(),
    db.from("drafts").select("data, updated_at").eq("entity", "product").eq("key", id).maybeSingle(),
  ]);
  if (!pub.data && !draft.data) return null;
  return {
    data: (draft.data?.data ?? pub.data!.data) as unknown as Product,
    state: pub.data ? (draft.data ? "published-with-draft" : "published") : "draft-only",
    inStock: pub.data?.in_stock ?? true,
    draftSavedAt: draft.data?.updated_at ?? null,
    publishedAt: pub.data?.published_at ?? null,
    publicPath: pub.data ? `/${pub.data.category}/${pub.data.slug}` : null,
  };
}

export async function listAdminCategories(db: Db) {
  const [cats, drafts] = await Promise.all([
    db.from("categories").select("slug, data, position, published_at").order("position"),
    db.from("drafts").select("key, data, updated_at").eq("entity", "category"),
  ]);
  const draftByKey = new Map((drafts.data ?? []).map((d) => [d.key, d]));
  return (cats.data ?? []).map((c) => {
    const draft = draftByKey.get(c.slug);
    return {
      slug: c.slug,
      data: (draft?.data ?? c.data) as unknown as Category,
      state: (draft ? "published-with-draft" : "published") as PublishState,
      draftSavedAt: draft?.updated_at ?? null,
      publishedAt: c.published_at,
    };
  });
}

export async function listAdminBrands(db: Db) {
  const [brands, products] = await Promise.all([
    db.from("brands").select("slug, name, created_at").order("name"),
    db.from("products").select("brand"),
  ]);
  const counts = new Map<string, number>();
  for (const p of products.data ?? []) counts.set(p.brand, (counts.get(p.brand) ?? 0) + 1);
  return (brands.data ?? []).map((b) => ({ ...b, productCount: counts.get(b.slug) ?? 0 }));
}

export async function getSettingsForEdit(db: Db) {
  const [pub, draft] = await Promise.all([
    db.from("site_settings").select("data, published_at").eq("id", "main").maybeSingle(),
    db.from("drafts").select("data, updated_at").eq("entity", "settings").eq("key", "main").maybeSingle(),
  ]);
  return {
    data: withDefaults((draft.data?.data ?? pub.data?.data) as Partial<StoreSettings> | undefined),
    state: (draft.data ? "published-with-draft" : "published") as PublishState,
    draftSavedAt: draft.data?.updated_at ?? null,
    publishedAt: pub.data?.published_at ?? null,
  };
}

export async function listCustomers(db: Db) {
  const [customers, carts] = await Promise.all([db.rpc("admin_list_customers"), db.from("carts").select("user_id, lines, updated_at")]);
  const cartByUser = new Map((carts.data ?? []).map((c) => [c.user_id, c]));
  return (customers.data ?? []).map((c) => {
    const cart = cartByUser.get(c.id);
    const lines = cart ? parseCart(JSON.stringify(cart.lines)) : [];
    return { ...c, cartItems: lines.reduce((s, l) => s + l.qty, 0), cartUpdatedAt: cart?.updated_at ?? null };
  });
}

/** Chiffres du tableau de bord : uniquement des données réelles, calculées. */
export async function getDashboard(db: Db) {
  const [products, customers, carts, drafts] = await Promise.all([
    listAdminProducts(db),
    db.rpc("admin_list_customers"),
    db.from("carts").select("lines, updated_at"),
    db.from("drafts").select("entity, key, updated_at, name:data->>name").order("updated_at", { ascending: false }),
  ]);
  const online = products.filter((p) => p.state !== "draft-only");
  const activeCarts = (carts.data ?? [])
    .map((c) => parseCart(JSON.stringify(c.lines)))
    .filter((lines) => lines.length > 0);
  return {
    products,
    online,
    outOfStock: online.filter((p) => !p.inStock || p.totalStock === 0),
    lowStock: online.filter((p) => p.inStock && p.lowStock),
    drafts: drafts.data ?? [],
    customerCount: customers.data?.length ?? 0,
    recentCustomers: (customers.data ?? []).slice(0, 5),
    activeCarts: activeCarts.length,
    cartItems: activeCarts.reduce((s, lines) => s + lines.reduce((t, l) => t + l.qty, 0), 0),
  };
}
