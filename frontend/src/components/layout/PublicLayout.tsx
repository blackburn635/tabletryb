/**
 * PublicLayout — Layout for marketing pages (homepage, pricing, login).
 * Includes nav bar with logo and CTA, plus footer.
 */

import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { BRAND } from '../../config/branding';
import Logo from '../common/Logo';

const PublicLayout: React.FC = () => {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div className="public-layout">
      {/* Navigation */}
      <nav className="public-nav">
        <div className="nav-inner">
          <Link to="/" className="nav-logo">
            <Logo size={75} />
          </Link>

          <div className="nav-links">
            <Link to="/" className={`nav-link ${isHome ? 'active' : ''}`}>Home</Link>
            <Link to="/pricing" className="nav-link">Pricing</Link>
            <Link to="/contact" className="nav-link">Contact</Link>
            <Link to="/login" className="nav-link">Log In</Link>
            <Link to="/signup" className="nav-cta">Start Free Trial</Link>
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main className="public-main">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="public-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <Logo size={24} />
          </div>
          <div className="footer-links">
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
            <Link to="/contact">Contact</Link>
          </div>
          <div className="footer-copyright">
            &copy; {new Date().getFullYear()} {BRAND.company}. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
