/**
 * LoginPage — Handles Sign In, Sign Up, and Email Confirmation.
 *
 * Sign-up collects:
 *   - First Name  → Cognito given_name
 *   - Last Name   → Cognito family_name
 *   - Preferred Name (optional) → Cognito name (defaults to First Name if blank)
 *   - Email
 *   - Password
 *
 * After sign-up, shows confirmation code form (Cognito email verification).
 * After confirmation, switches to sign-in mode.
 * Both /login and /signup routes render this component (mode determined by path).
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../components/common/Logo';
import { BRAND } from '../../config/branding';

type Mode = 'sign-in' | 'sign-up' | 'confirm';

const LoginPage: React.FC = () => {
  const { signIn, signUp, confirmSignUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine initial mode from route
  const initialMode: Mode = location.pathname === '/signup' ? 'sign-up' : 'sign-in';
  const [mode, setMode] = useState<Mode>(initialMode);

  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [preferredName, setPreferredName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmCode, setConfirmCode] = useState('');

  // State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Sync mode if user navigates between /login and /signup
  useEffect(() => {
    const newMode = location.pathname === '/signup' ? 'sign-up' : 'sign-in';
    if (mode !== 'confirm') setMode(newMode);
  }, [location.pathname]);

  const clearMessages = () => {
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleSignIn = async () => {
    if (!email.trim() || !password) {
      setErrorMessage('Please enter your email and password.');
      return;
    }
    setIsSubmitting(true);
    clearMessages();
    try {
      await signIn(email.trim(), password);
      navigate('/app', { replace: true });
    } catch (err: any) {
      if (err.code === 'UserNotConfirmedException') {
        setMode('confirm');
        setSuccessMessage('Please confirm your email address first.');
      } else {
        setErrorMessage(err.message || 'Sign in failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUp = async () => {
    if (!firstName.trim()) { setErrorMessage('First name is required.'); return; }
    if (!lastName.trim()) { setErrorMessage('Last name is required.'); return; }
    if (!email.trim()) { setErrorMessage('Email is required.'); return; }
    if (password.length < 8) { setErrorMessage('Password must be at least 8 characters.'); return; }

    setIsSubmitting(true);
    clearMessages();
    try {
      await signUp({
        email: email.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        preferredName: preferredName.trim() || undefined,
      });
      setMode('confirm');
      setSuccessMessage('Account created! Check your email for a verification code.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Sign up failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirm = async () => {
    if (!confirmCode.trim()) { setErrorMessage('Please enter the verification code.'); return; }
    setIsSubmitting(true);
    clearMessages();
    try {
      await confirmSignUp(email.trim(), confirmCode.trim());
      setMode('sign-in');
      setSuccessMessage('Email verified! You can now sign in.');
      setConfirmCode('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Verification failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSubmitting) {
      if (mode === 'sign-in') handleSignIn();
      else if (mode === 'sign-up') handleSignUp();
      else handleConfirm();
    }
  };

  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    clearMessages();
    if (newMode === 'sign-in') navigate('/login', { replace: true });
    if (newMode === 'sign-up') navigate('/signup', { replace: true });
  };

  return (
    <div className="auth-page">
      <div className="auth-card" onKeyDown={handleKeyDown}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <Logo size={36} />
          <h2 style={{ margin: '0.5rem 0 0.25rem', color: 'var(--color-text)' }}>
            {mode === 'sign-in' && 'Welcome back'}
            {mode === 'sign-up' && 'Start your free trial'}
            {mode === 'confirm' && 'Verify your email'}
          </h2>
          <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            {mode === 'sign-in' && 'Sign in to your TableTryb account'}
            {mode === 'sign-up' && '14 days free — no credit card required to sign up'}
            {mode === 'confirm' && `We sent a code to ${email}`}
          </p>
        </div>

        {/* Messages */}
        {errorMessage && (
          <div className="auth-message auth-message--error">{errorMessage}</div>
        )}
        {successMessage && (
          <div className="auth-message auth-message--success">{successMessage}</div>
        )}

        {/* ============================================ */}
        {/* SIGN UP FORM                                 */}
        {/* ============================================ */}
        {mode === 'sign-up' && (
          <>
            {/* First + Last name on one row */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <div className="auth-field" style={{ flex: 1 }}>
                <label htmlFor="firstName">First Name *</label>
                <input
                  id="firstName"
                  type="text"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={isSubmitting}
                  autoFocus
                />
              </div>
              <div className="auth-field" style={{ flex: 1 }}>
                <label htmlFor="lastName">Last Name *</label>
                <input
                  id="lastName"
                  type="text"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Preferred Name */}
            <div className="auth-field">
              <label htmlFor="preferredName">
                Preferred Name
                <span style={{ fontWeight: 400, color: 'var(--color-text-muted)', marginLeft: '0.25rem' }}>
                  (optional)
                </span>
              </label>
              <input
                id="preferredName"
                type="text"
                placeholder="What should we call you?"
                value={preferredName}
                onChange={(e) => setPreferredName(e.target.value)}
                disabled={isSubmitting}
              />
              <span className="auth-hint">
                Leave blank to use your first name. This is how you'll appear to your household.
              </span>
            </div>

            {/* Email */}
            <div className="auth-field">
              <label htmlFor="signupEmail">Email *</label>
              <input
                id="signupEmail"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            {/* Password */}
            <div className="auth-field">
              <label htmlFor="signupPassword">Password *</label>
              <input
                id="signupPassword"
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
              />
              <span className="auth-hint">
                Must include uppercase, lowercase, and a number.
              </span>
            </div>

            <button
              className="btn btn-primary auth-submit"
              onClick={handleSignUp}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating account...' : 'Create Account'}
            </button>

            <p className="auth-switch">
              Already have an account?{' '}
              <button className="auth-switch-link" onClick={() => switchMode('sign-in')}>
                Sign in
              </button>
            </p>
          </>
        )}

        {/* ============================================ */}
        {/* SIGN IN FORM                                 */}
        {/* ============================================ */}
        {mode === 'sign-in' && (
          <>
            <div className="auth-field">
              <label htmlFor="loginEmail">Email</label>
              <input
                id="loginEmail"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                autoFocus
              />
            </div>

            <div className="auth-field">
              <label htmlFor="loginPassword">Password</label>
              <input
                id="loginPassword"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <button
              className="btn btn-primary auth-submit"
              onClick={handleSignIn}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>

            <p className="auth-switch">
              Don't have an account?{' '}
              <button className="auth-switch-link" onClick={() => switchMode('sign-up')}>
                Start free trial
              </button>
            </p>
          </>
        )}

        {/* ============================================ */}
        {/* CONFIRM CODE FORM                            */}
        {/* ============================================ */}
        {mode === 'confirm' && (
          <>
            <div className="auth-field">
              <label htmlFor="confirmCode">Verification Code</label>
              <input
                id="confirmCode"
                type="text"
                placeholder="Enter 6-digit code"
                value={confirmCode}
                onChange={(e) => setConfirmCode(e.target.value)}
                disabled={isSubmitting}
                autoFocus
                maxLength={6}
                style={{ textAlign: 'center', letterSpacing: '0.25em', fontSize: '1.25rem' }}
              />
            </div>

            <button
              className="btn btn-primary auth-submit"
              onClick={handleConfirm}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Verifying...' : 'Verify Email'}
            </button>

            <p className="auth-switch">
              <button className="auth-switch-link" onClick={() => switchMode('sign-in')}>
                Back to sign in
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
