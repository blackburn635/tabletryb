import React from 'react';
import { Link } from 'react-router-dom';
import { Check, ArrowRight } from 'lucide-react';
import { BRAND, PLANS } from '@tabletryb/shared';

const PricingPage: React.FC = () => (
  <div style={{ maxWidth: 600, margin: '60px auto', padding: '0 24px', textAlign: 'center' }}>
    <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 8 }}>Simple, transparent pricing</h1>
    <p style={{ color: 'var(--color-text-muted)', fontSize: 18, marginBottom: 40 }}>
      One plan. Everything included. Start with a 14-day free trial.
    </p>
    <div className="pricing-card-hero">
      <div className="pricing-price">
        <span className="price-amount">${(PLANS.TABLETRYB_MONTHLY.price / 100).toFixed(2)}</span>
        <span className="price-period">/month</span>
      </div>
      <p className="pricing-or">or ${(PLANS.TABLETRYB_ANNUAL.price / 100).toFixed(2)}/year (save 17%)</p>
      <ul className="pricing-features">
        {['Unlimited recipes', 'Unlimited members', 'AI recipe import (photo + URL)', 'Smart grocery lists by aisle', 'Grocery store integrations', 'Family voting & finalization', '14-day free trial'].map(f => (
          <li key={f}><Check size={18} color="var(--color-success)" />{f}</li>
        ))}
      </ul>
      <Link to="/signup" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
        Start Free Trial <ArrowRight size={20} />
      </Link>
    </div>
  </div>
);
export default PricingPage;
