import { Toaster } from "react-hot-toast";
import { Route, Switch, useLocation } from "wouter";
import { useEffect, useState } from "react";
import Protected from "./_core/Protected";
import { trpc } from "./_core/trpc";
import { useSiteImage } from "./lib/siteImages";
import { Header } from "./components/Header";
import { Footer, WhatsAppFab } from "./components/Footer";
import { CartDrawer } from "./components/CartDrawer";
import Home from "./pages/Home";
import Collection from "./pages/Collection";
import ProductPage from "./pages/Product";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Account from "./pages/Account";
import Wishlist from "./pages/Wishlist";
import TrackOrder from "./pages/TrackOrder";
import Admin from "./pages/Admin";
import {
  About,
  Contact,
  Faq,
  CareGuide,
  Shipping,
  Returns,
  Privacy,
  Terms,
  NotFound,
} from "./pages/Content";

/** Scrolls to the top on every navigation. */
function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [location]);
  return null;
}

export default function App() {
  const [cartOpen, setCartOpen] = useState(false);
  const favicon = useSiteImage("favicon");
  useEffect(() => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (link && favicon) link.href = favicon;
  }, [favicon]);
  const settings = trpc.catalog.settings.useQuery();
  const [location] = useLocation();

  // The admin area has its own chrome.
  const isAdmin = location.startsWith("/admin");

  return (
    <div className="min-h-screen flex flex-col bg-ivory">
      <ScrollToTop />
      <Toaster position="top-center" />

      {!isAdmin && (
        <Header
          announcement={settings.data?.announcementBar ?? null}
          onOpenCart={() => setCartOpen(true)}
        />
      )}

      <main className="flex-1">
        <Switch>
          <Route path="/" component={Home} />

          <Route path="/collections/:slug">
            {(params) => <Collection slug={params.slug} />}
          </Route>

          <Route path="/product/:slug">
            {(params) => <ProductPage slug={params.slug} />}
          </Route>

          <Route path="/checkout" component={Checkout} />

          <Route path="/order/:orderNumber">
            {(params) => <OrderConfirmation orderNumber={params.orderNumber} />}
          </Route>

          <Route path="/login" component={Login} />
          <Route path="/signup" component={Signup} />

          <Route path="/account">
            <Protected>
              <Account />
            </Protected>
          </Route>

          <Route path="/wishlist" component={Wishlist} />
          <Route path="/track-order" component={TrackOrder} />

          <Route path="/admin">
            <Protected>
              <Admin />
            </Protected>
          </Route>

          <Route path="/about" component={About} />
          <Route path="/contact" component={Contact} />
          <Route path="/faq" component={Faq} />
          <Route path="/care-guide" component={CareGuide} />
          <Route path="/shipping" component={Shipping} />
          <Route path="/returns" component={Returns} />
          <Route path="/privacy" component={Privacy} />
          <Route path="/terms" component={Terms} />

          <Route component={NotFound} />
        </Switch>
      </main>

      {!isAdmin && (
        <>
          <Footer
            settings={{
              whatsappNumber: settings.data?.whatsappNumber ?? null,
              instagram: settings.data?.instagram ?? null,
              facebook: settings.data?.facebook ?? null,
              contactEmail: settings.data?.contactEmail ?? null,
              contactPhone: settings.data?.contactPhone ?? null,
              address: settings.data?.address ?? null,
            }}
          />
          <WhatsAppFab number={settings.data?.whatsappNumber ?? null} />
        </>
      )}

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
