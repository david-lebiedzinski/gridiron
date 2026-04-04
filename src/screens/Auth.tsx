import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { signIn, signUp } from "../lib/auth";
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
        setError("Password must be at least 8 characters.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    }

    setLoading(true);
    try {
      if (isSignup) {
        const tempUsername = email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "_");
        await signUp(email, password, tempUsername);
      } else {
        await signIn(email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
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
        <span className="auth-logo-mark">GRIDIRON</span>
        <div className="auth-logo-sub">NFL Pick'em League</div>
      </div>

      {/* Card */}
      <div className="auth-card-wrap">
        <div className="auth-card">
          <div className="auth-card-title">
            {isSignup ? "Create account" : "Welcome back"}
          </div>
          <div className="auth-card-sub">
            {isSignup
              ? "Join the league. Start picking."
              : "Sign in to your account"}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="auth-field">
              <label className="auth-label">Email</label>
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
              <label className="auth-label">Password</label>
              <input
                className="auth-input"
                type="password"
                required
                placeholder={isSignup ? "At least 8 characters" : "••••••••"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {isSignup && <div className="auth-hint">Min 8 characters</div>}
            </div>

            {isSignup && (
              <div className="auth-field">
                <label className="auth-label">Confirm Password</label>
                <input
                  className="auth-input"
                  type="password"
                  required
                  placeholder="••••••••"
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
                "CREATE ACCOUNT"
              ) : (
                "SIGN IN"
              )}
            </button>
          </form>

          <div className="auth-divider">
            <span className="auth-divider-text">or</span>
          </div>

          <div className="auth-footer">
            {isSignup ? "Already have an account? " : "Don't have an account? "}
            <span
              className="auth-link"
              onClick={() => {
                setError("");
                navigate(isSignup ? "/login" : "/signup");
              }}
            >
              {isSignup ? "Sign in" : "Sign up"}
            </span>
          </div>
        </div>

        <div className="auth-tagline">Pick. Predict. Dominate.</div>
      </div>
    </div>
  );
}
