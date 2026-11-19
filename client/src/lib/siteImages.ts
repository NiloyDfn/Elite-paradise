// Storefront pictures the owner can replace from Admin → Images.
// `useSiteImage("logo")` returns the owner's upload, or the built-in default.
import { trpc } from "@/_core/trpc";
import { SITE_IMAGE_SLOTS } from "@shared/catalog";

const DEFAULTS: Record<string, string> = Object.fromEntries(SITE_IMAGE_SLOTS.map((s) => [s.key, s.def]));

export function useSiteImages() {
  const settings = trpc.catalog.settings.useQuery(undefined, { staleTime: 60_000 });
  const overrides = (settings.data?.siteImages ?? {}) as Record<string, string>;
  return (key: string) => overrides[key] || DEFAULTS[key] || "";
}

export function useSiteImage(key: string) {
  return useSiteImages()(key);
}
