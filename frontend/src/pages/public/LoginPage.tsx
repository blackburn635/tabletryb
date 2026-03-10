/**
 * LoginPage — Sign in / sign up with email and password.
 * Handles Cognito authentication flow including email verification.
 */
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BRAND } from '../../config/branding';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp, confirmSignUp } = useAuth();
  const isSignUp = location.pathname === '/signup';

  const [mode, setMode] = useState<'signin' | 'signup' | 'verify'>(isSignUp ? 'signup' : 'signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'signin') {
        await signIn(email, password);
        navigate('/app');
      } else if (mode === 'signup') {
        await signUp(email, password, name);
        setMode('verify');
      } else {
        await confirmSignUp(email, code);
        await signIn(email, password);
        navigate('/onboarding/create-household');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>{mode === 'signin' ? 'Welcome back' : mode === 'signup' ? `Join ${BRAND.name}` : 'Verify your email'}</h2>

        {error && <div className="form-error" style={{ marginBottom: 16, textAlign: 'center' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          {mode === 'verify' ? (
            <div className="form-group">
              <label className="form-label">Verification code (check your email)</label>
              <input className="form-input" type="text" value={code} onChange={(e) => setCode(e.target.value)} required />
            </div>
          ) : (
            <>
              {mode === 'signup' && (
                <div className="form-group">
                  <label className="form-label">Your name</label>
                  <input className="form-input" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input className="form-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
              </div>
            </>
          )}
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Loading...' : mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Verify'}
          </button>
        </form>

        {mode === 'signin' && (
          <div className="auth-switch">
            Don't have an account? <Link to="/signup" onClick={() => setMode('signup')}>Sign up</Link>
          </div>
        )}
        {mode === 'signup' && (
          <div className="auth-switch">
            Already have an account? <Link to="/login" onClick={() => setMode('signin')}>Sign in</Link>
          </div>
        )}
      </div>
    </div>
  );
};
export default LoginPage;
