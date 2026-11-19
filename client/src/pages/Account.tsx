import { PasswordInput } from "../components/PasswordInput";
// Customer account: profile, orders, addresses, password.
import { Link } from "wouter";
import { useState } from "react";
import { trpc } from "@/_core/trpc";
import { useAuth } from "@/_core/useAuth";
import { ORDER_STATUS_LABEL, DISTRICTS, formatTaka } from "@shared/catalog";
import { usePageMeta } from "../lib/hooks";
import { EmptyState } from "../components/shared";

type Tab = "orders" | "addresses" | "profile";

export default function Account() {
  usePageMeta("Your account — Elite Paradise", "Your Elite Paradise account.");
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<Tab>("orders");

  const orders = trpc.checkout.myOrders.useQuery(undefined, { enabled: !!user });
  const addresses = trpc.account.addresses.useQuery(undefined, { enabled: !!user });

  if (!user) return null; // <Protected> handles the redirect

  return (
    <div className="bg-ivory">
      <div className="ep-shell py-10 md:py-14">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
          <div>
            <p className="ep-eyebrow mb-3">Your account</p>
            <h1 className="ep-display ep-h2">{user.name || "Welcome back"}</h1>
            <p className="text-[13px] text-grey mt-2">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={() => logout()}
            className="ep-btn ep-btn-ghost ep-btn-sm"
          >
            Sign out
          </button>
        </div>

        <div className="grid lg:grid-cols-[200px_1fr] gap-10">
          <nav aria-label="Account sections" className="flex lg:flex-col gap-1 overflow-x-auto ep-no-scrollbar">
            {(
              [
                ["orders", "Orders"],
                ["addresses", "Addresses"],
                ["profile", "Profile & password"],
              ] as [Tab, string][]
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                aria-current={tab === key}
                className={`shrink-0 text-left px-4 py-3 text-[11px] tracking-[0.16em] uppercase transition-colors ${
                  tab === key ? "bg-gold text-night" : "text-ink hover:bg-white"
                }`}
              >
                {label}
              </button>
            ))}
            <Link
              href="/wishlist"
              className="shrink-0 text-left px-4 py-3 text-[11px] tracking-[0.16em] uppercase text-ink hover:bg-white transition-colors"
            >
              Wishlist
            </Link>
          </nav>

          <div>
            {tab === "orders" && (
              <section>
                <h2 className="text-[11px] font-medium tracking-[0.2em] uppercase mb-5 pb-3 border-b border-border">
                  Your orders
                </h2>
                {orders.isLoading ? (
                  <div className="space-y-3">
                    <div className="ep-skeleton h-20 w-full" />
                    <div className="ep-skeleton h-20 w-full" />
                  </div>
                ) : !orders.data?.length ? (
                  <EmptyState
                    title="No orders yet"
                    body="When you place an order it will appear here, with its status and contents."
                    action={{ label: "Start shopping", href: "/collections/shop-all" }}
                  />
                ) : (
                  <ul className="space-y-3">
                    {orders.data.map((o) => (
                      <li key={o.id} className="bg-white border border-border p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <Link
                              href={`/order/${o.orderNumber}`}
                              className="font-serif text-[15px] text-ink hover:text-gold-deep"
                            >
                              {o.orderNumber}
                            </Link>
                            <p className="text-[11.5px] text-grey mt-1">
                              {new Date(o.createdAt).toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })}{" "}
                              · {o.items.length} {o.items.length === 1 ? "item" : "items"}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="ep-badge ep-badge-gold">
                              {ORDER_STATUS_LABEL[o.status] ?? o.status}
                            </span>
                            <p className="text-[13px] text-ink mt-2 tabular-nums">
                              {formatTaka(o.total)}
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            {tab === "addresses" && <Addresses addresses={addresses.data} loading={addresses.isLoading} />}

            {tab === "profile" && <Profile name={user.name} email={user.email} />}
          </div>
        </div>
      </div>
    </div>
  );
}

function Addresses({
  addresses,
  loading,
}: {
  addresses?: { id: string; label: string | null; name: string; phone: string; address: string; district: string; city: string; postalCode: string | null; isDefault: boolean }[];
  loading: boolean;
}) {
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    label: "",
    name: "",
    phone: "",
    address: "",
    district: "Dhaka",
    city: "",
    postalCode: "",
  });

  const add = trpc.account.addAddress.useMutation({
    onSuccess: () => {
      utils.account.addresses.invalidate();
      setOpen(false);
      setForm({ label: "", name: "", phone: "", address: "", district: "Dhaka", city: "", postalCode: "" });
    },
  });
  const remove = trpc.account.removeAddress.useMutation({
    onSuccess: () => utils.account.addresses.invalidate(),
  });

  return (
    <section>
      <div className="flex items-center justify-between mb-5 pb-3 border-b border-border">
        <h2 className="text-[11px] font-medium tracking-[0.2em] uppercase">Saved addresses</h2>
        {!open && (
          <button type="button" onClick={() => setOpen(true)} className="ep-link text-[10px]">
            Add address
          </button>
        )}
      </div>

      {loading ? (
        <div className="ep-skeleton h-24 w-full" />
      ) : !addresses?.length && !open ? (
        <EmptyState
          title="No saved addresses"
          body="Save an address and checkout will fill it in for you next time."
        />
      ) : (
        <ul className="grid sm:grid-cols-2 gap-3">
          {addresses?.map((a) => (
            <li key={a.id} className="bg-white border border-border p-5 relative">
              {a.label && (
                <p className="ep-eyebrow text-[8px] mb-2">{a.label}</p>
              )}
              <address className="not-italic text-[13px] leading-relaxed text-ink/80">
                {a.name}
                <br />
                {a.address}
                <br />
                {a.city}, {a.district}
                {a.postalCode ? ` ${a.postalCode}` : ""}
                <br />
                {a.phone}
              </address>
              <button
                type="button"
                onClick={() => remove.mutate({ id: a.id })}
                className="mt-3 text-[10px] tracking-[0.14em] uppercase text-grey hover:text-destructive transition-colors"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            add.mutate({
              ...form,
              label: form.label || null,
              postalCode: form.postalCode || null,
            });
          }}
          className="mt-4 bg-white border border-border p-5 grid sm:grid-cols-2 gap-4"
        >
          <div>
            <label htmlFor="a-label" className="ep-label">Label</label>
            <input id="a-label" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Home, Office" className="ep-field" />
          </div>
          <div>
            <label htmlFor="a-name" className="ep-label">Recipient</label>
            <input id="a-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="ep-field" />
          </div>
          <div>
            <label htmlFor="a-phone" className="ep-label">Phone</label>
            <input id="a-phone" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="ep-field" />
          </div>
          <div>
            <label htmlFor="a-district" className="ep-label">District</label>
            <select id="a-district" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} className="ep-field">
              {DISTRICTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="a-address" className="ep-label">Address</label>
            <input id="a-address" required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="ep-field" />
          </div>
          <div>
            <label htmlFor="a-city" className="ep-label">City / area</label>
            <input id="a-city" required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="ep-field" />
          </div>
          <div>
            <label htmlFor="a-post" className="ep-label">Postal code</label>
            <input id="a-post" value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} className="ep-field" />
          </div>
          {add.error && (
            <p className="sm:col-span-2 text-[12px] text-destructive">{add.error.message}</p>
          )}
          <div className="sm:col-span-2 flex gap-2">
            <button type="submit" disabled={add.isPending} className="ep-btn ep-btn-solid ep-btn-sm">
              {add.isPending ? "Saving…" : "Save address"}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="ep-btn ep-btn-ghost ep-btn-sm">
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

function Profile({ name, email }: { name: string | null; email: string }) {
  const utils = trpc.useUtils();
  const [displayName, setDisplayName] = useState(name ?? "");
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const saveName = trpc.auth.updateProfile.useMutation({
    onSuccess: () => {
      utils.auth.me.invalidate();
      setMsg("Name updated.");
    },
  });
  const changePw = trpc.auth.changePassword.useMutation({
    onSuccess: () => {
      setCurrent("");
      setNext("");
      setMsg("Password changed.");
    },
    onError: (e) => setMsg(e.message),
  });

  return (
    <section className="space-y-10">
      <div>
        <h2 className="text-[11px] font-medium tracking-[0.2em] uppercase mb-5 pb-3 border-b border-border">
          Profile
        </h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveName.mutate({ name: displayName || null });
          }}
          className="max-w-sm space-y-4"
        >
          <div>
            <label htmlFor="p-name" className="ep-label">Display name</label>
            <input id="p-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="ep-field" />
          </div>
          <div>
            <label htmlFor="p-email" className="ep-label">Email</label>
            <input id="p-email" value={email} disabled className="ep-field opacity-60" />
            <p className="mt-1.5 text-[11px] text-grey">Your email cannot be changed here.</p>
          </div>
          <button type="submit" disabled={saveName.isPending} className="ep-btn ep-btn-solid ep-btn-sm">
            Save
          </button>
        </form>
      </div>

      <div>
        <h2 className="text-[11px] font-medium tracking-[0.2em] uppercase mb-5 pb-3 border-b border-border">
          Change password
        </h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setMsg(null);
            changePw.mutate({ currentPassword: current, newPassword: next });
          }}
          className="max-w-sm space-y-4"
        >
          <div>
            <label htmlFor="p-current" className="ep-label">Current password</label>
            <PasswordInput id="p-current" required value={current} onChange={(e) => setCurrent(e.target.value)} />
          </div>
          <div>
            <label htmlFor="p-next" className="ep-label">New password</label>
            <PasswordInput id="p-next" required minLength={8} value={next} onChange={(e) => setNext(e.target.value)} />
            <p className="mt-1.5 text-[11px] text-grey">At least 8 characters.</p>
          </div>
          <button type="submit" disabled={changePw.isPending} className="ep-btn ep-btn-solid ep-btn-sm">
            {changePw.isPending ? "Changing…" : "Change password"}
          </button>
        </form>
        <p className="mt-4 text-[11px] text-grey max-w-sm leading-relaxed">
          There is no password-reset email on this site. If you forget your password, contact us and
          we will help you regain access.
        </p>
      </div>

      {msg && <p className="text-[12px] text-gold-deep">{msg}</p>}
    </section>
  );
}
