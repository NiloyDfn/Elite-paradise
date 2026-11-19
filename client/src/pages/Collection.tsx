// Collection page: banner, filters, sorting, product grid.
import { Link, useSearch } from "wouter";
import { useEffect, useMemo, useState } from "react";
import { trpc } from "@/_core/trpc";
import {
  COLLECTION_META,
  CATEGORIES,
  GENDERS,
  STYLES,
  SORT_OPTIONS,
  formatTaka,
  type SortValue,
} from "@shared/catalog";
import { usePageMeta } from "../lib/hooks";
import {
  EmptyState,
  IconChevron,
  IconClose,
  ProductGrid,
  ProductGridSkeleton,
  SampleNotice,
} from "../components/shared";

type Filters = {
  category: string[];
  gender: string[];
  material: string[];
  color: string[];
  style: string[];
  minPrice?: number;
  maxPrice?: number;
  inStockOnly: boolean;
};

const EMPTY: Filters = {
  category: [],
  gender: [],
  material: [],
  color: [],
  style: [],
  inStockOnly: false,
};

export default function Collection({ slug }: { slug: string }) {
  const search = useSearch();
  const initialQ = new URLSearchParams(search).get("q") ?? "";

  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [sort, setSort] = useState<SortValue>("featured");
  const [q, setQ] = useState(initialQ);
  const [panelOpen, setPanelOpen] = useState(false);

  const meta = COLLECTION_META[slug];
  const title = meta?.name ?? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  usePageMeta(
    `${title} — Elite Paradise`,
    meta?.description ?? `Shop ${title} at Elite Paradise.`,
  );

  // Reset filters when the collection changes.
  useEffect(() => {
    setFilters(EMPTY);
    setQ("");
    setSort("featured");
  }, [slug]);

  const query = useMemo(
    () => ({
      slug,
      category: filters.category.length ? filters.category : undefined,
      gender: filters.gender.length ? filters.gender : undefined,
      material: filters.material.length ? filters.material : undefined,
      color: filters.color.length ? filters.color : undefined,
      style: filters.style.length ? filters.style : undefined,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      inStockOnly: filters.inStockOnly || undefined,
      search: q.trim() || undefined,
      sort,
      limit: 60,
    }),
    [slug, filters, sort, q],
  );

  const { data, isLoading, isError, error } = trpc.catalog.collection.useQuery(query);

  const activeCount =
    filters.category.length +
    filters.gender.length +
    filters.material.length +
    filters.color.length +
    filters.style.length +
    (filters.minPrice != null || filters.maxPrice != null ? 1 : 0) +
    (filters.inStockOnly ? 1 : 0);

  const toggle = (key: keyof Filters, value: string) => {
    setFilters((f) => {
      const arr = f[key] as string[];
      return {
        ...f,
        [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
      };
    });
  };

  const facets = data?.facets;

  return (
    <>
      {/* Collection banner — light, centred, quiet */}
      <section className="ep-page-hero">
        {meta?.heroImage && (
          <img src={meta.heroImage} alt="" className="ep-page-hero-img" fetchPriority="high" />
        )}
        <div className="ep-shell relative">
          <div className="py-14 md:py-20 max-w-2xl mx-auto text-center">
            <nav aria-label="Breadcrumb" className="mb-6">
              <ol className="flex items-center justify-center gap-2 text-[10px] tracking-[0.18em] uppercase text-grey">
                <li>
                  <Link href="/" className="hover:text-gold-deep transition-colors">
                    Home
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li className="text-ink">{title}</li>
              </ol>
            </nav>
            <h1 className="ep-display ep-h1 text-ink">{title}</h1>
            <span className="ep-orn mx-auto mt-6" aria-hidden="true" />
            {meta?.description && (
              <p className="mt-6 text-[15px] leading-relaxed text-ink/65 max-w-lg mx-auto">
                {meta.description}
              </p>
            )}
            <p className="mt-6 text-[10px] tracking-[0.2em] uppercase text-grey">
              {isLoading ? "Loading…" : `${data?.total ?? 0} ${data?.total === 1 ? "piece" : "pieces"}`}
            </p>
          </div>
        </div>
      </section>

      {/* Toolbar */}
      <div className="sticky top-[68px] md:top-[84px] z-30 bg-ivory/95 backdrop-blur-md border-b border-border">
        <div className="ep-shell">
          <div className="flex items-center justify-between gap-4 h-14">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setPanelOpen(true)}
                className="lg:hidden inline-flex items-center gap-2 text-[10px] tracking-[0.16em] uppercase text-ink"
                aria-expanded={panelOpen}
              >
                Filter
                {activeCount > 0 && (
                  <span className="w-4 h-4 flex items-center justify-center bg-gold text-night text-[9px] rounded-full">
                    {activeCount}
                  </span>
                )}
              </button>
              <p className="hidden lg:block text-[10px] tracking-[0.16em] uppercase text-grey">
                {isLoading ? "—" : `${data?.total ?? 0} pieces`}
              </p>
              {activeCount > 0 && (
                <button
                  type="button"
                  onClick={() => setFilters(EMPTY)}
                  className="hidden lg:inline-flex items-center gap-1.5 text-[10px] tracking-[0.14em] uppercase text-gold-deep hover:text-ink transition-colors"
                >
                  Clear ({activeCount})
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <label htmlFor="sort" className="sr-only">
                Sort by
              </label>
              <select
                id="sort"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortValue)}
                className="bg-transparent border-0 text-[10px] tracking-[0.14em] uppercase text-ink pr-5 cursor-pointer focus:outline-none"
                style={{
                  appearance: "none",
                  backgroundImage:
                    "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' fill='none' stroke='%23817c75' stroke-width='1.2'/%3E%3C/svg%3E\")",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right center",
                }}
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <section className="ep-section-tight bg-ivory">
        <div className="ep-shell">
          <div className="grid lg:grid-cols-[220px_1fr] gap-10 lg:gap-14">
            {/* Desktop filters */}
            <aside className="hidden lg:block">
              <FilterPanel
                filters={filters}
                setFilters={setFilters}
                toggle={toggle}
                facets={facets}
                q={q}
                setQ={setQ}
              />
            </aside>

            {/* Grid */}
            <div>
              {isError ? (
                <div className="border border-destructive/30 bg-destructive/5 p-6">
                  <p className="text-[13px] text-destructive">
                    {error?.message || "We could not load this collection."}
                  </p>
                </div>
              ) : isLoading ? (
                <ProductGridSkeleton count={8} />
              ) : data?.products.length ? (
                <>
                  <ProductGrid products={data.products} />
                  <SampleNotice className="mt-12" />
                </>
              ) : (
                <EmptyState
                  title="Nothing matches those filters"
                  body="Try widening the price range or clearing a filter — the collection may still have what you are looking for."
                  action={{ label: "Clear filters", href: `/collections/${slug}` }}
                />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Mobile filter drawer */}
      {panelOpen && (
        <>
          <div className="ep-scrim lg:hidden" onClick={() => setPanelOpen(false)} />
          <div
            className="fixed inset-y-0 left-0 z-[70] w-[88%] max-w-[360px] bg-ivory flex flex-col lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Filters"
          >
            <div className="flex items-center justify-between px-5 h-14 border-b border-border shrink-0">
              <p className="text-[11px] tracking-[0.2em] uppercase">Filter</p>
              <button type="button" onClick={() => setPanelOpen(false)} aria-label="Close filters" className="p-2 -mr-2">
                <IconClose />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-6">
              <FilterPanel
                filters={filters}
                setFilters={setFilters}
                toggle={toggle}
                facets={facets}
                q={q}
                setQ={setQ}
              />
            </div>
            <div className="p-5 border-t border-border shrink-0">
              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                className="ep-btn ep-btn-solid w-full"
              >
                Show {data?.total ?? 0} pieces
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function FilterPanel({
  filters,
  setFilters,
  toggle,
  facets,
  q,
  setQ,
}: {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  toggle: (key: keyof Filters, value: string) => void;
  facets?: {
    categories: string[];
    genders: string[];
    materials: string[];
    colors: string[];
    styles: string[];
    minPrice: number;
    maxPrice: number;
  };
  q: string;
  setQ: (v: string) => void;
}) {
  return (
    <div className="space-y-7">
      {/* Search within */}
      <div>
        <label htmlFor="filter-q" className="ep-label">
          Search
        </label>
        <input
          id="filter-q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Within this collection"
          className="ep-field text-[13px]"
        />
      </div>

      <FilterGroup title="Category">
        {CATEGORIES.filter((c) => !facets || facets.categories.includes(c.slug)).map((c) => (
          <Check
            key={c.slug}
            label={c.label}
            checked={filters.category.includes(c.slug)}
            onChange={() => toggle("category", c.slug)}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Gender">
        {GENDERS.filter((g) => !facets || facets.genders.includes(g.slug)).map((g) => (
          <Check
            key={g.slug}
            label={g.label}
            checked={filters.gender.includes(g.slug)}
            onChange={() => toggle("gender", g.slug)}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Price">
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder={facets ? String(facets.minPrice) : "Min"}
            value={filters.minPrice ?? ""}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                minPrice: e.target.value === "" ? undefined : Number(e.target.value),
              }))
            }
            aria-label="Minimum price"
            className="ep-field text-[13px] w-full"
          />
          <span className="text-grey text-[12px]">—</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder={facets ? String(facets.maxPrice) : "Max"}
            value={filters.maxPrice ?? ""}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                maxPrice: e.target.value === "" ? undefined : Number(e.target.value),
              }))
            }
            aria-label="Maximum price"
            className="ep-field text-[13px] w-full"
          />
        </div>
        {facets && (
          <p className="mt-2 text-[11px] text-grey">
            {formatTaka(facets.minPrice)} – {formatTaka(facets.maxPrice)}
          </p>
        )}
      </FilterGroup>

      {facets?.materials.length ? (
        <FilterGroup title="Material">
          {facets.materials.map((m) => (
            <Check
              key={m}
              label={m}
              checked={filters.material.includes(m)}
              onChange={() => toggle("material", m)}
            />
          ))}
        </FilterGroup>
      ) : null}

      {facets?.colors.length ? (
        <FilterGroup title="Colour">
          {facets.colors.map((c) => (
            <Check
              key={c}
              label={c}
              checked={filters.color.includes(c)}
              onChange={() => toggle("color", c)}
            />
          ))}
        </FilterGroup>
      ) : null}

      <FilterGroup title="Style">
        {STYLES.filter((s) => !facets || facets.styles.includes(s.slug)).map((s) => (
          <Check
            key={s.slug}
            label={s.label}
            checked={filters.style.includes(s.slug)}
            onChange={() => toggle("style", s.slug)}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Availability">
        <Check
          label="In stock only"
          checked={filters.inStockOnly}
          onChange={() => setFilters((f) => ({ ...f, inStockOnly: !f.inStockOnly }))}
        />
      </FilterGroup>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-t border-border pt-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="w-full flex items-center justify-between mb-3"
      >
        <span className="text-[10px] font-medium tracking-[0.18em] uppercase text-ink">{title}</span>
        <IconChevron className={`w-3 h-3 text-grey transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="space-y-2.5">{children}</div>}
    </div>
  );
}

function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group">
      <span
        className={`w-3.5 h-3.5 border flex items-center justify-center shrink-0 transition-colors ${
          checked ? "bg-gold border-gold" : "border-input group-hover:border-grey"
        }`}
      >
        {checked && (
          <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 text-night" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 6l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
      <span className="text-[12.5px] text-ink/80 group-hover:text-ink transition-colors">{label}</span>
    </label>
  );
}
