import { PasswordInput } from "../components/PasswordInput";
// Sign in — brand-styled.
import { useState, type FormEvent } from "react";
import { Link, Redirect, useSearch } from "wouter";
import { useAuth } from "@/_core/useAuth";
import { usePageMeta } from "../lib/hooks";
import { Wordmark } from "../components/shared";

export default function Login() {
  usePageMeta("Sign in — Elite Paradise", "Sign in to your Elite Paradise account.");
  const { login, user } = useAuth();
  const search = useSearch();
  const nextParam = new URLSearchParams(search).get("next");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "We could not sign you in.");
    } finally {
      setBusy(false);
    }
  }

  // Declarative redirect: wait until `user` actually exists, otherwise the
  // guard bounces the user straight back to this form.
  if (user) return <Redirect to={nextParam || (user.role === "admin" ? "/admin" : "/account")} />;

  return (
    <div className="bg-ivory min-h-[calc(100vh-84px)] flex items-center justify-center px-5 py-16">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-10">
          <Link href="/" aria-label="Elite Paradise — home" className="inline-block">
            <Wordmark size="lg" tagline />
          </Link>
        </div>

        <div className="bg-white border border-border p-7 md:p-9">
          <h1 className="ep-display ep-h3 mb-2">Welcome back</h1>
          <p className="ep-body text-[13.5px] mb-7">Sign in to see your orders and saved pieces.</p>

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="ep-label">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="ep-field"
              />
            </div>
            <div>
              <label htmlFor="password" className="ep-label">
                Password
              </label>
              <PasswordInput
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <p className="text-[12px] text-destructive border border-destructive/30 bg-destructive/5 p-3">
                {error}
              </p>
            )}
            <button type="submit" disabled={busy} className="ep-btn ep-btn-solid w-full">
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="mt-6 pt-6 border-t border-border text-center text-[12.5px] text-grey">
            New here?{" "}
            <Link href="/signup" className="text-ink underline hover:text-gold-deep">
              Create an account
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-[11px] text-grey">
          <Link href="/track-order" className="underline hover:text-ink">
            Track an order without signing in
          </Link>
        </p>
      </div>
    </div>
  );
}
