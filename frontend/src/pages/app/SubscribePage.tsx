/**
 * SubscribePage — Plan selection and Chargebee checkout trigger.
 *
 * Shows monthly vs annual plan cards. User picks one, we call
 * POST /v1/subscription/checkout, then redirect to Chargebee hosted checkout.
 * After payment, Chargebee redirects back to /app and the webhook updates DynamoDB.
 *
 * Accessible at /app/subscribe. Shown to:
 *   - Trial users who want to subscribe early (via trial banner)
 *   - Expired trial users who need to subscribe to continue
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Check, Zap, Crown, Loader2 } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || '';

interface PlanCard {
  id: string;
  name: string;
  price: string;
  period: string;
  badge?: string;
  features: string[];
}

const PLANS: PlanCard[] = [
  {
    id: 'TableTryb-USD-Monthly',
    name: 'Monthly',
    price: '$4.99',
    period: '/month',
    features: [
      'Unlimited recipes',
      'Unlimited AI recipe scans',
      'Up to 8 household members',
      'Up to 3 grocery stores',
      'Kroger cart push',
    ],
  },
  {
    id: 'TableTryb-USD-Yearly',
    name: 'Annual',
    price: '$49.99',
    period: '/year',
    badge: 'Save 17%',
    features: [
      'Everything in Monthly',
      'Best value — $4.17/mo effective',
      'Lock in your price for 12 months',
    ],
  },
];

const SubscribePage: React.FC = () => {
  const { user, getToken } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string>('TableTryb-USD-Monthly');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubscribe = async () => {
    if (!user?.householdId) {
      setErrorMessage('No household found. Please create a household first.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const token = await getToken();

      const response = await fetch(`${API_URL}/v1/subscription/checkout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: selectedPlan,
          householdId: user.householdId,
          redirectUrl: `${window.location.origin}/app`,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Checkout failed (${response.status})`);
      }

      const data = await response.json();

      if (data.checkoutUrl) {
        // Redirect to Chargebee hosted checkout
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      setErrorMessage(err.message || 'Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 className="page-title" style={{ marginBottom: '0.5rem' }}>Choose Your Plan</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '1.05rem', margin: 0 }}>
          Subscribe to keep your household's meal planning running smoothly.
        </p>
      </div>

      {errorMessage && (
        <div style={{
          maxWidth: '600px',
          margin: '0 auto 1.5rem',
          padding: '0.75rem 1rem',
          backgroundColor: '#FEF2F2',
          border: '1px solid #FECACA',
          borderRadius: '8px',
          color: '#DC2626',
          fontSize: '0.875rem',
          textAlign: 'center',
        }}>
          {errorMessage}
        </div>
      )}

      {/* Plan Cards */}
      <div style={{
        display: 'flex',
        gap: '1.5rem',
        justifyContent: 'center',
        flexWrap: 'wrap',
        marginBottom: '2rem',
      }}>
        {PLANS.map((plan) => {
          const isSelected = selectedPlan === plan.id;
          return (
            <button
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              style={{
                position: 'relative',
                width: '280px',
                padding: '2rem 1.5rem',
                background: isSelected ? 'var(--color-surface)' : 'var(--color-bg-alt, #F9FAFB)',
                border: isSelected
                  ? '2px solid var(--color-primary)'
                  : '2px solid var(--color-border, #E5E7EB)',
                borderRadius: '12px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
                boxShadow: isSelected ? '0 4px 16px rgba(45, 106, 79, 0.15)' : 'none',
              }}
            >
              {/* Badge */}
              {plan.badge && (
                <span style={{
                  position: 'absolute',
                  top: '-10px',
                  right: '16px',
                  background: 'var(--color-secondary, #E76F51)',
                  color: 'white',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '2px 10px',
                  borderRadius: '10px',
                }}>
                  {plan.badge}
                </span>
              )}

              {/* Plan Name */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.75rem',
              }}>
                {plan.id.includes('Yearly') ? <Crown size={20} /> : <Zap size={20} />}
                <span style={{
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: 'var(--color-text)',
                }}>
                  {plan.name}
                </span>
              </div>

              {/* Price */}
              <div style={{ marginBottom: '1.25rem' }}>
                <span style={{
                  fontSize: '2rem',
                  fontWeight: 800,
                  color: isSelected ? 'var(--color-primary)' : 'var(--color-text)',
                  lineHeight: 1,
                }}>
                  {plan.price}
                </span>
                <span style={{
                  fontSize: '0.9rem',
                  color: 'var(--color-text-muted)',
                  marginLeft: '2px',
                }}>
                  {plan.period}
                </span>
              </div>

              {/* Features */}
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {plan.features.map((feature, i) => (
                  <li key={i} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.5rem',
                    fontSize: '0.875rem',
                    color: 'var(--color-text-muted)',
                    marginBottom: '0.5rem',
                    lineHeight: 1.4,
                  }}>
                    <Check size={14} style={{
                      color: 'var(--color-success, #059669)',
                      marginTop: '2px',
                      flexShrink: 0,
                    }} />
                    {feature}
                  </li>
                ))}
              </ul>

              {/* Selected indicator */}
              {isSelected && (
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Check size={12} style={{ color: 'white' }} />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Subscribe Button */}
      <div style={{ textAlign: 'center' }}>
        <button
          className="btn btn-primary"
          onClick={handleSubscribe}
          disabled={isLoading}
          style={{
            padding: '0.875rem 3rem',
            fontSize: '1.05rem',
            fontWeight: 700,
            borderRadius: '8px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          {isLoading ? (
            <>
              <Loader2 size={18} className="spin" />
              Redirecting to checkout...
            </>
          ) : (
            'Subscribe Now'
          )}
        </button>

        <p style={{
          marginTop: '1rem',
          fontSize: '0.85rem',
          color: 'var(--color-text-muted)',
        }}>
          Secure checkout powered by Chargebee. Cancel anytime.
        </p>
      </div>
    </div>
  );
};

export default SubscribePage;
