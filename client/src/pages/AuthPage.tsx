import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api, type AuthUser } from "../lib/api";
import "./AuthPage.css";

type AuthResponse = {
  user: AuthUser;
};

type Mode = "signup" | "login";

export default function AuthPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [mode, setMode] = useState<Mode>(() =>
    searchParams.get("mode") === "login" ? "login" : "signup",
  );

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const normalizedEmail = email.trim();

    if (mode === "signup") {
      if (name.trim().length < 2) {
        setError("Name must be at least 2 characters long.");
        return;
      }

      if (password.length < 6) {
        setError("Password must be at least 6 characters long.");
        return;
      }

      if (password.length > 128) {
        setError("Password must not exceed 128 characters.");
        return;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    }

    setLoading(true);

    try {
      await api<AuthResponse>(
        mode === "signup" ? "/api/auth/signup" : "/api/auth/login",
        {
          method: "POST",
          body:
            mode === "signup"
              ? {
                  name: name.trim(),
                  email: normalizedEmail,
                  password,
                  confirmPassword,
                }
              : {
                  email: normalizedEmail,
                  password,
                },
        },
      );

      navigate("/workspace", { replace: true });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Authentication failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  function toggleMode() {
    const nextMode: Mode = mode === "signup" ? "login" : "signup";

    setMode(nextMode);
    setSearchParams(nextMode === "login" ? { mode: "login" } : {});
    setError("");
    setPassword("");
    setConfirmPassword("");
  }

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <Link className="auth-brand" to="/" aria-label="Fieldnotes home">
          <span className="auth-brand-mark">f.</span>
          <span>fieldnotes</span>
        </Link>

        <div className="auth-card">
          <h1>
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </h1>

          <p className="auth-description">
            {mode === "signup"
              ? "Create an account to save your research workspace."
              : "Sign in to return to your research workspace."}
          </p>

          <form onSubmit={handleSubmit}>
            {mode === "signup" && (
              <div className="auth-field">
                <label className="auth-label" htmlFor="name">
                  Full name
                </label>

                <input
                  className="auth-input"
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  minLength={2}
                  maxLength={80}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>
            )}

            <div className="auth-field">
              <label className="auth-label" htmlFor="email">
                Email address
              </label>

              <input
                className="auth-input"
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="password">
                Password
              </label>

              <input
                className="auth-input"
                id="password"
                name="password"
                type="password"
                autoComplete={
                  mode === "signup" ? "new-password" : "current-password"
                }
                required
                minLength={mode === "signup" ? 6 : 1}
                maxLength={128}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>

            {mode === "signup" && (
              <div className="auth-field">
                <label className="auth-label" htmlFor="confirmPassword">
                  Confirm password
                </label>

                <input
                  className="auth-input"
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  maxLength={128}
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
                />
              </div>
            )}

            {error && (
              <p className="auth-error" role="alert">
                {error}
              </p>
            )}

            <button
              className="auth-primary-button"
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Please wait..."
                : mode === "signup"
                  ? "Create account"
                  : "Sign in"}
            </button>
          </form>

          <p className="auth-switch">
            {mode === "signup" ? "Already have an account?" : "New to Fieldnotes?"}
            <button
              className="auth-text-button"
              type="button"
              onClick={toggleMode}
              disabled={loading}
            >
              {mode === "signup" ? "Sign in" : "Create an account"}
            </button>
          </p>
        </div>

        <p className="auth-terms">
          {mode === "signup"
            ? "By creating an account, you agree to use Fieldnotes responsibly."
            : "Your account is protected by secure server-side sessions."}
        </p>
      </section>

      <aside className="auth-aside" aria-hidden="true">
        <div className="auth-aside-inner">
          <h2>Ask your documents. Get answers you can check.</h2>

          <div className="auth-sample">
            <div className="auth-sample-question">
              What are the components of a data communication system?
            </div>
            <p>
              Five: sender, receiver, message, transmission medium and
              protocol. The protocol is the set of rules both ends agree on.
            </p>
            <div className="auth-sample-cite">
              <strong>Lecture 02.pdf</strong>
              <span>Page 3</span>
            </div>
          </div>
        </div>
      </aside>
    </main>
  );
}