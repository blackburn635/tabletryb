/**
 * ProfilePage — User profile: names, email, role, and billing link for account holder.
 *
 * Displays:
 *   - First Name (given_name)
 *   - Last Name (family_name)
 *   - Preferred Name (name / displayName)
 *   - Email
 *   - Role badge
 *   - Manage Billing button (account holder only)
 */
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, CreditCard, ExternalLink } from 'lucide-react';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  // TODO: Fetch isAccountHolder from household membership record
  const isAccountHolder = user?.role === 'primary'; // Simplified for now

  const openBillingPortal = async () => {
    // TODO: Call POST /v1/subscription/portal → redirect to Chargebee
    alert('Chargebee billing portal integration — coming soon');
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
              <h3><CreditCard size={18} /> Billing & Subscription</h3>
              <p>Manage your payment method, view invoices, or update your plan.</p>
              <button className="btn btn-secondary" onClick={openBillingPortal}>
                Manage Billing
                <ExternalLink size={14} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
