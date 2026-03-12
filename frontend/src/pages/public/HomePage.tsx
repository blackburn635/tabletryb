/**
 * HomePage — Marketing landing page for TableTryb.
 * Public-facing, no authentication required.
 * PLACEHOLDER: Update copy, images, and branding when finalized.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { BRAND } from '../../config/branding';
import {
  Camera, Globe, ThumbsUp, ShoppingCart, Users, Smartphone,
  ChefHat, ArrowRight, Check, Scan, Link as LinkIcon,
  LockKeyhole
} from 'lucide-react';

const HomePage: React.FC = () => {
  return (
    <div className="home-page">

      {/* ============================================================ */}
      {/* HERO SECTION */}
      {/* ============================================================ */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Your family's meals,<br />
            <span className="hero-highlight">planned together.</span>
          </h1>
          <p className="hero-subtitle">
            {BRAND.description}
          </p>
          <div className="hero-cta-group">
            <Link to="/signup" className="btn btn-primary btn-lg">
              Start Free Trial
              <ArrowRight size={20} />
            </Link>
            <Link to="/pricing" className="btn btn-secondary btn-lg">
              See Pricing
            </Link>
          </div>
          <p className="hero-note">14-day free trial. No credit card required.</p>
        </div>
        <div className="hero-visual">
          <img
            src="/assets/hero-screenshot.jpeg"
            alt="TableTryb meal planning dashboard"
            className="hero-image"
          />
        </div>
      </section>

      {/* ============================================================ */}
      {/* HOW IT WORKS — 3 Steps */}
      {/* ============================================================ */}
      <section className="how-it-works">
        <h2 className="section-title">How it works</h2>
        <p className="section-subtitle">
          From recipe to grocery cart in three simple steps.
        </p>

        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number" style={{ background: 'var(--color-secondary-light)' }}>1</div>
            <div className="step-icon-group" style={{ color: 'var(--color-secondary-light)' }}>
              <Camera size={28} />
              <LinkIcon size={28} />
              <Scan size={28} />
            </div>
            <h3>Import Your Recipes</h3>
            <p>
              Snap a photo of a recipe card, paste a URL from any food blog,
              or type it in manually. Our AI extracts every ingredient and step automatically.
            </p>
          </div>

          <div className="step-card">
            <div className="step-number" style={{ background: 'var(--color-secondary)' }}>2</div>
            <div className="step-icon-group" style={{ color: 'var(--color-secondary)' }}>
              <ThumbsUp size={28} />
            </div>
            <h3>Vote Together</h3>
            <p>
              Every family member picks their favorites for the week.
              No more "what's for dinner?" debates — let the votes decide.
            </p>
          </div>

          <div className="step-card">
            <div className="step-number" style={{ background: 'var(--color-accent)' }}>3</div>
            <div className="step-icon-group" style={{ color: 'var(--color-accent)' }}>
              <ShoppingCart size={28} />
            </div>
            <h3>Shop Smarter</h3>
            <p>
              One-tap grocery list grouped by store aisle, with pantry staples separated.
              Push directly to your Kroger cart, or search at H-E-B, Walmart, and more.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* FEATURES GRID */}
      {/* ============================================================ */}
      <section className="features">
        <h2 className="section-title">Everything your family needs</h2>

        <div className="features-grid">
          {[
            {
              icon: Camera,
              title: 'AI Recipe Import',
              desc: 'Photograph a cookbook page, paste a blog URL, or type it in. AI extracts ingredients and instructions instantly.',
              color: 'var(--color-secondary)',
            },
            {
              icon: ThumbsUp,
              title: 'Family Voting',
              desc: 'Every member votes thumbs up or down. See results in real-time and make dinner decisions together.',
              color: 'var(--color-primary)',
            },
            {
              icon: ShoppingCart,
              title: 'Smart Grocery Lists',
              desc: 'Auto-generated from your finalized meals, organized by store aisle, with pantry staples separated. Admins control who can finalize meals and manage the list.',
              color: 'var(--color-secondary-light)',
            },
            {
              icon: Globe,
              title: 'Store Integrations',
              desc: 'Push your list to Kroger\'s cart directly, or search items at H-E-B, Walmart, Target, and more.',
              color: 'var(--color-accent)',
            },
            {
              icon: Smartphone,
              title: 'Works on Any Device',
              desc: 'Plan on your laptop, vote on your phone, shop with your list at the store. Fully responsive.',
              color: 'var(--color-secondary)',
            },
            {
              icon: LockKeyhole,
              title: 'Your Data Stays Yours',
              desc: 'We don\'t sell your recipes, grocery lists, or eating habits to anyone. Ever. Our subscription model means we work for you — not advertisers.',
              color: 'var(--color-primary)',
            },
          ].map((feature) => (
            <div key={feature.title} className="feature-card">
              <feature.icon size={32} style={{ color: feature.color }} />
              <h3>{feature.title}</h3>
              <p>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================ */}
      {/* PRICING CTA */}
      {/* ============================================================ */}
      <section className="pricing-cta">
        <h2 className="section-title">One simple plan. No surprises.</h2>
        <div className="pricing-card-hero">
          <div className="pricing-price">
            <span className="price-amount">$4.99</span>
            <span className="price-period">/month</span>
          </div>
          <p className="pricing-or">or $49.99/year (save 30%)</p>
          <ul className="pricing-features">
            {[
              'Unlimited recipes',
              'Unlimited family members',
              'AI-powered recipe import',
              'Smart grocery lists',
              'Store integrations',
              '14-day free trial',
            ].map((feature) => (
              <li key={feature}>
                <Check size={18} color={BRAND.colors.success} />
                {feature}
              </li>
            ))}
          </ul>
          <Link to="/signup" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
            Get Started Free
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* ============================================================ */}
      {/* FINAL CTA */}
      {/* ============================================================ */}
      <section className="final-cta">
        <h2>Ready to end the "what's for dinner?" debate?</h2>
        <p>Join families who plan meals together with {BRAND.name}.</p>
        <Link to="/signup" className="btn btn-primary btn-lg">
          Start Your Free Trial
          <ArrowRight size={20} />
        </Link>
      </section>
    </div>
  );
};

export default HomePage;