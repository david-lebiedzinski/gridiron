import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { signIn, signUp } from "../lib/auth";
import { APP, AUTH } from "../strings";
import "./auth.css";

export default function Auth() {
  const location = useLocation();
  const navigate = useNavigate();
  const isSignup = location.pathname === "/signup";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (isSignup) {
      if (password.length < 8) {
        setError(AUTH.errorPasswordLength);
        return;
      }
      if (password !== confirmPassword) {
        setError(AUTH.errorPasswordMismatch);
        return;
      }
    }

    setLoading(true);
    try {
      if (isSignup) {
        const tempUsername = email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "_");
        await signUp(email, password, tempUsername);
        navigate("/onboarding");
      } else {
        await signIn(email, password);
        navigate("/picks");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : APP.genericError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-bg" />

      {/* Logo */}
      <div className="auth-logo">
        <span className="auth-logo-icon">🏈</span>
        <span className="auth-logo-mark">{APP.name}</span>
        <div className="auth-logo-sub">{APP.tagline}</div>
      </div>

      {/* Card */}
      <div className="auth-card-wrap">
        <div className="auth-card">
          <div className="auth-card-title">
            {isSignup ? AUTH.createAccount : AUTH.welcomeBack}
          </div>
          <div className="auth-card-sub">
            {isSignup
              ? AUTH.signupSubtitle
              : AUTH.signinSubtitle}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="auth-field">
              <label className="auth-label">{AUTH.emailLabel}</label>
              <input
                className="auth-input"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="auth-field">
              <label className="auth-label">{AUTH.passwordLabel}</label>
              <input
                className="auth-input"
                type="password"
                required
                placeholder={isSignup ? AUTH.passwordPlaceholder : AUTH.passwordMask}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {isSignup && <div className="auth-hint">{AUTH.passwordHint}</div>}
            </div>

            {isSignup && (
              <div className="auth-field">
                <label className="auth-label">{AUTH.confirmPasswordLabel}</label>
                <input
                  className="auth-input"
                  type="password"
                  required
                  placeholder={AUTH.passwordMask}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            )}

            {error && <div className="auth-error">{error}</div>}

            <button className="auth-btn" type="submit" disabled={loading}>
              {loading ? (
                <span className="auth-spinner" />
              ) : isSignup ? (
                AUTH.submitSignup
              ) : (
                AUTH.submitSignin
              )}
            </button>
          </form>

          <div className="auth-divider">
            <span className="auth-divider-text">{AUTH.divider}</span>
          </div>

          <div className="auth-footer">
            {isSignup ? AUTH.hasAccount : AUTH.noAccount}
            <span
              className="auth-link"
              onClick={() => {
                setError("");
                navigate(isSignup ? "/login" : "/signup");
              }}
            >
              {isSignup ? AUTH.signIn : AUTH.signUp}
            </span>
          </div>
        </div>

        <div className="auth-tagline">{APP.motto}</div>
      </div>
    </div>
  );
}
