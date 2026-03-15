/**
 * ProfilePage — User profile with working Subscription & Billing button.
 *
 * Manage Subscription / Billing calls POST /v1/subscription/portal to get
 * a Chargebee portal session URL, then navigates to it.
 */
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, CreditCard, Loader2 } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || '';

const ProfilePage: React.FC = () => {
  const { user, getToken } = useAuth();
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingError, setBillingError] = useState('');

  // TODO: Fetch isAccountHolder from household membership record
  const isAccountHolder = user?.role === 'primary'; // Simplified for now

  const openBillingPortal = async () => {
    setBillingLoading(true);
    setBillingError('');

    try {
      const token = await getToken();

      const response = await fetch(`${API_URL}/v1/subscription/portal`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Failed to open Subscription & Billing portal (${response.status})`);
      }

      const data = await response.json();

      if (data.portalUrl) {
        window.location.href = data.portalUrl;
      } else {
        throw new Error('No portal URL returned');
      }
    } catch (err: any) {
      console.error('Subscription & Billing portal error:', err);
      setBillingError(err.message || 'Failed to open Subscription & Billing portal.');
    } finally {
      setBillingLoading(false);
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Profile</h1>

      <div className="profile-card">
        <div className="profile-avatar">
          {user?.displayName?.charAt(0)?.toUpperCase() || 'U'}
        </div>

        <div className="profile-fields">
          <div className="profile-field">
            <User size={16} />
            <div>
              <label>First Name</label>
              <p>{user?.firstName || 'Not set'}</p>
            </div>
          </div>

          <div className="profile-field">
            <User size={16} />
            <div>
              <label>Last Name</label>
              <p>{user?.lastName || 'Not set'}</p>
            </div>
          </div>

          <div className="profile-field">
            <User size={16} />
            <div>
              <label>Preferred Name</label>
              <p>{user?.displayName || 'Not set'}</p>
            </div>
          </div>

          <div className="profile-field">
            <Mail size={16} />
            <div>
              <label>Email</label>
              <p>{user?.email || 'Not set'}</p>
            </div>
          </div>

          <div className="profile-field">
            <span className="profile-role-badge">
              {user?.role === 'primary' ? 'Primary User' : 'Member'}
            </span>
          </div>
        </div>

        {isAccountHolder && (
          <>
            <div className="profile-divider" />
            <div className="profile-billing">
              <h3><CreditCard size={18} /> Subscription & Billing</h3>
              <p>Manage your subscription, payment method, view invoices, or cancel your plan.</p>

              {billingError && (
                <div style={{
                  padding: '0.5rem 0.75rem',
                  marginBottom: '0.75rem',
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: '6px',
                  color: '#DC2626',
                  fontSize: '0.8rem',
                }}>
                  {billingError}
                </div>
              )}

              <button
                className="btn btn-secondary"
                onClick={openBillingPortal}
                disabled={billingLoading}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
              >
                {billingLoading ? (
                  <>
                    <Loader2 size={14} className="spin" />
                    Opening...
                  </>
                ) : (
                  'Manage Subscription / Billing'
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;