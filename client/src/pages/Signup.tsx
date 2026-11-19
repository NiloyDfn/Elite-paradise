import { PasswordInput } from "../components/PasswordInput";
// Create an account — brand-styled.
import { useState, type FormEvent } from "react";
import { Link, Redirect } from "wouter";
import { useAuth } from "@/_core/useAuth";
import { usePageMeta } from "../lib/hooks";
import { Wordmark } from "../components/shared";

export default function Signup() {
  usePageMeta("Create an account — Elite Paradise", "Create your Elite Paradise account.");
  const { signup, user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Please use at least 8 characters for your password.");
      return;
    }
    setBusy(true);
    try {
      await signup(email, password, name || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "We could not create your account.");
    } finally {
      setBusy(false);
    }
  }

  if (user) return <Redirect to="/account" />;

  return (
    <div className="bg-ivory min-h-[calc(100vh-84px)] flex items-center justify-center px-5 py-16">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-10">
          <Link href="/" aria-label="Elite Paradise — home" className="inline-block">
            <Wordmark size="lg" tagline />
          </Link>
        </div>

        <div className="bg-white border border-border p-7 md:p-9">
          <h1 className="ep-display ep-h3 mb-2">Create your account</h1>
          <p className="ep-body text-[13.5px] mb-7">
            Keep your orders and saved pieces in one place.
          </p>

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className="ep-label">
                Full name
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="ep-field"
              />
            </div>
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
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
              <p className="mt-1.5 text-[11px] text-grey">At least 8 characters.</p>
            </div>
            {error && (
              <p className="text-[12px] text-destructive border border-destructive/30 bg-destructive/5 p-3">
                {error}
              </p>
            )}
            <button type="submit" disabled={busy} className="ep-btn ep-btn-solid w-full">
              {busy ? "Creating…" : "Create account"}
            </button>
          </form>

          <p className="mt-6 pt-6 border-t border-border text-center text-[12.5px] text-grey">
            Already have an account?{" "}
            <Link href="/login" className="text-ink underline hover:text-gold-deep">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
