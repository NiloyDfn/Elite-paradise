// Admin dashboard — overview, products, orders, customers, discounts, settings.
import { Link } from "wouter";
import { useState } from "react";
import { trpc } from "@/_core/trpc";
import { useAuth } from "@/_core/useAuth";
import {
  CATEGORIES,
  GENDERS,
  STYLES,
  MATERIALS,
  COLORS,
  ORDER_STATUSES,
  ORDER_STATUS_LABEL,
  PAYMENT_STATUSES,
  PAYMENT_STATUS_LABEL,
  formatTaka,
} from "@shared/catalog";
import { usePageMeta } from "../lib/hooks";
import { EmptyState, IconClose, Wordmark } from "../components/shared";
import { ImageUploader } from "../components/ImageUploader";
import { BulkUpload } from "../components/BulkUpload";
import { AdminImages } from "../components/AdminImages";
import toast from "react-hot-toast";

/** "Are you sure?" popup (react-hot-toast) with Yes / Cancel buttons. */
function confirmToast(message: string, onYes: () => void) {
  toast(
    (t) => (
      <div className="text-[13px]">
        <p>{message}</p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            className="px-3 py-1.5 bg-red-600 text-white text-[11px] tracking-[0.1em] uppercase"
            onClick={() => {
              toast.dismiss(t.id);
              onYes();
            }}
          >
            Yes, delete
          </button>
          <button
            type="button"
            className="px-3 py-1.5 border border-gray-300 text-[11px] tracking-[0.1em] uppercase"
            onClick={() => toast.dismiss(t.id)}
          >
            Cancel
          </button>
        </div>
      </div>
    ),
    { duration: Infinity },
  );
}


type Tab = "overview" | "products" | "orders" | "customers" | "discounts" | "images" | "settings";

