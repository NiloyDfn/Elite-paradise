// Track an order with its number and the mobile number used at checkout.
// The server compares normalised numbers, so 01712345678 and +8801712345678
// both match — the customer never has to remember which form they typed.
import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/_core/trpc";
import {
  ORDER_STATUS_LABEL,
  TRACKING_STEPS,
  isValidBdPhone,
  formatTaka,
} from "@shared/catalog";
import { usePageMeta } from "../lib/hooks";

export default function TrackOrder() {
  usePageMeta("Track your order — Elite Paradise", "Check the status of an Elite Paradise order.");
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState(false);

  const phoneOk = isValidBdPhone(phone);
  const canSubmit = orderNumber.trim().length > 2 && phoneOk;

  const { data, isFetching, isError, error } = trpc.checkout.track.useQuery(
    { orderNumber: orderNumber.trim(), phone: phone.trim() },
    { enabled: submitted && canSubmit, retry: false },
  );

  return (
    <div className="relative bg-ivory overflow-hidden">
      <div className="ep-glow -right-32 top-0 w-[420px] h-[420px] bg-[rgba(198,166,107,0.13)]" aria-hidden="true" />
      <div className="ep-shell relative py-12 md:py-20 max-w-xl">
        <div className="text-center mb-10">
          <p className="ep-eyebrow mb-3">Order status</p>
          <h1 className="ep-display ep-h2">Track your order</h1>
          <p className="ep-body mt-3">
            Enter your order number and the mobile number you used at checkout.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setTouched(true);
            if (canSubmit) setSubmitted(true);
          }}
          className="bg-white border border-border p-6 space-y-4"
        >
          <div>
            <label htmlFor="t-order" className="ep-label">Order number</label>
            <input
              id="t-order"
              required
              value={orderNumber}
              onChange={(e) => {
                setOrderNumber(e.target.value.toUpperCase());
                setSubmitted(false);
              }}
              placeholder="EP-20261119-0001"
              className="ep-field font-mono"
            />
          </div>
          <div>
            <label htmlFor="t-phone" className="ep-label">Mobile number</label>
            <input
              id="t-phone"
              type="tel"
              inputMode="tel"
              required
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setSubmitted(false);
              }}
              onBlur={() => setTouched(true)}
              placeholder="01712345678"
              aria-invalid={touched && phone.length > 0 && !phoneOk}
              aria-describedby="t-phone-err"
              className="ep-field"
            />
            {touched && phone.length > 0 && !phoneOk && (
              <p id="t-phone-err" className="text-[11px] text-destructive mt-1.5">
                Enter a Bangladeshi mobile number, e.g. 01712345678.
              </p>
            )}
          </div>
          <button type="submit" disabled={isFetching || !canSubmit} className="ep-btn ep-btn-solid w-full">
            {isFetching ? "Looking…" : "Find my order"}
          </button>
        </form>

        {submitted && isError && (
          <p className="mt-6 text-[12.5px] text-destructive border border-destructive/30 bg-destructive/5 p-4">
            {error?.message || "No order matches those details."}
          </p>
        )}

        {data && (
          <div className="mt-6 bg-white border border-border p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="font-serif text-[16px] text-ink">{data.orderNumber}</p>
                <p className="text-[11.5px] text-grey mt-1">
                  {new Date(data.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <span className="ep-badge ep-badge-gold">
                {ORDER_STATUS_LABEL[data.status] ?? data.status}
              </span>
            </div>

            {/* Progress ladder — cancelled/returned are terminal, not a step. */}
            {data.status !== "cancelled" && data.status !== "returned" && (
              <ol className="mb-5 flex items-start gap-1" aria-label="Order progress">
                {TRACKING_STEPS.map((step, i) => {
                  const at = TRACKING_STEPS.indexOf(data.status as (typeof TRACKING_STEPS)[number]);
                  const done = at >= 0 && i <= at;
                  return (
                    <li key={step} className="flex-1 min-w-0">
                      <div className={`h-[2px] ${done ? "bg-gold" : "bg-border"}`} />
                      <p
                        className={`mt-2 text-[8.5px] leading-tight tracking-[0.06em] uppercase ${
                          done ? "text-ink" : "text-grey"
                        }`}
                      >
                        {ORDER_STATUS_LABEL[step]}
                      </p>
                    </li>
                  );
                })}
              </ol>
            )}

            <ul className="divide-y divide-border">
              {data.items.map((it) => (
                <li key={it.id} className="py-2.5 flex justify-between gap-3 text-[13px]">
                  <span className="text-ink/80">
                    {it.name} <span className="text-grey">× {it.qty}</span>
                  </span>
                  <span className="tabular-nums shrink-0">{formatTaka(it.price * it.qty)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 pt-4 border-t border-border flex justify-between text-[13px]">
              <span className="text-[11px] tracking-[0.18em] uppercase">Total</span>
              <span className="tabular-nums">{formatTaka(data.total)}</span>
            </div>
            <Link href={`/order/${data.orderNumber}`} className="ep-link mt-5 inline-block text-[10px]">
              View full order
            </Link>
          </div>
        )}

        <p className="mt-8 text-center text-[11.5px] text-grey">
          Signed in?{" "}
          <Link href="/account" className="underline hover:text-ink">
            Your orders are in your account
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
