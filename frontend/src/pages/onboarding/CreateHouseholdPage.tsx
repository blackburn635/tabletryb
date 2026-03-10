import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';

const CreateHouseholdPage: React.FC = () => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const api = useApi();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/v1/households', { name });
      await refreshUser();
      navigate('/app');
    } catch { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Create Your Household</h2>
        <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', marginBottom: 24 }}>
          Give your household a name. You can invite family members next.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Household Name</label>
            <input className="form-input" placeholder="e.g., The Smith Family" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Creating...' : 'Create Household'}
          </button>
        </form>
      </div>
    </div>
  );
};
export default CreateHouseholdPage;
