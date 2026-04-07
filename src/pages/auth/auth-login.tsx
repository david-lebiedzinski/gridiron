import { useState } from "react";
import type { FormEvent, ChangeEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/auth";
import { APP, AUTH } from "@/locales/en";
import AuthLayout from "./auth-layout";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleEmailChange(e: ChangeEvent<HTMLInputElement>) {
    setEmail(e.target.value);
  }

  function handlePasswordChange(e: ChangeEvent<HTMLInputElement>) {
    setPassword(e.target.value);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : APP.genericError);
    } finally {
      setLoading(false);
    }
  }

  let errorMessage: React.ReactNode = undefined;
  if (error) {
    errorMessage = <div className="auth-error">{error}</div>;
  }

  let buttonContent: React.ReactNode;
  if (loading) {
    buttonContent = <span className="auth-spinner" />;
  } else {
    buttonContent = AUTH.submitSignin;
  }

  return (
    <AuthLayout>
      <div className="auth-card">
        <div className="auth-card-title">{AUTH.welcomeBack}</div>
        <div className="auth-card-sub">{AUTH.signinSubtitle}</div>

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label className="auth-label">{AUTH.emailLabel}</label>
            <input
              className="auth-input"
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={handleEmailChange}
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">{AUTH.passwordLabel}</label>
            <input
              className="auth-input"
              type="password"
              required
              placeholder={AUTH.passwordMask}
              value={password}
              onChange={handlePasswordChange}
            />
          </div>

          {errorMessage}

          <button className="auth-btn" type="submit" disabled={loading}>
            {buttonContent}
          </button>
        </form>

        <div className="auth-divider">
          <span className="auth-divider-text">{AUTH.divider}</span>
        </div>

        <div className="auth-footer">
          {AUTH.noAccount}
          <Link className="auth-link" to="/signup">
            {AUTH.signUp}
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
