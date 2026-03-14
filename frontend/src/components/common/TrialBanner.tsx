/**
 * TrialBanner — Subscription status banner shown at the top of the app.
 *
 * States:
 *   - in_trial: "X days left in your free trial" + Subscribe Now link
 *   - expired:  "Your trial has ended" + Subscribe to Continue
 *   - past_due: "Payment failed" + Update Payment Method
 *   - active:   no banner (hidden)
 *   - none:     no banner (shouldn't happen inside AppShell)
 *   - cancelled: "Subscription cancelled" + read-only notice
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Clock, AlertTriangle, XCircle, CreditCard } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || '';

interface SubStatus {
  status: string;
  trialDaysRemaining?: number;
  planId?: string | null;
  chargebeeCustomerId?: string | null;
}

const TrialBanner: React.FC = () => {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [subStatus, setSubStatus] = useState<SubStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchStatus = async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${API_URL}/v1/subscription/status`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok && !cancelled) {
          const data = await res.json();
          setSubStatus(data);
        }
      } catch (err) {
        console.error('Failed to fetch subscription status:', err);
      }
    };

    fetchStatus();
    return () => { cancelled = true; };
  }, [getToken]);

  // Don't show banner in these cases
  if (!subStatus) return null;
  if (dismissed) return null;
  if (subStatus.status === 'active') return null;
  if (subStatus.status === 'none') return null;

  const bannerConfig = getBannerConfig(subStatus, navigate);
  if (!bannerConfig) return null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.75rem',
      padding: '0.625rem 1rem',
      background: bannerConfig.bg,
      color: bannerConfig.color,
      fontSize: '0.875rem',
      fontWeight: 500,
      flexWrap: 'wrap',
      position: 'relative',
    }}>
      {bannerConfig.icon}
      <span>{bannerConfig.message}</span>
      <button
        onClick={bannerConfig.action}
        style={{
          background: bannerConfig.buttonBg,
          color: bannerConfig.buttonColor,
          border: 'none',
          borderRadius: '6px',
          padding: '0.375rem 1rem',
          fontSize: '0.8rem',
          fontWeight: 700,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        {bannerConfig.buttonText}
      </button>

      {/* Dismiss for trial banners (not expired/past_due) */}
      {subStatus.status === 'in_trial' && (
        <button
          onClick={() => setDismissed(true)}
          style={{
            position: 'absolute',
            right: '8px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            color: bannerConfig.color,
            cursor: 'pointer',
            opacity: 0.6,
            fontSize: '1.1rem',
            lineHeight: 1,
            padding: '4px',
          }}
          title="Dismiss"
        >
          ✕
        </button>
      )}
    </div>
  );
};

function getBannerConfig(
  status: SubStatus,
  navigate: ReturnType<typeof useNavigate>
) {
  switch (status.status) {
    case 'in_trial': {
      const days = status.trialDaysRemaining ?? 0;
      const dayText = days === 1 ? '1 day' : `${days} days`;
      return {
        bg: 'linear-gradient(90deg, #EEF2FF, #E0E7FF)',
        color: '#3730A3',
        icon: <Clock size={16} />,
        message: `${dayText} left in your free trial`,
        buttonBg: '#4338CA',
        buttonColor: '#FFFFFF',
        buttonText: 'Subscribe Now',
        action: () => navigate('/app/subscribe'),
      };
    }
    case 'expired':
      return {
        bg: 'linear-gradient(90deg, #FEF2F2, #FEE2E2)',
        color: '#991B1B',
        icon: <XCircle size={16} />,
        message: 'Your free trial has ended. Subscribe to keep planning meals.',
        buttonBg: '#DC2626',
        buttonColor: '#FFFFFF',
        buttonText: 'Subscribe to Continue',
        action: () => navigate('/app/subscribe'),
      };
    case 'past_due':
      return {
        bg: 'linear-gradient(90deg, #FFFBEB, #FEF3C7)',
        color: '#92400E',
        icon: <AlertTriangle size={16} />,
        message: 'Payment failed. Please update your payment method.',
        buttonBg: '#D97706',
        buttonColor: '#FFFFFF',
        buttonText: 'Update Payment',
        action: () => navigate('/app/profile'),
      };
    case 'cancelled':
      return {
        bg: 'linear-gradient(90deg, #F3F4F6, #E5E7EB)',
        color: '#374151',
        icon: <CreditCard size={16} />,
        message: 'Your subscription has been cancelled. The app is read-only.',
        buttonBg: '#4B5563',
        buttonColor: '#FFFFFF',
        buttonText: 'Resubscribe',
        action: () => navigate('/app/subscribe'),
      };
    default:
      return null;
  }
}

export default TrialBanner;