export default function Admin() {
  usePageMeta("Admin — Elite Paradise", "Elite Paradise store administration.");
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");

  if (!user) return null;

  if (user.role !== "admin") {
    return (
      <div className="ep-shell ep-section">
        <EmptyState
          title="Staff access only"
          body="This area is for Elite Paradise staff. If you believe you should have access, ask the store owner to make your account an admin."
          action={{ label: "Back to the store", href: "/" }}
        />
      </div>
    );
  }

  return (
    <div className="bg-ivory min-h-screen">
     <div className="ep-admin-zoom">
      <div className="border-b border-border bg-white">
        <div className="w-full max-w-[1900px] mx-auto px-5 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" aria-label="Elite Paradise — home">
                <Wordmark size="sm" tagline={false} />
              </Link>
              <span className="text-[9px] tracking-[0.2em] uppercase text-grey border-l border-border pl-4">
                Admin
              </span>
            </div>
            <Link href="/" className="text-[10px] tracking-[0.16em] uppercase text-grey hover:text-ink">
              View store
            </Link>
          </div>
        </div>
      </div>

      <div className="w-full max-w-[1900px] mx-auto px-5 lg:px-8 py-8">
        <div className="grid lg:grid-cols-[220px_1fr] gap-8 lg:gap-10">
          <nav aria-label="Admin sections" className="flex lg:flex-col gap-1 overflow-x-auto ep-no-scrollbar">
            {(
              [
                ["overview", "Overview"],
                ["products", "Products"],
                ["orders", "Orders"],
                ["customers", "Customers"],
                ["discounts", "Discounts"],
                ["images", "Images"],
                ["settings", "Website"],
              ] as [Tab, string][]
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                aria-current={tab === key}
                className={`shrink-0 text-left px-4 py-3 text-[12px] tracking-[0.14em] uppercase transition-colors ${
                  tab === key ? "bg-gold text-night" : "text-ink hover:bg-white"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>

          <div className="min-w-0">
            {tab === "overview" && <Overview />}
            {tab === "products" && <Products />}
            {tab === "orders" && <Orders />}
            {tab === "customers" && <Customers />}
            {tab === "discounts" && <Discounts />}
            {tab === "images" && <AdminImages />}
            {tab === "settings" && <Settings />}
          </div>
        </div>
      </div>
     </div>
    </div>
  );
}

// ── Overview ─────────────────────────────────────────────────────────────────

function Overview() {
  const { data, isLoading } = trpc.admin.overview.useQuery();

  if (isLoading) {
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="ep-skeleton h-24" />
        ))}
      </div>
    );
  }
  if (!data) return null;

  const stats = [
    { label: "Revenue", value: formatTaka(data.revenue), note: "Excluding cancelled" },
    { label: "Orders", value: String(data.orders), note: `${data.pending} open` },
    { label: "Customers", value: String(data.customers), note: "Registered accounts" },
    { label: "Products", value: String(data.products), note: "In the catalogue" },
  ];

  return (
    <div className="space-y-8">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="ep-glass-admin border border-border p-5">
            <p className="ep-eyebrow text-[8px] mb-2">{s.label}</p>
            <p className="font-serif text-[24px] text-ink tabular-nums">{s.value}</p>
            <p className="text-[10.5px] text-grey mt-1">{s.note}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="ep-glass-admin border border-border p-5">
          <h2 className="text-[10px] font-medium tracking-[0.18em] uppercase mb-4">Recent orders</h2>
          {data.recentOrders.length === 0 ? (
            <p className="text-[12.5px] text-grey">
              No orders yet. Orders appear here as soon as a customer checks out.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {data.recentOrders.map((o) => (
                <li key={o.id} className="py-2.5 flex items-center justify-between gap-3 text-[12.5px]">
                  <span className="text-ink">{o.orderNumber}</span>
                  <span className="text-grey truncate">{o.customerName}</span>
                  <span className="tabular-nums shrink-0">{formatTaka(o.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="ep-glass-admin border border-border p-5">
          <h2 className="text-[10px] font-medium tracking-[0.18em] uppercase mb-4">Low stock</h2>
          {data.lowStock.length === 0 ? (
            <p className="text-[12.5px] text-grey">Every active piece has more than 5 in stock.</p>
          ) : (
            <ul className="divide-y divide-border">
              {data.lowStock.map((p) => (
                <li key={p.id} className="py-2.5 flex items-center justify-between gap-3 text-[12.5px]">
                  <span className="text-ink truncate">{p.name}</span>
                  <span className={`tabular-nums shrink-0 ${p.stock === 0 ? "text-destructive" : "text-gold-deep"}`}>
                    {p.stock} left
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {data.bestSelling.length > 0 && (
        <section className="ep-glass-admin border border-border p-5">
          <h2 className="text-[10px] font-medium tracking-[0.18em] uppercase mb-4">Best selling</h2>
          <ul className="divide-y divide-border">
            {data.bestSelling.map((b) => (
              <li key={b.name} className="py-2.5 flex items-center justify-between gap-3 text-[12.5px]">
                <span className="text-ink truncate">{b.name}</span>
                <span className="text-grey shrink-0">{b.qty} sold</span>
                <span className="tabular-nums shrink-0">{formatTaka(b.revenue)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

// ── Products ─────────────────────────────────────────────────────────────────

function Products() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.admin.products.useQuery();
  const [editing, setEditing] = useState<string | null | "new">(null);
  const [bulk, setBulk] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  const del = trpc.admin.deleteProduct.useMutation({
    onSuccess: () => utils.admin.products.invalidate(),
  });

  const filtered = (data ?? []).filter(
    (p) =>
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()),
  );

  const allSelected = filtered.length > 0 && filtered.every((p) => selected.includes(p.id));

  const toggleOne = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const toggleAll = () => setSelected(allSelected ? [] : filtered.map((p) => p.id));

  const deleteSelected = () =>
    confirmToast(`Delete ${selected.length} selected products? This cannot be undone.`, async () => {
      const ids = [...selected];
      const loading = toast.loading(`Deleting ${ids.length} products…`);
      let ok = 0;
      for (const id of ids) {
        try {
          await del.mutateAsync({ id });
          ok++;
        } catch {
          /* keep going */
        }
      }
      toast.dismiss(loading);
      setSelected([]);
      if (ok === ids.length) toast.success(`${ok} products deleted`);
      else toast.error(`${ok} deleted, ${ids.length - ok} failed`);
    });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="ep-display ep-h3">Products</h1>
          <p className="text-[11.5px] text-grey mt-1">
            {data?.length ?? 0} pieces · sample rows are marked
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setBulk(true)} className="ep-btn ep-btn-ghost ep-btn-sm">
            Bulk upload
          </button>
          <button type="button" onClick={() => setEditing("new")} className="ep-btn ep-btn-solid ep-btn-sm">
            Add product
          </button>
        </div>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name or SKU"
        aria-label="Search products"
        className="ep-field mb-4 max-w-sm text-[13px]"
      />

      {selected.length > 0 && (
        <div className="flex items-center gap-4 mb-4 px-4 py-3 border border-border bg-white">
          <span className="text-[12px]">{selected.length} selected</span>
          <button
            type="button"
            onClick={deleteSelected}
            className="px-3 py-1.5 bg-red-600 text-white text-[10px] tracking-[0.12em] uppercase"
          >
            Delete selected
          </button>
          <button
            type="button"
            onClick={() => setSelected([])}
            className="text-[10px] tracking-[0.12em] uppercase text-grey hover:text-ink"
          >
            Clear
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="ep-skeleton h-40" />
      ) : !filtered.length ? (
        <EmptyState
          title="No products"
          body="Add your first piece and it will appear on the storefront immediately."
        />
      ) : (
        <div className="ep-glass-admin border border-border overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 w-8">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all" />
                </th>
                {["Piece", "SKU", "Price", "Stock", "Status", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-[9px] tracking-[0.14em] uppercase text-grey font-medium whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-ivory/60">
                  <td className="px-4 py-3 w-8">
                    <input
                      type="checkbox"
                      checked={selected.includes(p.id)}
                      onChange={() => toggleOne(p.id)}
                      aria-label={`Select ${p.name}`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-11 shrink-0 bg-muted overflow-hidden">
                        {p.images?.[0] && (
                          <img src={p.images[0]} alt="" className="w-full h-full object-cover" loading="lazy" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-ink truncate max-w-[220px]">{p.name}</p>
                        <p className="text-[10px] text-grey capitalize">{p.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-grey whitespace-nowrap">{p.sku}</td>
                  <td className="px-4 py-3 tabular-nums whitespace-nowrap">
                    {formatTaka(p.salePrice ?? p.price)}
                    {p.salePrice && (
                      <span className="block text-[10px] text-grey line-through">{formatTaka(p.price)}</span>
                    )}
                  </td>
                  <td className={`px-4 py-3 tabular-nums ${p.stock === 0 ? "text-destructive" : ""}`}>
                    {p.stock}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`ep-badge ${p.isActive ? "ep-badge-gold" : "ep-badge-outline"}`}>
                      {p.isActive ? "Live" : "Hidden"}
                    </span>
                    {p.isSample && (
                      <span className="block mt-1 text-[9px] tracking-[0.1em] uppercase text-grey">Sample</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => setEditing(p.id)}
                      className="text-[10px] tracking-[0.12em] uppercase text-ink hover:text-gold-deep mr-3"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        confirmToast(`Delete “${p.name}”? This cannot be undone.`, () => {
                          del.mutate({ id: p.id });
                          toast.success("Product deleted");
                        })
                      }
                      className="text-[10px] tracking-[0.12em] uppercase text-grey hover:text-destructive"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {bulk && (
        <BulkUpload onClose={() => setBulk(false)} onDone={() => utils.admin.products.invalidate()} />
      )}

      {editing && (
        <ProductForm
          id={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function ProductForm({ id, onClose }: { id: string | null; onClose: () => void }) {
  const utils = trpc.useUtils();
  const existing = trpc.admin.product.useQuery({ id: id! }, { enabled: !!id });
  const p = existing.data;

  const [form, setForm] = useState({
    slug: "",
    name: "",
    description: "",
    price: "",
    salePrice: "",
    sku: "",
    category: "necklaces",
    gender: "women",
    material: "18k Gold Vermeil",
    color: "Gold",
    style: "minimalist",
    sizes: "",
    images: [] as string[],
    stock: "0",
    weight: "",
    careInstructions: "",
    isActive: true,
    isBestSeller: false,
    isNewArrival: false,
    isFeatured: false,
  });
  const [loaded, setLoaded] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Hydrate once the row arrives.
  if (p && !loaded) {
    setLoaded(true);
    setForm({
      slug: p.slug,
      name: p.name,
      description: p.description ?? "",
      price: String(p.price),
      salePrice: p.salePrice != null ? String(p.salePrice) : "",
      sku: p.sku,
      category: p.category,
      gender: p.gender,
      material: p.material ?? "",
      color: p.color ?? "",
      style: p.style ?? "",
      sizes: (p.sizes ?? []).join(", "),
      images: p.images ?? [],
      stock: String(p.stock),
      weight: p.weight ?? "",
      careInstructions: p.careInstructions ?? "",
      isActive: p.isActive,
      isBestSeller: p.isBestSeller,
      isNewArrival: p.isNewArrival,
      isFeatured: p.isFeatured,
    });
  }

  const create = trpc.admin.createProduct.useMutation({
    onSuccess: () => {
      utils.admin.products.invalidate();
      onClose();
    },
    onError: (e) => setErr(e.message),
  });
  const update = trpc.admin.updateProduct.useMutation({
    onSuccess: () => {
      utils.admin.products.invalidate();
      onClose();
    },
    onError: (e) => setErr(e.message),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    const payload = {
      slug: form.slug.trim(),
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: Number(form.price),
      salePrice: form.salePrice.trim() ? Number(form.salePrice) : null,
      sku: form.sku.trim(),
      category: form.category,
      gender: form.gender,
      material: form.material.trim() || null,
      color: form.color.trim() || null,
      style: form.style.trim() || null,
      sizes: form.sizes.trim()
        ? form.sizes.split(",").map((s) => s.trim()).filter(Boolean)
        : null,
      images: form.images.length ? form.images : null,
      stock: Number(form.stock),
      weight: form.weight.trim() || null,
      careInstructions: form.careInstructions.trim() || null,
      isActive: form.isActive,
      isBestSeller: form.isBestSeller,
      isNewArrival: form.isNewArrival,
      isFeatured: form.isFeatured,
    };
    if (!Number.isFinite(payload.price) || payload.price < 0) {
      setErr("Price must be a whole number of Taka.");
      return;
    }
    if (id) update.mutate({ id, ...payload });
    else create.mutate(payload);
  };

  const busy = create.isPending || update.isPending;

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-night/70 p-4 md:p-8">
      <div className="bg-ivory w-full max-w-2xl my-4" role="dialog" aria-modal="true" aria-label={id ? "Edit product" : "Add product"}>
        <div className="flex items-center justify-between px-6 h-14 border-b border-border sticky top-0 bg-ivory z-10">
          <h2 className="text-[11px] tracking-[0.2em] uppercase">{id ? "Edit product" : "Add product"}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="p-2 -mr-2">
            <IconClose />
          </button>
        </div>

        {id && existing.isLoading ? (
          <div className="p-6"><div className="ep-skeleton h-64" /></div>
        ) : (
          <form onSubmit={submit} className="p-6 grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="f-name" className="ep-label">Name</label>
              <input id="f-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="ep-field" />
            </div>
            <div>
              <label htmlFor="f-slug" className="ep-label">URL slug</label>
              <input id="f-slug" required pattern="[a-z0-9-]+" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="aurelia-pearl-necklace" className="ep-field" />
              <p className="mt-1 text-[10.5px] text-grey">Lowercase letters, numbers, hyphens.</p>
            </div>
            <div>
              <label htmlFor="f-sku" className="ep-label">SKU</label>
              <input id="f-sku" required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="ep-field" />
            </div>
            <div>
              <label htmlFor="f-price" className="ep-label">Price (৳)</label>
              <input id="f-price" required type="number" min={0} step={1} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="ep-field" />
            </div>
            <div>
              <label htmlFor="f-sale" className="ep-label">Sale price (৳, optional)</label>
              <input id="f-sale" type="number" min={0} step={1} value={form.salePrice} onChange={(e) => setForm({ ...form, salePrice: e.target.value })} className="ep-field" />
            </div>
            <div>
              <label htmlFor="f-cat" className="ep-label">Category</label>
              <select id="f-cat" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="ep-field">
                {CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="f-gender" className="ep-label">Collection</label>
              <select id="f-gender" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="ep-field">
                {GENDERS.map((g) => <option key={g.slug} value={g.slug}>{g.label}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="f-mat" className="ep-label">Material</label>
              <input id="f-mat" list="mats" value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} className="ep-field" />
              <datalist id="mats">{MATERIALS.map((m) => <option key={m} value={m} />)}</datalist>
            </div>
            <div>
              <label htmlFor="f-color" className="ep-label">Colour</label>
              <input id="f-color" list="cols" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="ep-field" />
              <datalist id="cols">{COLORS.map((c) => <option key={c} value={c} />)}</datalist>
            </div>
            <div>
              <label htmlFor="f-style" className="ep-label">Style</label>
              <select id="f-style" value={form.style} onChange={(e) => setForm({ ...form, style: e.target.value })} className="ep-field">
                {STYLES.map((s) => <option key={s.slug} value={s.slug}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="f-stock" className="ep-label">Stock</label>
              <input id="f-stock" required type="number" min={0} step={1} value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="ep-field" />
            </div>
            <div>
              <label htmlFor="f-weight" className="ep-label">Weight</label>
              <input id="f-weight" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} placeholder="3.2 g" className="ep-field" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="f-sizes" className="ep-label">Sizes / lengths (comma separated)</label>
              <input id="f-sizes" value={form.sizes} onChange={(e) => setForm({ ...form, sizes: e.target.value })} placeholder="40 cm, 45 cm, 50 cm" className="ep-field" />
            </div>
            <div className="sm:col-span-2">
              <ImageUploader
                value={form.images}
                onChange={(images) => setForm({ ...form, images })}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="f-desc" className="ep-label">Description</label>
              <textarea id="f-desc" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="ep-field resize-none" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="f-care" className="ep-label">Care instructions</label>
              <textarea id="f-care" rows={3} value={form.careInstructions} onChange={(e) => setForm({ ...form, careInstructions: e.target.value })} className="ep-field resize-none" />
            </div>

            <div className="sm:col-span-2 flex flex-wrap gap-5 pt-2">
              {(
                [
                  ["isActive", "Live on store"],
                  ["isBestSeller", "Best seller"],
                  ["isNewArrival", "New arrival"],
                  ["isFeatured", "Featured"],
                ] as [keyof typeof form, string][]
              ).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-[12px] text-ink cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form[key] as boolean}
                    onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                    className="accent-[#191919]"
                  />
                  {label}
                </label>
              ))}
            </div>

            {err && <p className="sm:col-span-2 text-[12px] text-destructive">{err}</p>}

            <div className="sm:col-span-2 flex gap-2 pt-2 border-t border-border">
              <button type="submit" disabled={busy} className="ep-btn ep-btn-solid ep-btn-sm">
                {busy ? "Saving…" : id ? "Save changes" : "Create product"}
              </button>
              <button type="button" onClick={onClose} className="ep-btn ep-btn-ghost ep-btn-sm">
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Orders ───────────────────────────────────────────────────────────────────

function Orders() {
  const utils = trpc.useUtils();
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const { data, isLoading } = trpc.admin.orders.useQuery({
    status: status || undefined,
    search: search || undefined,
  });
  const setStatusM = trpc.admin.updateOrderStatus.useMutation({
    onSuccess: () => utils.admin.orders.invalidate(),
  });

  // CSV export of exactly what is on screen — the filtered set, not the whole
  // table, so an admin can export "all pending orders" and get just those.
  const exportCsv = () => {
    if (!data?.length) return;
    const head = [
      "Order",
      "Date",
      "Customer",
      "Phone",
      "Email",
      "Address",
      "District",
      "Zone",
      "Payment method",
      "Payment status",
      "Status",
      "Subtotal",
      "Delivery",
      "Discount",
      "Total",
    ];
    const esc = (v: unknown) => {
      const s = v == null ? "" : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows = data.map((o) =>
      [
        o.orderNumber,
        new Date(o.createdAt).toISOString().slice(0, 10),
        o.customerName,
        o.phone,
        o.email,
        o.address,
        o.district,
        o.deliveryZone === "outside_dhaka" ? "Outside Dhaka" : "Inside Dhaka",
        o.paymentMethod,
        o.paymentStatus,
        ORDER_STATUS_LABEL[o.status] ?? o.status,
        o.subtotal,
        o.deliveryCharge,
        o.discount,
        o.total,
      ]
        .map(esc)
        .join(","),
    );
    const blob = new Blob([[head.join(","), ...rows].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `elite-paradise-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-1">
        <h1 className="ep-display ep-h3">Orders</h1>
        <button
          type="button"
          onClick={exportCsv}
          disabled={!data?.length}
          className="ep-btn ep-btn-ghost text-[10px] disabled:opacity-40"
        >
          Export CSV
        </button>
      </div>
      <p className="text-[11.5px] text-grey mb-5">{data?.length ?? 0} orders</p>

      <div className="flex flex-wrap gap-3 mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Order number, name, phone or email"
          aria-label="Search orders"
          className="ep-field max-w-xs text-[13px]"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Filter by status"
          className="ep-field max-w-[180px] text-[13px]"
        >
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="ep-skeleton h-40" />
      ) : !data?.length ? (
        <EmptyState
          title="No orders"
          body="Orders appear here the moment a customer checks out. Nothing has come in yet."
        />
      ) : (
        <div className="ep-glass-admin border border-border overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="border-b border-border text-left">
                {["Order", "Customer", "Total", "Payment", "Status", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-[9px] tracking-[0.14em] uppercase text-grey font-medium whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map((o) => (
                <tr key={o.id} className="hover:bg-ivory/60 align-top">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Link href={`/order/${o.orderNumber}`} className="text-ink hover:text-gold-deep">
                      {o.orderNumber}
                    </Link>
                    <p className="text-[10px] text-grey mt-0.5">
                      {new Date(o.createdAt).toLocaleDateString("en-GB")}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-ink">{o.customerName}</p>
                    <p className="text-[10px] text-grey">{o.phone}</p>
                  </td>
                  <td className="px-4 py-3 tabular-nums whitespace-nowrap">{formatTaka(o.total)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="text-grey capitalize">{o.paymentMethod}</p>
                    <p
                      className={`text-[10px] mt-0.5 ${
                        o.paymentStatus === "paid" ? "text-ink" : "text-grey"
                      }`}
                    >
                      {PAYMENT_STATUS_LABEL[o.paymentStatus] ?? o.paymentStatus}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={o.status}
                      onChange={(e) => setStatusM.mutate({ id: o.id, status: e.target.value })}
                      aria-label={`Status for ${o.orderNumber}`}
                      className="border border-input bg-white px-2 py-1.5 text-[11px] text-ink"
                    >
                      {ORDER_STATUSES.map((s) => (
                        <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setOpenId(openId === o.id ? null : o.id)}
                      className="text-[10px] tracking-[0.08em] uppercase text-grey hover:text-ink whitespace-nowrap"
                    >
                      {openId === o.id ? "Close" : "Details"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {openId && (
        <OrderDetail
          id={openId}
          onClose={() => setOpenId(null)}
          onSaved={() => utils.admin.orders.invalidate()}
        />
      )}
    </div>
  );
}

// ── Order detail: payment status, internal notes, printable invoice ──────────

function OrderDetail({
  id,
  onClose,
  onSaved,
}: {
  id: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { data, isLoading } = trpc.admin.order.useQuery({ id });
  const [notes, setNotes] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const save = trpc.admin.updateOrderStatus.useMutation({
    onSuccess: () => {
      setSaved(true);
      onSaved();
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const currentNotes = notes ?? data?.internalNotes ?? "";

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-night/70 p-4 md:p-8">
      <div
        className="ep-glass-admin w-full max-w-2xl my-4"
        role="dialog"
        aria-modal="true"
        aria-label="Order details"
      >
        <div className="flex items-center justify-between px-6 h-14 border-b border-border sticky top-0 ep-glass-admin z-10">
          <h2 className="text-[11px] tracking-[0.2em] uppercase">
            {data?.orderNumber ?? "Order"}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="p-2 -mr-2">
            <IconClose />
          </button>
        </div>

        {isLoading || !data ? (
          <div className="p-6"><div className="ep-skeleton h-48" /></div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Customer + delivery */}
            <section className="grid sm:grid-cols-2 gap-4 text-[12.5px]">
              <div>
                <p className="ep-eyebrow text-[8px] mb-2">Customer</p>
                <p className="text-ink">{data.customerName}</p>
                <p className="text-grey">{data.phone}</p>
                <p className="text-grey break-all">{data.email}</p>
              </div>
              <div>
                <p className="ep-eyebrow text-[8px] mb-2">Delivery</p>
                <p className="text-ink">{data.address}</p>
                <p className="text-grey">
                  {data.city}, {data.district}
                  {data.postalCode ? ` ${data.postalCode}` : ""}
                </p>
                <p className="text-grey">
                  {data.deliveryZone === "outside_dhaka" ? "Outside Dhaka" : "Inside Dhaka"}
                </p>
              </div>
            </section>

            {/* Items */}
            <section>
              <p className="ep-eyebrow text-[8px] mb-2">Items</p>
              <ul className="divide-y divide-border border-y border-border">
                {data.items.map((it) => (
                  <li key={it.id} className="py-2.5 flex justify-between gap-3 text-[12.5px]">
                    <span className="text-ink/85">
                      {it.name}
                      {it.variant ? <span className="text-grey"> · {it.variant}</span> : null}
                      <span className="text-grey"> × {it.qty}</span>
                    </span>
                    <span className="tabular-nums shrink-0">{formatTaka(it.price * it.qty)}</span>
                  </li>
                ))}
              </ul>
              <dl className="mt-3 space-y-1.5 text-[12.5px]">
                <div className="flex justify-between"><dt className="text-grey">Subtotal</dt><dd className="tabular-nums">{formatTaka(data.subtotal)}</dd></div>
                <div className="flex justify-between"><dt className="text-grey">Delivery</dt><dd className="tabular-nums">{data.deliveryCharge === 0 ? "Complimentary" : formatTaka(data.deliveryCharge)}</dd></div>
                {data.discount > 0 && (
                  <div className="flex justify-between"><dt className="text-grey">Discount</dt><dd className="tabular-nums">−{formatTaka(data.discount)}</dd></div>
                )}
                <div className="flex justify-between pt-1.5 border-t border-border">
                  <dt className="text-[10px] tracking-[0.16em] uppercase">Total</dt>
                  <dd className="tabular-nums">{formatTaka(data.total)}</dd>
                </div>
              </dl>
            </section>

            {/* Payment */}
            <section>
              <p className="ep-eyebrow text-[8px] mb-2">Payment</p>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-[12.5px] text-ink capitalize">{data.paymentMethod}</span>
                <select
                  value={data.paymentStatus}
                  onChange={(e) =>
                    save.mutate({
                      id: data.id,
                      status: data.status,
                      paymentStatus: e.target.value as "unpaid" | "paid" | "refunded" | "failed",
                    })
                  }
                  aria-label="Payment status"
                  className="border border-input bg-white px-2 py-1.5 text-[11px] text-ink"
                >
                  {PAYMENT_STATUSES.map((s) => (
                    <option key={s} value={s}>{PAYMENT_STATUS_LABEL[s]}</option>
                  ))}
                </select>
                <span className="text-[10.5px] text-grey">
                  No gateway is connected — set this by hand once money is received.
                </span>
              </div>
            </section>

            {/* Status trail */}
            {data.statusHistory && data.statusHistory.length > 0 && (
              <section>
                <p className="ep-eyebrow text-[8px] mb-2">Status history</p>
                <ol className="space-y-1 text-[11.5px]">
                  {data.statusHistory.map((h, i) => (
                    <li key={`${h.status}-${i}`} className="flex justify-between gap-3">
                      <span className="text-ink">{ORDER_STATUS_LABEL[h.status] ?? h.status}</span>
                      <span className="text-grey tabular-nums">
                        {new Date(h.at).toLocaleString("en-GB", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {/* Internal notes — never shown to the customer */}
            <section>
              <label htmlFor="o-notes" className="ep-eyebrow text-[8px] block mb-2">
                Internal notes (not visible to the customer)
              </label>
              <textarea
                id="o-notes"
                rows={3}
                value={currentNotes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Courier, call attempts, special handling…"
                className="ep-field resize-none text-[12.5px]"
              />
              <div className="flex items-center gap-3 mt-2">
                <button
                  type="button"
                  onClick={() =>
                    save.mutate({
                      id: data.id,
                      status: data.status,
                      internalNotes: currentNotes || null,
                    })
                  }
                  disabled={save.isPending}
                  className="ep-btn ep-btn-ghost text-[10px]"
                >
                  {save.isPending ? "Saving…" : "Save note"}
                </button>
                {saved && <span className="text-[10.5px] text-grey">Saved</span>}
              </div>
            </section>

            {data.notes && (
              <section>
                <p className="ep-eyebrow text-[8px] mb-2">Customer note</p>
                <p className="text-[12.5px] text-ink/80">{data.notes}</p>
              </section>
            )}

            <div className="pt-2 border-t border-border flex gap-3">
              <button type="button" onClick={() => window.print()} className="ep-btn ep-btn-ghost text-[10px]">
                Print invoice
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Customers ────────────────────────────────────────────────────────────────

function Customers() {
  const { data, isLoading } = trpc.admin.customers.useQuery();

  return (
    <div>
      <h1 className="ep-display ep-h3 mb-1">Customers</h1>
      <p className="text-[11.5px] text-grey mb-5">{data?.length ?? 0} accounts</p>

      {isLoading ? (
        <div className="ep-skeleton h-40" />
      ) : !data?.length ? (
        <EmptyState
          title="No customers yet"
          body="Accounts appear here when someone signs up. Guest orders still show under Orders."
        />
      ) : (
        <div className="ep-glass-admin border border-border overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="border-b border-border text-left">
                {["Customer", "Role", "Orders", "Spend", "Joined"].map((h) => (
                  <th key={h} className="px-4 py-3 text-[9px] tracking-[0.14em] uppercase text-grey font-medium whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map((c) => (
                <tr key={c.id} className="hover:bg-ivory/60">
                  <td className="px-4 py-3">
                    <p className="text-ink">{c.name || "—"}</p>
                    <p className="text-[10px] text-grey">{c.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`ep-badge ${c.role === "admin" ? "ep-badge-gold" : "ep-badge-outline"}`}>
                      {c.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 tabular-nums">{c.orderCount}</td>
                  <td className="px-4 py-3 tabular-nums whitespace-nowrap">{formatTaka(c.spend)}</td>
                  <td className="px-4 py-3 text-grey whitespace-nowrap">
                    {new Date(c.createdAt).toLocaleDateString("en-GB")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Discounts ────────────────────────────────────────────────────────────────

function Discounts() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.admin.discounts.useQuery();
  const [form, setForm] = useState({ code: "", type: "percent", value: "10", minSubtotal: "0" });
  const [err, setErr] = useState<string | null>(null);

  const create = trpc.admin.createDiscount.useMutation({
    onSuccess: () => {
      utils.admin.discounts.invalidate();
      setForm({ code: "", type: "percent", value: "10", minSubtotal: "0" });
    },
    onError: (e) => setErr(e.message),
  });
  const del = trpc.admin.deleteDiscount.useMutation({
    onSuccess: () => utils.admin.discounts.invalidate(),
  });

  return (
    <div>
      <h1 className="ep-display ep-h3 mb-1">Discount codes</h1>
      <p className="text-[11.5px] text-grey mb-5">Codes customers can enter at checkout.</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setErr(null);
          create.mutate({
            code: form.code.trim().toUpperCase(),
            type: form.type as "percent" | "fixed",
            value: Number(form.value),
            minSubtotal: Number(form.minSubtotal) || 0,
          });
        }}
        className="ep-glass-admin border border-border p-5 grid sm:grid-cols-4 gap-3 items-end mb-6"
      >
        <div>
          <label htmlFor="d-code" className="ep-label">Code</label>
          <input id="d-code" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="ep-field" />
        </div>
        <div>
          <label htmlFor="d-type" className="ep-label">Type</label>
          <select id="d-type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="ep-field">
            <option value="percent">Percent off</option>
            <option value="fixed">Fixed ৳ off</option>
          </select>
        </div>
        <div>
          <label htmlFor="d-value" className="ep-label">Value</label>
          <input id="d-value" required type="number" min={1} value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className="ep-field" />
        </div>
        <div>
          <label htmlFor="d-min" className="ep-label">Min subtotal (৳)</label>
          <input id="d-min" type="number" min={0} value={form.minSubtotal} onChange={(e) => setForm({ ...form, minSubtotal: e.target.value })} className="ep-field" />
        </div>
        {err && <p className="sm:col-span-4 text-[12px] text-destructive">{err}</p>}
        <div className="sm:col-span-4">
          <button type="submit" disabled={create.isPending} className="ep-btn ep-btn-solid ep-btn-sm">
            {create.isPending ? "Creating…" : "Create code"}
          </button>
        </div>
      </form>

      {isLoading ? (
        <div className="ep-skeleton h-32" />
      ) : !data?.length ? (
        <EmptyState title="No discount codes" body="Create a code above and it works at checkout immediately." />
      ) : (
        <div className="ep-glass-admin border border-border overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="border-b border-border text-left">
                {["Code", "Discount", "Min subtotal", "Status", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-[9px] tracking-[0.14em] uppercase text-grey font-medium whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map((d) => (
                <tr key={d.id}>
                  <td className="px-4 py-3 font-mono text-ink">{d.code}</td>
                  <td className="px-4 py-3">
                    {d.type === "percent" ? `${d.value}%` : formatTaka(d.value)}
                  </td>
                  <td className="px-4 py-3 tabular-nums">{formatTaka(d.minSubtotal)}</td>
                  <td className="px-4 py-3">
                    <span className={`ep-badge ${d.isActive ? "ep-badge-gold" : "ep-badge-outline"}`}>
                      {d.isActive ? "Active" : "Off"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() =>
                        confirmToast(`Delete code ${d.code}?`, () => {
                          del.mutate({ id: d.id });
                          toast.success("Code deleted");
                        })
                      }
                      className="text-[10px] tracking-[0.12em] uppercase text-grey hover:text-destructive"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Website settings ─────────────────────────────────────────────────────────

function Settings() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.admin.settings.useQuery();
  const [form, setForm] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);

  if (data && !loaded) {
    setLoaded(true);
    setForm({
      announcementBar: data.announcementBar ?? "",
      heroHeadline: data.heroHeadline ?? "",
      heroSubhead: data.heroSubhead ?? "",
      heroImage: data.heroImage ?? "",
      brandStory: data.brandStory ?? "",
      whatsappNumber: data.whatsappNumber ?? "",
      instagram: data.instagram ?? "",
      facebook: data.facebook ?? "",
      contactEmail: data.contactEmail ?? "",
      contactPhone: data.contactPhone ?? "",
      address: data.address ?? "",
      deliveryCharge: String(data.deliveryCharge),
      deliveryChargeOutside: String(data.deliveryChargeOutside),
      freeDeliveryThreshold: String(data.freeDeliveryThreshold),
      orderPrefix: data.orderPrefix,
    });
  }

  const save = trpc.admin.updateSettings.useMutation({
    onSuccess: () => {
      utils.admin.settings.invalidate();
      utils.catalog.settings.invalidate();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  if (isLoading) return <div className="ep-skeleton h-64" />;

  const field = (key: string, label: string, opts: { textarea?: boolean; hint?: string; type?: string } = {}) => (
    <div>
      <label htmlFor={`s-${key}`} className="ep-label">{label}</label>
      {opts.textarea ? (
        <textarea
          id={`s-${key}`}
          rows={3}
          value={form[key] ?? ""}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          className="ep-field resize-none"
        />
      ) : (
        <input
          id={`s-${key}`}
          type={opts.type ?? "text"}
          value={form[key] ?? ""}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          className="ep-field"
        />
      )}
      {opts.hint && <p className="mt-1 text-[10.5px] text-grey">{opts.hint}</p>}
    </div>
  );

  return (
    <div>
      <h1 className="ep-display ep-h3 mb-1">Website</h1>
      <p className="text-[11.5px] text-grey mb-6">
        Text and contact details shown across the storefront.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate({
            announcementBar: form.announcementBar || null,
            heroHeadline: form.heroHeadline || null,
            heroSubhead: form.heroSubhead || null,
            heroImage: form.heroImage || null,
            brandStory: form.brandStory || null,
            whatsappNumber: form.whatsappNumber || null,
            instagram: form.instagram || null,
            facebook: form.facebook || null,
            contactEmail: form.contactEmail || null,
            contactPhone: form.contactPhone || null,
            address: form.address || null,
            deliveryCharge: Number(form.deliveryCharge) || 0,
            deliveryChargeOutside: Number(form.deliveryChargeOutside) || 0,
            freeDeliveryThreshold: Number(form.freeDeliveryThreshold) || 0,
            orderPrefix: form.orderPrefix.trim() || "EP",
          });
        }}
        className="space-y-8"
      >
        <section className="ep-glass-admin border border-border p-5 space-y-4">
          <h2 className="text-[10px] font-medium tracking-[0.18em] uppercase">Homepage</h2>
          {field("announcementBar", "Announcement bar", { hint: "Shown at the very top. Leave blank to hide." })}
          {field("heroHeadline", "Hero headline")}
          {field("heroSubhead", "Hero subheading", { textarea: true })}
          {field("brandStory", "Brand story", { textarea: true })}
        </section>

        <section className="ep-glass-admin border border-border p-5 space-y-4">
          <h2 className="text-[10px] font-medium tracking-[0.18em] uppercase">Contact</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {field("whatsappNumber", "WhatsApp number", { hint: "Digits only, with country code: 8801XXXXXXXXX" })}
            {field("contactPhone", "Phone")}
            {field("contactEmail", "Email", { type: "email" })}
            {field("instagram", "Instagram URL")}
            {field("facebook", "Facebook URL")}
          </div>
          {field("address", "Studio address", { textarea: true })}
        </section>

        <section className="ep-glass-admin border border-border p-5 space-y-4">
          <h2 className="text-[10px] font-medium tracking-[0.18em] uppercase">Delivery</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {field("deliveryCharge", "Delivery charge — Inside Dhaka (৳)", { type: "number" })}
            {field("deliveryChargeOutside", "Delivery charge — Outside Dhaka (৳)", { type: "number" })}
            {field("freeDeliveryThreshold", "Free delivery over (৳)", { type: "number", hint: "0 disables free delivery." })}
            {field("orderPrefix", "Order number prefix", { hint: "Orders look like EP-20261119-0001." })}
          </div>
        </section>

        <div className="flex items-center gap-4">
          <button type="submit" disabled={save.isPending} className="ep-btn ep-btn-solid ep-btn-sm">
            {save.isPending ? "Saving…" : "Save changes"}
          </button>
          {saved && <span className="text-[12px] text-gold-deep">Saved.</span>}
          {save.error && <span className="text-[12px] text-destructive">{save.error.message}</span>}
        </div>
      </form>
    </div>
  );
}
