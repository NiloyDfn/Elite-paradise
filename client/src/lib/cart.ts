// Cart + wishlist + recently-viewed, persisted in localStorage.
// Prices stored here are DISPLAY ONLY — the server re-prices at checkout.
import { useSyncExternalStore } from "react";

export type CartLine = {
  productId: string;
  slug: string;
  name: string;
  image: string | null;
  unit: number;
  qty: number;
  variant: string | null;
};

const CART_KEY = "ep.cart.v1";
const WISH_KEY = "ep.wish.v1";
const RECENT_KEY = "ep.recent.v1";

// ── Tiny external store so every component stays in sync ─────────────────────

type State = { cart: CartLine[]; wish: string[]; recent: string[] };

let state: State = { cart: [], wish: [], recent: [] };
const listeners = new Set<() => void>();
let hydrated = false;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  state = {
    cart: read<CartLine[]>(CART_KEY, []),
    wish: read<string[]>(WISH_KEY, []),
    recent: read<string[]>(RECENT_KEY, []),
  };
}

function emit() {
  for (const l of listeners) l();
}

function persist() {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(state.cart));
    localStorage.setItem(WISH_KEY, JSON.stringify(state.wish));
    localStorage.setItem(RECENT_KEY, JSON.stringify(state.recent));
  } catch {
    /* storage full or blocked — the UI still works for this session */
  }
}

function set(next: Partial<State>) {
  state = { ...state, ...next };
  persist();
  emit();
}

function subscribe(cb: () => void) {
  hydrate();
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function snapshot() {
  hydrate();
  return state;
}

// ── Cart ─────────────────────────────────────────────────────────────────────

export function addToCart(
  item: Omit<CartLine, "qty">,
  qty = 1,
) {
  hydrate();
  const key = (l: CartLine) => l.productId === item.productId && (l.variant ?? "") === (item.variant ?? "");
  const existing = state.cart.find(key);
  const cart = existing
    ? state.cart.map((l) => (key(l) ? { ...l, qty: Math.min(99, l.qty + qty) } : l))
    : [...state.cart, { ...item, qty }];
  set({ cart });
}

export function setQty(productId: string, variant: string | null, qty: number) {
  hydrate();
  const cart = state.cart
    .map((l) =>
      l.productId === productId && (l.variant ?? "") === (variant ?? "")
        ? { ...l, qty: Math.max(1, Math.min(99, qty)) }
        : l,
    )
    .filter((l) => l.qty > 0);
  set({ cart });
}

export function removeLine(productId: string, variant: string | null) {
  hydrate();
  set({
    cart: state.cart.filter(
      (l) => !(l.productId === productId && (l.variant ?? "") === (variant ?? "")),
    ),
  });
}

export function clearCart() {
  set({ cart: [] });
}

export function useCart() {
  const s = useSyncExternalStore(subscribe, snapshot, snapshot);
  const count = s.cart.reduce((n, l) => n + l.qty, 0);
  const subtotal = s.cart.reduce((n, l) => n + l.unit * l.qty, 0);
  return { lines: s.cart, count, subtotal };
}

// ── Wishlist ─────────────────────────────────────────────────────────────────

export function toggleLocalWish(productId: string) {
  hydrate();
  const has = state.wish.includes(productId);
  set({ wish: has ? state.wish.filter((id) => id !== productId) : [...state.wish, productId] });
}

export function setLocalWish(ids: string[]) {
  hydrate();
  set({ wish: ids });
}

export function useWishlist() {
  return useSyncExternalStore(subscribe, snapshot, snapshot).wish;
}

// ── Recently viewed ──────────────────────────────────────────────────────────

export function pushRecent(productId: string) {
  hydrate();
  const recent = [productId, ...state.recent.filter((id) => id !== productId)].slice(0, 8);
  set({ recent });
}

export function useRecent() {
  return useSyncExternalStore(subscribe, snapshot, snapshot).recent;
}
