// The scaffold's example dashboard is replaced by the storefront's own pages.
// Kept as a thin redirect so any old link still lands somewhere sensible.
import { Redirect } from "wouter";

export default function Dashboard() {
  return <Redirect to="/account" />;
}
