// Order confirmation / tracking page.
import { Link } from "wouter";
import { trpc } from "@/_core/trpc";
import { ORDER_STATUS_LABEL, formatTaka } from "@shared/catalog";
import { usePageMeta } from "../lib/hooks";
import { EmptyState } from "../components/shared";

export default function OrderConfirmation({ orderNumber }: { orderNumber: string }) {
  usePageMeta(`Order ${orderNumber} — Elite Paradise`, "Your Elite Paradise order.");
  const { data, isLoading, isError } = trpc.checkout.order.useQuery({ orderNumber });

  if (isLoading) {
    return (
      <div className="ep-shell ep-section">
        <div className="ep-skeleton h-8 w-64 mb-4" />
        <div className="ep-skeleton h-40 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="ep-shell ep-section">
        <EmptyState
          title="Order not found"
          body="We could not find an order with that number. Check the link, or track it with your order number and email."
          action={{ label: "Track your order", href: "/track-order" }}
        />
      </div>
    );
  }

  const steps = ["pending", "confirmed", "processing", "shipped", "delivered"];
  const currentIdx = steps.indexOf(data.status);
  const cancelled = data.status === "cancelled" || data.status === "returned";

  return (
    <div className="bg-ivory">
      <div className="ep-shell py-12 md:py-20 max-w-3xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 border border-gold rounded-full mb-6">
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-gold-deep" fill="none" stroke="currentColor" strokeWidth="1.2">
              <path d="M4 12l5 5L20 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="ep-eyebrow mb-3">Order received</p>
          <h1 className="ep-display ep-h2">Thank you, {data.customerName.split(" ")[0]}.</h1>
          <p className="ep-body mt-4">
            Your order <span className="text-ink font-medium">{data.orderNumber}</span> has been
            recorded. We will contact you on {data.phone} to confirm and arrange payment.
          </p>
        </div>

        <div className="bg-white border border-border p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[11px] font-medium tracking-[0.2em] uppercase">Status</h2>
            <span className="ep-badge ep-badge-gold">{ORDER_STATUS_LABEL[data.status] ?? data.status}</span>
          </div>
          {cancelled ? (
            <p className="text-[13px] text-grey">
              This order was {data.status}. If that is unexpected, please contact us.
            </p>
          ) : (
            <ol className="flex items-center gap-1">
              {steps.map((s, i) => (
                <li key={s} className="flex-1 flex items-center gap-1">
                  <div className="flex flex-col items-center flex-1">
                    <span className={`w-2.5 h-2.5 rounded-full ${i <= currentIdx ? "bg-gold" : "bg-border"}`} />
                    <span
                      className={`mt-2 text-[8.5px] tracking-[0.1em] uppercase text-center ${
                        i <= currentIdx ? "text-ink" : "text-grey"
                      }`}
                    >
                      {ORDER_STATUS_LABEL[s]}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <span className={`h-px flex-1 -mt-4 ${i < currentIdx ? "bg-gold" : "bg-border"}`} />
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="bg-white border border-border p-6 mb-6">
          <h2 className="text-[11px] font-medium tracking-[0.2em] uppercase mb-4">Items</h2>
          <ul className="divide-y divide-border">
            {data.items.map((it) => (
              <li key={it.id} className="py-3.5 flex gap-3 items-center">
                <div className="w-14 h-[70px] shrink-0 bg-muted overflow-hidden">
                  {it.image && <img src={it.image} alt="" className="w-full h-full object-cover" loading="lazy" />}
                </div>
                <div className="flex-1 min-w-0">
                  {it.slug ? (
                    <Link href={`/product/${it.slug}`} className="font-serif text-[13.5px] text-ink hover:text-gold-deep">
                      {it.name}
                    </Link>
                  ) : (
                    <p className="font-serif text-[13.5px] text-ink">{it.name}</p>
                  )}
                  {it.variant && <p className="text-[10.5px] text-grey mt-0.5">{it.variant}</p>}
                  <p className="text-[10.5px] text-grey mt-0.5">Qty {it.qty}</p>
                </div>
                <span className="text-[12.5px] tabular-nums">{formatTaka(it.price * it.qty)}</span>
              </li>
            ))}
          </ul>

          <dl className="mt-4 pt-4 border-t border-border space-y-2 text-[13px]">
            <div className="flex justify-between">
              <dt className="text-grey">Subtotal</dt>
              <dd className="tabular-nums">{formatTaka(data.subtotal)}</dd>
            </div>
            {data.discount > 0 && (
              <div className="flex justify-between">
                <dt className="text-grey">Discount{data.discountCode ? ` (${data.discountCode})` : ""}</dt>
                <dd className="text-gold-deep tabular-nums">−{formatTaka(data.discount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-grey">Delivery</dt>
              <dd className="tabular-nums">
                {data.deliveryCharge === 0 ? "Complimentary" : formatTaka(data.deliveryCharge)}
              </dd>
            </div>
            <div className="flex justify-between pt-3 border-t border-border">
              <dt className="text-[11px] tracking-[0.18em] uppercase">Total</dt>
              <dd className="text-[16px] tabular-nums">{formatTaka(data.total)}</dd>
            </div>
          </dl>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          <div className="bg-white border border-border p-6">
            <h2 className="text-[11px] font-medium tracking-[0.2em] uppercase mb-3">Delivering to</h2>
            <address className="not-italic text-[13px] leading-relaxed text-ink/80">
              {data.customerName}
              <br />
              {data.address}
              <br />
              {data.city}, {data.district}
              {data.postalCode ? ` ${data.postalCode}` : ""}
              <br />
              {data.phone}
            </address>
          </div>
          <div className="bg-white border border-border p-6">
            <h2 className="text-[11px] font-medium tracking-[0.2em] uppercase mb-3">Payment</h2>
            <p className="text-[13px] text-ink/80 capitalize">
              {data.paymentMethod === "cod" ? "Cash on delivery" : data.paymentMethod}
            </p>
            <p className="text-[11.5px] text-grey mt-2 leading-relaxed">
              No payment has been taken. We will contact you to arrange it.
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/collections/shop-all" className="ep-btn ep-btn-solid">
            Continue shopping
          </Link>
          <Link href="/track-order" className="ep-btn ep-btn-ghost">
            Track this order
          </Link>
        </div>
      </div>
    </div>
  );
}
