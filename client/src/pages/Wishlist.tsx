// Wishlist — server-backed when signed in, local otherwise.
import { Link } from "wouter";
import { useEffect } from "react";
import { trpc } from "@/_core/trpc";
import { useAuth } from "@/_core/useAuth";
import { usePageMeta } from "../lib/hooks";
import { setLocalWish, useWishlist } from "../lib/cart";
import { EmptyState, ProductGrid, ProductGridSkeleton } from "../components/shared";

export default function Wishlist() {
  usePageMeta("Wishlist — Elite Paradise", "Pieces you have saved at Elite Paradise.");
  const { user } = useAuth();
  const localIds = useWishlist();

  const server = trpc.account.wishlist.useQuery(undefined, { enabled: !!user });
  const serverIds = trpc.account.wishlistIds.useQuery(undefined, { enabled: !!user });

  // Mirror the server list into the local store so the heart icons agree.
  useEffect(() => {
    if (serverIds.data) setLocalWish(serverIds.data);
  }, [serverIds.data]);

  const ids = user ? (serverIds.data ?? []) : localIds;
  const byIds = trpc.catalog.productsByIds.useQuery(
    { ids },
    { enabled: ids.length > 0 },
  );

  const loading = user ? server.isLoading || byIds.isLoading : byIds.isLoading;

  return (
    <div className="bg-ivory">
      <div className="ep-shell py-10 md:py-14">
        <div className="mb-10">
          <p className="ep-eyebrow mb-3">Saved</p>
          <h1 className="ep-display ep-h2">Your wishlist</h1>
          <p className="ep-body mt-3">
            {user
              ? "Saved to your account, so it follows you to any device."
              : "Saved in this browser. Sign in to keep it across devices."}
          </p>
        </div>

        {loading ? (
          <ProductGridSkeleton count={4} />
        ) : !ids.length ? (
          <EmptyState
            title="Nothing saved yet"
            body="Tap the heart on any piece to keep it here while you decide."
            action={{ label: "Browse the collection", href: "/collections/shop-all" }}
          />
        ) : (
          <ProductGrid products={byIds.data ?? []} />
        )}

        {!user && ids.length > 0 && (
          <p className="mt-10 text-[12px] text-grey">
            <Link href="/login" className="underline hover:text-ink">
              Sign in
            </Link>{" "}
            to save this list to your account.
          </p>
        )}
      </div>
    </div>
  );
}
