/**
 * CreateHouseholdPage — Onboarding step after sign-up.
 *
 * Flow:
 *   1. User enters a household name
 *   2. POST /v1/households creates household + sets Cognito custom attributes
 *   3. refreshUser() exchanges refresh token for new ID token with householdId
 *   4. Navigate to /app (ProtectedRoute now sees householdId and allows access)
 *
 * FIX: The original version was a dead-end because after household creation,
 * the Cognito session wasn't being refreshed. The cached JWT still had
 * householdId=null, so ProtectedRoute kept redirecting back here.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || '';

const CreateHouseholdPage: React.FC = () => {
  const { user, getToken, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [householdName, setHouseholdName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleCreateHousehold = async () => {
    const trimmedName = householdName.trim();
    if (!trimmedName) {
      setErrorMessage('Please enter a household name.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const token = await getToken();

      const response = await fetch(`${API_URL}/v1/households`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: trimmedName }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Failed to create household (${response.status})`);
      }

      // Household created! The Lambda has updated Cognito custom attributes
      // (custom:householdId, custom:role). Now refresh the session to get
      // a new ID token with these claims.
      await refreshUser();

      // Navigate to the main app — ProtectedRoute will now see householdId
      navigate('/app', { replace: true });
    } catch (err: any) {
      console.error('Create household error:', err);
      setErrorMessage(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSubmitting) {
      handleCreateHousehold();
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '2rem',
      fontFamily: 'Inter, system-ui, sans-serif',
      backgroundColor: '#FFF8F0',
    }}>
      <div style={{
        maxWidth: '440px',
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        padding: '2.5rem',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
      }}>
        {/* Logo / Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: 700,
            color: '#1F2937',
            margin: '0 0 0.5rem 0',
          }}>
            Create Your Household
          </h1>
          <p style={{
            fontSize: '0.95rem',
            color: '#6B7280',
            margin: 0,
          }}>
            Welcome{user?.displayName ? `, ${user.displayName}` : ''}! Give your household a name
            to get started with TableTryb.
          </p>
        </div>

        {/* Household Name Input */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label
            htmlFor="household-name"
            style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#374151',
              marginBottom: '0.5rem',
            }}
          >
            Household Name
          </label>
          <input
            id="household-name"
            type="text"
            placeholder="e.g. The Johnson Family"
            value={householdName}
            onChange={(e) => setHouseholdName(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              fontSize: '1rem',
              border: '1px solid #D1D5DB',
              borderRadius: '8px',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.15s',
            }}
            onFocus={(e) => (e.target.style.borderColor = '#E07A5F')}
            onBlur={(e) => (e.target.style.borderColor = '#D1D5DB')}
            autoFocus
          />
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div style={{
            padding: '0.75rem 1rem',
            marginBottom: '1rem',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: '8px',
            color: '#DC2626',
            fontSize: '0.875rem',
          }}>
            {errorMessage}
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleCreateHousehold}
          disabled={isSubmitting || !householdName.trim()}
          style={{
            width: '100%',
            padding: '0.875rem',
            fontSize: '1rem',
            fontWeight: 600,
            color: '#FFFFFF',
            backgroundColor: isSubmitting || !householdName.trim() ? '#D1D5DB' : '#E07A5F',
            border: 'none',
            borderRadius: '8px',
            cursor: isSubmitting || !householdName.trim() ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.15s',
          }}
          onMouseEnter={(e) => {
            if (!isSubmitting && householdName.trim()) {
              (e.target as HTMLButtonElement).style.backgroundColor = '#C96A52';
            }
          }}
          onMouseLeave={(e) => {
            if (!isSubmitting && householdName.trim()) {
              (e.target as HTMLButtonElement).style.backgroundColor = '#E07A5F';
            }
          }}
        >
          {isSubmitting ? 'Creating...' : 'Create Household'}
        </button>
      </div>
    </div>
  );
};

export default CreateHouseholdPage;
