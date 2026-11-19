// Checkout. The server re-prices everything; this page never computes a total
// that the server has not confirmed.
import { Link, useLocation, useSearch } from "wouter";
import { useEffect, useState } from "react";
import { trpc } from "@/_core/trpc";
import { DISTRICTS, PAYMENT_METHODS, DELIVERY_ZONES, isValidBdPhone, zoneForDistrict, formatTaka } from "@shared/catalog";
import { usePageMeta } from "../lib/hooks";
import { clearCart, useCart } from "../lib/cart";
import { EmptyState } from "../components/shared";
import { useAuth } from "@/_core/useAuth";

export default function Checkout() {
  usePageMeta("Checkout — Elite Paradise", "Complete your Elite Paradise order.");
  const { lines, count } = useCart();
  const { user } = useAuth();
  const search = useSearch();
  const [, navigate] = useLocation();

  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    email: "",
    address: "",
    district: "Dhaka",
    city: "",
    postalCode: "",
    notes: "",
    paymentMethod: "cod",
    deliveryZone: "inside_dhaka" as "inside_dhaka" | "outside_dhaka",
  });
  const [code, setCode] = useState(new URLSearchParams(search).get("code") ?? "");
  const [applied, setApplied] = useState<string | null>(
    new URLSearchParams(search).get("code") ?? null,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Prefill from the signed-in profile.
  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        email: f.email || user.email || "",
        customerName: f.customerName || user.name || "",
      }));
    }
  }, [user]);

  const quote = trpc.checkout.quote.useQuery(
    {
      lines: lines.map((l) => ({ productId: l.productId, qty: l.qty, variant: l.variant })),
      discountCode: applied,
      deliveryZone: form.deliveryZone,
    },
    { enabled: lines.length > 0 },
  );

  const create = trpc.checkout.create.useMutation({
    onSuccess: (res) => {
      clearCart();
      navigate(`/order/${res.orderNumber}`);
    },
    onError: (e) => setErrors({ submit: e.message }),
  });

  if (count === 0) {
    return (
      <div className="ep-shell ep-section">
        <EmptyState
          title="Your bag is empty"
          body="Add a piece to your bag before checking out."
          action={{ label: "Explore the collection", href: "/collections/shop-all" }}
        />
      </div>
    );
  }

  const q = quote.data;
  const enabledMethods = PAYMENT_METHODS.filter((m) =>
    (q?.paymentMethods ?? ["cod", "bkash", "nagad", "card"]).includes(m.value),
  );

  const validate = () => {
    const e: Record<string, string> = {};
    if (form.customerName.trim().length < 2) e.customerName = "Please enter your full name.";
    if (!/^[0-9+\-\s()]{6,}$/.test(form.phone.trim())) e.phone = "Please enter a valid phone number.";
    else if (!isValidBdPhone(form.phone)) {
      e.phone = "Enter a Bangladeshi mobile number, e.g. 01712345678.";
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) e.email = "Please enter a valid email address.";
    if (form.address.trim().length < 5) e.address = "Please enter your delivery address.";
    if (!form.district) e.district = "Please choose a district.";
    if (form.city.trim().length < 2) e.city = "Please enter your city or area.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) {
      const first = document.querySelector<HTMLElement>("[aria-invalid='true']");
      first?.focus();
      return;
    }
    create.mutate({
      ...form,
      postalCode: form.postalCode || null,
      notes: form.notes || null,
      discountCode: applied,
      lines: lines.map((l) => ({ productId: l.productId, qty: l.qty, variant: l.variant })),
    });
  };

  const field = (
    name: keyof typeof form,
    label: string,
    opts: { type?: string; required?: boolean; placeholder?: string; autoComplete?: string } = {},
  ) => (
    <div>
      <label htmlFor={name} className="ep-label">
        {label}
        {opts.required && <span className="text-gold-deep ml-0.5">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={opts.type ?? "text"}
        value={form[name]}
        onChange={(e) => setForm({ ...form, [name]: e.target.value })}
        placeholder={opts.placeholder}
        autoComplete={opts.autoComplete}
        aria-invalid={!!errors[name]}
        aria-describedby={errors[name] ? `${name}-err` : undefined}
        className="ep-field"
      />
      {errors[name] && (
        <p id={`${name}-err`} className="text-[11px] text-destructive mt-1">
          {errors[name]}
        </p>
      )}
    </div>
  );

  return (
    <div className="bg-ivory">
      <div className="ep-shell py-10 md:py-14">
        <div className="mb-10">
          <p className="ep-eyebrow mb-3">Checkout</p>
          <h1 className="ep-display ep-h2">Complete your order</h1>
        </div>

        <form onSubmit={submit} className="grid lg:grid-cols-[1fr_400px] gap-10 lg:gap-16 items-start">
          {/* Left: details */}
          <div className="space-y-10">
            <section>
              <h2 className="text-[11px] font-medium tracking-[0.2em] uppercase text-ink mb-5 pb-3 border-b border-border">
                Contact
              </h2>
              <div className="grid sm:grid-cols-2 gap-5">
                {field("customerName", "Full name", { required: true, autoComplete: "name" })}
                {field("phone", "Phone", { required: true, type: "tel", autoComplete: "tel", placeholder: "01XXXXXXXXX" })}
                <div className="sm:col-span-2">
                  {field("email", "Email", { required: true, type: "email", autoComplete: "email" })}
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-[11px] font-medium tracking-[0.2em] uppercase text-ink mb-5 pb-3 border-b border-border">
                Delivery address
              </h2>
              <div className="grid sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  {field("address", "Street address", { required: true, autoComplete: "street-address", placeholder: "House, road, area" })}
                </div>
                <div>
                  <label htmlFor="district" className="ep-label">
                    District<span className="text-gold-deep ml-0.5">*</span>
                  </label>
                  <select
                    id="district"
                    value={form.district}
                    onChange={(e) => {
                      const district = e.target.value;
                      // Suggest the zone from the district so the customer
                      // normally never has to think about it — but the choice
                      // stays theirs and re-prices the quote live.
                      setForm({ ...form, district, deliveryZone: zoneForDistrict(district) });
                    }}
                    className="ep-field"
                  >
                    {DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                {field("city", "City / area", { required: true, autoComplete: "address-level2" })}
                {field("postalCode", "Postal code", { autoComplete: "postal-code" })}

                {/* Delivery zone — the charge comes from the server, per zone. */}
                <div className="sm:col-span-2">
                  <p className="ep-label">Delivery</p>
                  <div className="grid sm:grid-cols-2 gap-2.5">
                    {DELIVERY_ZONES.map((z) => {
                      const sel = form.deliveryZone === z.value;
                      const fee =
                        z.value === "inside_dhaka"
                          ? q?.deliveryChargeInside
                          : q?.deliveryChargeOutside;
                      return (
                        <button
                          key={z.value}
                          type="button"
                          onClick={() => setForm({ ...form, deliveryZone: z.value })}
                          aria-pressed={sel}
                          className={`text-left border px-4 py-3 transition-colors ${
                            sel ? "border-gold bg-white" : "border-border hover:border-grey"
                          }`}
                        >
                          <span className="flex items-center justify-between gap-2">
                            <span className="text-[12.5px] text-ink">{z.label}</span>
                            <span className="text-[12.5px] text-ink tabular-nums">
                              {fee != null ? formatTaka(fee) : "—"}
                            </span>
                          </span>
                          <span className="block text-[10.5px] text-grey mt-0.5">{z.hint}</span>
                        </button>
                      );
                    })}
                  </div>
                  {q && q.freeDeliveryThreshold > 0 && (
                    <p className="text-[11px] text-grey mt-2">
                      Complimentary delivery on orders over {formatTaka(q.freeDeliveryThreshold)}.
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="notes" className="ep-label">
                    Order notes (optional)
                  </label>
                  <textarea
                    id="notes"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    rows={3}
                    placeholder="Anything we should know about this delivery?"
                    className="ep-field resize-none"
                  />
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-[11px] font-medium tracking-[0.2em] uppercase text-ink mb-5 pb-3 border-b border-border">
                Payment
              </h2>
              <div className="space-y-2.5">
                {enabledMethods.map((m) => (
                  <label
                    key={m.value}
                    className={`flex items-start gap-3 p-4 border cursor-pointer transition-colors ${
                      form.paymentMethod === m.value
                        ? "border-gold bg-white"
                        : "border-border hover:border-grey"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={m.value}
                      checked={form.paymentMethod === m.value}
                      onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                      className="mt-0.5 accent-[#191919]"
                    />
                    <span>
                      <span className="block text-[13px] text-ink">{m.label}</span>
                      <span className="block text-[11.5px] text-grey mt-0.5">{m.note}</span>
                    </span>
                  </label>
                ))}
              </div>
              <p className="mt-4 text-[11.5px] leading-relaxed text-grey border-l-2 border-gold pl-3">
                No payment is taken on this site. Your order is recorded as{" "}
                <span className="text-ink">pending</span> and we contact you to arrange payment and
                confirm delivery. Nothing is charged automatically.
              </p>
            </section>
          </div>

          {/* Right: summary */}
          <aside className="lg:sticky lg:top-24 bg-white border border-border p-6">
            <h2 className="text-[11px] font-medium tracking-[0.2em] uppercase text-ink mb-5">
              Order summary
            </h2>

            <ul className="divide-y divide-border max-h-[320px] overflow-y-auto -mx-1 px-1">
              {lines.map((l) => (
                <li key={`${l.productId}::${l.variant ?? ""}`} className="py-3.5 flex gap-3">
                  <div className="w-14 h-[70px] shrink-0 bg-muted overflow-hidden">
                    {l.image && <img src={l.image} alt="" className="w-full h-full object-cover" loading="lazy" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-[13px] leading-snug text-ink">{l.name}</p>
                    {l.variant && <p className="text-[10.5px] text-grey mt-0.5">{l.variant}</p>}
                    <p className="text-[10.5px] text-grey mt-0.5">Qty {l.qty}</p>
                  </div>
                  <span className="text-[12.5px] text-ink tabular-nums shrink-0">
                    {formatTaka(l.unit * l.qty)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-5 pt-5 border-t border-border">
              <label htmlFor="checkout-code" className="ep-label">
                Discount code
              </label>
              <div className="flex gap-2">
                <input
                  id="checkout-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Enter code"
                  className="ep-field flex-1 text-[13px]"
                />
                <button
                  type="button"
                  onClick={() => setApplied(code.trim() || null)}
                  className="ep-btn ep-btn-ghost ep-btn-sm shrink-0"
                >
                  Apply
                </button>
              </div>
              {q?.discountError && <p className="text-[11px] text-destructive mt-2">{q.discountError}</p>}
              {q?.appliedCode && (
                <p className="text-[11px] text-gold-deep mt-2">{q.appliedCode} applied.</p>
              )}
            </div>

            <dl className="mt-5 pt-5 border-t border-border space-y-2 text-[13px]">
              <div className="flex justify-between">
                <dt className="text-grey">Subtotal</dt>
                <dd className="tabular-nums">{formatTaka(q?.subtotal ?? 0)}</dd>
              </div>
              {(q?.discount ?? 0) > 0 && (
                <div className="flex justify-between">
                  <dt className="text-grey">Discount</dt>
                  <dd className="text-gold-deep tabular-nums">−{formatTaka(q!.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-grey">Delivery</dt>
                <dd className="tabular-nums">
                  {q?.deliveryCharge === 0 ? "Complimentary" : formatTaka(q?.deliveryCharge ?? 0)}
                </dd>
              </div>
              <div className="flex justify-between pt-3 border-t border-border">
                <dt className="text-[11px] tracking-[0.18em] uppercase">Total payable</dt>
                <dd className="text-[17px] tabular-nums">{formatTaka(q?.total ?? 0)}</dd>
              </div>
            </dl>

            {errors.submit && (
              <p className="mt-4 text-[12px] text-destructive border border-destructive/30 bg-destructive/5 p-3">
                {errors.submit}
              </p>
            )}

            <button
              type="submit"
              disabled={create.isPending || quote.isLoading}
              className="ep-btn ep-btn-solid w-full mt-5"
            >
              {create.isPending ? "Placing order…" : "Place order"}
            </button>

            <p className="mt-3 text-[10.5px] text-grey text-center leading-relaxed">
              By placing this order you agree to our{" "}
              <Link href="/terms" className="underline hover:text-ink">
                terms
              </Link>{" "}
              and{" "}
              <Link href="/returns" className="underline hover:text-ink">
                return policy
              </Link>
              .
            </p>

            {!user && (
              <p className="mt-4 pt-4 border-t border-border text-[11px] text-grey">
                Checking out as a guest.{" "}
                <Link href="/login" className="underline hover:text-ink">
                  Sign in
                </Link>{" "}
                to save this order to your account.
              </p>
            )}
          </aside>
        </form>
      </div>
    </div>
  );
}
