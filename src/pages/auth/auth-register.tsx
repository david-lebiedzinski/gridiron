import { useState } from "react";
import type { FormEvent, ChangeEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/auth";
import { APP, AUTH } from "@/locales/en";
import AuthLayout from "./auth-layout";

export default function SignupPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleEmailChange(e: ChangeEvent<HTMLInputElement>) {
    setEmail(e.target.value);
  }

  function handlePasswordChange(e: ChangeEvent<HTMLInputElement>) {
    setPassword(e.target.value);
  }

  function handleConfirmPasswordChange(e: ChangeEvent<HTMLInputElement>) {
    setConfirmPassword(e.target.value);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError(AUTH.errorPasswordLength);
      return;
    }
    if (password !== confirmPassword) {
      setError(AUTH.errorPasswordMismatch);
      return;
    }

    setLoading(true);
    try {
      await register(email, password);
      navigate("/onboarding");
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
    buttonContent = AUTH.submitSignup;
  }

  return (
    <AuthLayout>
      <div className="auth-card">
        <div className="auth-card-title">{AUTH.createAccount}</div>
        <div className="auth-card-sub">{AUTH.signupSubtitle}</div>

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
              placeholder={AUTH.passwordPlaceholder}
              value={password}
              onChange={handlePasswordChange}
            />
            <div className="auth-hint">{AUTH.passwordHint}</div>
          </div>

          <div className="auth-field">
            <label className="auth-label">{AUTH.confirmPasswordLabel}</label>
            <input
              className="auth-input"
              type="password"
              required
              placeholder={AUTH.passwordMask}
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
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
          {AUTH.hasAccount}
          <Link className="auth-link" to="/login">
            {AUTH.signIn}
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
