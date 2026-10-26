
import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api, type AuthUser } from "../lib/api";
import "./AuthPage.css";

type AuthResponse = {
  user: AuthUser;
};

type SignupResponse = {
  message: string;
  email: string;
  requiresEmailVerification: true;
};

type VerifyResponse = {
  message: string;
  emailVerified?: boolean;
};

type Mode = "signup" | "login";
type AuthStep = "credentials" | "verification";

export default function AuthPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [mode, setMode] = useState<Mode>(() =>
    searchParams.get("mode") === "login" ? "login" : "signup",
  );

  const [step, setStep] = useState<AuthStep>("credentials");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    const normalizedEmail = email.trim().toLowerCase();

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
      if (mode === "signup") {
        const result = await api<SignupResponse>("/api/auth/signup", {
          method: "POST",
          body: {
            name: name.trim(),
            email: normalizedEmail,
            password,
            confirmPassword,
          },
        });

        setEmail(result.email || normalizedEmail);
        setVerificationCode("");
        setStep("verification");
        setNotice(
          result.message ||
            "Verification code sent. Check your email to continue.",
        );
        return;
      }

      const result = await api<AuthResponse>("/api/auth/login", {
        method: "POST",
        body: {
          email: normalizedEmail,
          password,
        },
      });

      navigate("/workspace", { replace: true });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Authentication failed. Please try again.";

      setError(message);

      // The backend returns this flag when login is blocked because
      // the user's email has not yet been verified.
      if (
        message.toLowerCase().includes("verify your email") ||
        message.toLowerCase().includes("verify your email before")
      ) {
        setStep("verification");
        setNotice("Verify your email to continue signing in.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    const normalizedEmail = email.trim().toLowerCase();
    const code = verificationCode.trim();

    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit verification code from your email.");
      return;
    }

    setLoading(true);

    try {
      const result = await api<VerifyResponse>("/api/auth/verify-email", {
        method: "POST",
        body: {
          email: normalizedEmail,
          code,
        },
      });

      setPassword("");
      setConfirmPassword("");
      setVerificationCode("");
      setMode("login");
      setStep("credentials");
      setSearchParams({ mode: "login" });
      setNotice(
        result.message || "Email verified successfully. You can now sign in.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Verification failed. Please check the code and try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleResendCode() {
    setError("");
    setNotice("");
    setResending(true);

    try {
      const result = await api<{ message: string }>(
        "/api/auth/resend-verification",
        {
          method: "POST",
          body: {
            email: email.trim().toLowerCase(),
          },
        },
      );

      setNotice(result.message || "If your account is unverified, a new code has been sent.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to resend the code. Please try again.",
      );
    } finally {
      setResending(false);
    }
  }

  function toggleMode() {
    const nextMode: Mode = mode === "signup" ? "login" : "signup";

    setMode(nextMode);
    setStep("credentials");
    setSearchParams(nextMode === "login" ? { mode: "login" } : {});
    setError("");
    setNotice("");
    setPassword("");
    setConfirmPassword("");
    setVerificationCode("");
  }

  function returnToCredentials() {
    setStep("credentials");
    setError("");
    setNotice("");
    setVerificationCode("");
  }

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <Link className="auth-brand" to="/" aria-label="Fieldnotes home">
          <span className="auth-brand-mark">f.</span>
          <span>fieldnotes</span>
        </Link>

        <div className="auth-card">
          {step === "verification" ? (
            <>
              <h1>Check your email</h1>

              <p className="auth-description">
                Enter the 6-digit code sent to{" "}
                <strong>{email.trim()}</strong>. The code expires in 10 minutes.
              </p>

              <form onSubmit={handleVerifyEmail}>
                <div className="auth-field">
                  <label className="auth-label" htmlFor="verificationCode">
                    Verification code
                  </label>

                  <input
                    className="auth-input"
                    id="verificationCode"
                    name="verificationCode"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    minLength={6}
                    maxLength={6}
                    placeholder="000000"
                    required
                    value={verificationCode}
                    onChange={(event) =>
                      setVerificationCode(
                        event.target.value.replace(/\D/g, "").slice(0, 6),
                      )
                    }
                  />
                </div>

                {error && (
                  <p className="auth-error" role="alert">
                    {error}
                  </p>
                )}

                {notice && (
                  <p className="auth-description" role="status">
                    {notice}
                  </p>
                )}

                <button
                  className="auth-primary-button"
                  type="submit"
                  disabled={loading || verificationCode.length !== 6}
                >
                  {loading ? "Verifying..." : "Verify email"}
                </button>
              </form>

              <p className="auth-switch">
                Didn't receive the code?
                <button
                  className="auth-text-button"
                  type="button"
                  onClick={handleResendCode}
                  disabled={loading || resending}
                >
                  {resending ? "Sending..." : "Resend code"}
                </button>
              </p>

              <p className="auth-switch">
                <button
                  className="auth-text-button"
                  type="button"
                  onClick={returnToCredentials}
                  disabled={loading || resending}
                >
                  Back to sign in
                </button>
              </p>
            </>
          ) : (
            <>
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

                {notice && (
                  <p className="auth-description" role="status">
                    {notice}
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
                {mode === "signup"
                  ? "Already have an account?"
                  : "New to Fieldnotes?"}
                <button
                  className="auth-text-button"
                  type="button"
                  onClick={toggleMode}
                  disabled={loading}
                >
                  {mode === "signup" ? "Sign in" : "Create an account"}
                </button>
              </p>
            </>
          )}
        </div>

        <p className="auth-terms">
          {step === "verification"
            ? "Your verification code expires after 10 minutes."
            : mode === "signup"
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
