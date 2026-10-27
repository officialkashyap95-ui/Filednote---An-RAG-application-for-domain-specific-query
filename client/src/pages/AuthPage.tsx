
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

type LoginChallengeResponse = {
  message: string;
  email: string;
  requiresLoginVerification: true;
};

type VerifyResponse = {
  message: string;
  emailVerified?: boolean;
};

type ForgotPasswordResponse = {
  message: string;
  email?: string;
};

type VerifyResetCodeResponse = {
  message: string;
  email: string;
  resetToken: string;
  expiresInSeconds: number;
};

type ResetPasswordResponse = {
  message: string;
};

type Mode = "signup" | "login";
type AuthStep =
  | "credentials"
  | "verification"
  | "forgot-password"
  | "reset-verification"
  | "reset-password";

function isValidEmailFormat(value: string): boolean {
  const email = value.trim();

  if (!email || email.length > 254) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function AuthPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [mode, setMode] = useState<Mode>(() =>
    searchParams.get("mode") === "login" ? "login" : "signup",
  );

  const [step, setStep] = useState<AuthStep>("credentials");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const emailFormatInvalid =
    emailTouched &&
    email.trim().length > 0 &&
    !isValidEmailFormat(email);

  function handleEmailChange(value: string) {
    setEmail(value);
    setError("");
    setNotice("");
  }

  function handleEmailBlur() {
    setEmailTouched(true);
  }

  function clearMessages() {
    setError("");
    setNotice("");
  }

  function openForgotPassword() {
    clearMessages();
    setStep("forgot-password");
    setVerificationCode("");
    setResetToken("");
    setPassword("");
    setConfirmPassword("");
    setEmailTouched(false);
  }

  function returnToCredentials() {
    setStep("credentials");
    clearMessages();
    setVerificationCode("");
    setResetToken("");
    setPassword("");
    setConfirmPassword("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearMessages();

    const normalizedEmail = email.trim().toLowerCase();

    setEmailTouched(true);

    if (!isValidEmailFormat(normalizedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (mode === "signup") {
      if (name.trim().length < 2) {
        setError("Name must be at least 2 characters long.");
        return;
      }

      if (password.length < 6 || password.length > 128) {
        setError("Password must be between 6 and 128 characters.");
        return;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    } else if (!password || password.length > 128) {
      setError("Please enter your password.");
      return;
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
        setEmailTouched(false);
        setVerificationCode("");
        setStep("verification");
        setNotice(
          result.message ||
            "Verification code sent. Check your email to continue.",
        );
        return;
      }

      const result = await api<LoginChallengeResponse>("/api/auth/login", {
        method: "POST",
        body: {
          email: normalizedEmail,
          password,
        },
      });

      if (result.requiresLoginVerification !== true) {
        setError("Unable to start verification. Please try again.");
        return;
      }

      setEmail(result.email || normalizedEmail);
      setVerificationCode("");
      setStep("verification");
      setNotice(result.message || "Login code sent. Check your email.");
    } catch (err) {
      setStep("credentials");
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
      setNotice("");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearMessages();

    const normalizedEmail = email.trim().toLowerCase();
    const code = verificationCode.trim();

    if (!isValidEmailFormat(normalizedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit verification code from your email.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "login") {
        const result = await api<AuthResponse>(
          "/api/auth/verify-login-code",
          {
            method: "POST",
            body: { email: normalizedEmail, code },
          },
        );

        if (!result.user) {
          setError("Unable to sign in. Please try again.");
          return;
        }

        navigate("/workspace", { replace: true });
        return;
      }

      const result = await api<VerifyResponse>("/api/auth/verify-email", {
        method: "POST",
        body: { email: normalizedEmail, code },
      });

      setPassword("");
      setConfirmPassword("");
      setVerificationCode("");
      setMode("login");
      setStep("credentials");
      setSearchParams({ mode: "login" });
      setNotice(
        result.message ||
          "Email verified successfully. You can now sign in.",
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
    clearMessages();
    setResending(true);

    try {
      if (mode === "login") {
        if (!password) {
          setError("Return to sign in and enter your password again.");
          return;
        }

        const result = await api<LoginChallengeResponse>(
          "/api/auth/login",
          {
            method: "POST",
            body: {
              email: email.trim().toLowerCase(),
              password,
            },
          },
        );

        if (result.requiresLoginVerification === true) {
          setEmail(result.email || email.trim().toLowerCase());
          setVerificationCode("");
          setNotice(result.message || "A new login code has been sent.");
        }

        return;
      }

      const result = await api<{ message: string }>(
        "/api/auth/resend-verification",
        {
          method: "POST",
          body: { email: email.trim().toLowerCase() },
        },
      );

      setNotice(
        result.message ||
          "If your account is unverified, a new code has been sent.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to send the code. Please try again.",
      );
    } finally {
      setResending(false);
    }
  }

  async function handleForgotPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearMessages();

    const normalizedEmail = email.trim().toLowerCase();

    if (!isValidEmailFormat(normalizedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      const result = await api<ForgotPasswordResponse>(
        "/api/auth/forgot-password",
        {
          method: "POST",
          body: { email: normalizedEmail },
        },
      );

      setEmail(result.email || normalizedEmail);
      setVerificationCode("");
      setStep("reset-verification");
      setNotice(
        result.message ||
          "If an eligible account exists, a reset code will be sent.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to request a reset code. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyResetCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearMessages();

    const normalizedEmail = email.trim().toLowerCase();
    const code = verificationCode.trim();

    if (!isValidEmailFormat(normalizedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit reset code from your email.");
      return;
    }

    setLoading(true);

    try {
      const result = await api<VerifyResetCodeResponse>(
        "/api/auth/verify-reset-code",
        {
          method: "POST",
          body: {
            email: normalizedEmail,
            code,
          },
        },
      );

      if (!result.resetToken) {
        setError("Unable to verify the code. Please request another one.");
        return;
      }

      setResetToken(result.resetToken);
      setPassword("");
      setConfirmPassword("");
      setStep("reset-password");
      setNotice("Email verified. Choose a new password.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to verify the reset code. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearMessages();

    if (password.length < 6 || password.length > 128) {
      setError("Password must be between 6 and 128 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!resetToken) {
      setError("Your reset session is missing. Please start again.");
      return;
    }

    setLoading(true);

    try {
      const result = await api<ResetPasswordResponse>(
        "/api/auth/reset-password",
        {
          method: "POST",
          body: {
            email: email.trim().toLowerCase(),
            resetToken,
            password,
            confirmPassword,
          },
        },
      );

      setPassword("");
      setConfirmPassword("");
      setVerificationCode("");
      setResetToken("");
      setMode("login");
      setStep("credentials");
      setSearchParams({ mode: "login" });
      setNotice(result.message || "Password reset successfully. Sign in now.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to reset your password. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  function toggleMode() {
    const nextMode: Mode = mode === "signup" ? "login" : "signup";

    setMode(nextMode);
    setStep("credentials");
    setSearchParams(nextMode === "login" ? { mode: "login" } : {});
    clearMessages();
    setPassword("");
    setConfirmPassword("");
    setVerificationCode("");
    setResetToken("");
    setEmailTouched(false);
  }

  function backToForgotPassword() {
    setStep("forgot-password");
    clearMessages();
    setVerificationCode("");
    setResetToken("");
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
                Enter the 6-digit code sent to <strong>{email.trim()}</strong>.
                The code expires in 10 minutes.
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

                {error && <p className="auth-error" role="alert">{error}</p>}
                {notice && <p className="auth-description" role="status">{notice}</p>}

                <button
                  className="auth-primary-button"
                  type="submit"
                  disabled={loading || verificationCode.length !== 6}
                >
                  {loading
                    ? "Verifying..."
                    : mode === "login"
                      ? "Verify and sign in"
                      : "Verify email"}
                </button>
              </form>

              <p className="auth-switch">
                Didn&apos;t receive the code?{" "}
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
          ) : step === "forgot-password" ? (
            <>
              <h1>Forgot your password?</h1>
              <p className="auth-description">
                Enter your account email and we&apos;ll send you a code to reset
                your password.
              </p>

              <form onSubmit={handleForgotPassword}>
                <div className="auth-field">
                  <label className="auth-label" htmlFor="resetEmail">
                    Email address
                  </label>
                  <input
                    className="auth-input"
                    id="resetEmail"
                    name="email"
                    type="email"
                    autoComplete="email"
                    maxLength={254}
                    required
                    value={email}
                    onChange={(event) => handleEmailChange(event.target.value)}
                    onBlur={handleEmailBlur}
                  />
                </div>

                {error && <p className="auth-error" role="alert">{error}</p>}
                {notice && <p className="auth-description" role="status">{notice}</p>}

                <button className="auth-primary-button" type="submit" disabled={loading}>
                  {loading ? "Sending code..." : "Send reset code"}
                </button>
              </form>

              <p className="auth-switch">
                Remember your password?{" "}
                <button
                  className="auth-text-button"
                  type="button"
                  onClick={returnToCredentials}
                  disabled={loading}
                >
                  Back to sign in
                </button>
              </p>
            </>
          ) : step === "reset-verification" ? (
            <>
              <h1>Check your email</h1>
              <p className="auth-description">
                Enter the password-reset code sent to{" "}
                <strong>{email.trim()}</strong>. It expires in 10 minutes.
              </p>

              <form onSubmit={handleVerifyResetCode}>
                <div className="auth-field">
                  <label className="auth-label" htmlFor="resetCode">
                    Reset code
                  </label>
                  <input
                    className="auth-input"
                    id="resetCode"
                    name="resetCode"
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

                {error && <p className="auth-error" role="alert">{error}</p>}
                {notice && <p className="auth-description" role="status">{notice}</p>}

                <button
                  className="auth-primary-button"
                  type="submit"
                  disabled={loading || verificationCode.length !== 6}
                >
                  {loading ? "Verifying..." : "Verify reset code"}
                </button>
              </form>

              <p className="auth-switch">
                <button
                  className="auth-text-button"
                  type="button"
                  onClick={backToForgotPassword}
                  disabled={loading}
                >
                  Request another code
                </button>
              </p>
            </>
          ) : step === "reset-password" ? (
            <>
              <h1>Set a new password</h1>
              <p className="auth-description">
                Choose a new password for <strong>{email.trim()}</strong>.
              </p>

              <form onSubmit={handleResetPassword}>
                <div className="auth-field">
                  <label className="auth-label" htmlFor="newPassword">
                    New password
                  </label>
                  <input
                    className="auth-input"
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    autoComplete="new-password"
                    minLength={6}
                    maxLength={128}
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </div>

                <div className="auth-field">
                  <label className="auth-label" htmlFor="confirmNewPassword">
                    Confirm new password
                  </label>
                  <input
                    className="auth-input"
                    id="confirmNewPassword"
                    name="confirmNewPassword"
                    type="password"
                    autoComplete="new-password"
                    minLength={6}
                    maxLength={128}
                    required
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                  />
                </div>

                {error && <p className="auth-error" role="alert">{error}</p>}
                {notice && <p className="auth-description" role="status">{notice}</p>}

                <button className="auth-primary-button" type="submit" disabled={loading}>
                  {loading ? "Resetting password..." : "Reset password"}
                </button>
              </form>

              <p className="auth-switch">
                <button
                  className="auth-text-button"
                  type="button"
                  onClick={backToForgotPassword}
                  disabled={loading}
                >
                  Start again
                </button>
              </p>
            </>
          ) : (
            <>
              <h1>{mode === "signup" ? "Create your account" : "Welcome back"}</h1>

              <p className="auth-description">
                {mode === "signup"
                  ? "Create an account to save your research workspace."
                  : "Sign in to return to your research workspace."}
              </p>

              <form onSubmit={handleSubmit}>
                {mode === "signup" && (
                  <div className="auth-field">
                    <label className="auth-label" htmlFor="name">Full name</label>
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
                  <label className="auth-label" htmlFor="email">Email address</label>
                  <input
                    className="auth-input"
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    maxLength={254}
                    value={email}
                    aria-invalid={emailFormatInvalid}
                    aria-describedby={emailFormatInvalid ? "email-validation" : undefined}
                    onChange={(event) => handleEmailChange(event.target.value)}
                    onBlur={handleEmailBlur}
                  />
                  {emailFormatInvalid && (
                    <p id="email-validation" className="auth-error" role="alert">
                      Please enter a valid email address.
                    </p>
                  )}
                </div>

                <div className="auth-field">
                  <label className="auth-label" htmlFor="password">Password</label>
                  <input
                    className="auth-input"
                    id="password"
                    name="password"
                    type="password"
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    required
                    minLength={mode === "signup" ? 6 : 1}
                    maxLength={128}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </div>

                {mode === "signup" && (
                  <div className="auth-field">
                    <label className="auth-label" htmlFor="confirmPassword">Confirm password</label>
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
                      onChange={(event) => setConfirmPassword(event.target.value)}
                    />
                  </div>
                )}

                {error && <p className="auth-error" role="alert">{error}</p>}
                {notice && <p className="auth-description" role="status">{notice}</p>}

                <button className="auth-primary-button" type="submit" disabled={loading}>
                  {loading ? "Please wait..." : mode === "signup" ? "Create account" : "Sign in"}
                </button>
              </form>

              {mode === "login" && (
                <p className="auth-switch">
                  <button
                    className="auth-text-button"
                    type="button"
                    onClick={openForgotPassword}
                    disabled={loading}
                  >
                    Forgot password?
                  </button>
                </p>
              )}

              <p className="auth-switch">
                {mode === "signup" ? "Already have an account?" : "New to Fieldnotes?"}{" "}
                <button className="auth-text-button" type="button" onClick={toggleMode} disabled={loading}>
                  {mode === "signup" ? "Sign in" : "Create an account"}
                </button>
              </p>
            </>
          )}
        </div>

        <p className="auth-terms">
          {step === "verification" || step === "reset-verification"
            ? "Your verification code expires after 10 minutes."
            : step === "reset-password"
              ? "Your password-reset session is temporary and can only be used once."
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
