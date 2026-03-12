/**
 * Logo — Renders the TableTryb logo from asset files.
 * Uses logo-icon.svg for small sizes, logo-light.svg for full logo.
 */

import React from 'react';
import { BRAND } from '../../config/branding';

interface LogoProps {
  /** Height in pixels */
  size?: number;
  /** Show full logo (mark + wordmark) vs icon only */
  showText?: boolean;
  /** Use dark variant (for dark backgrounds) */
  variant?: 'light' | 'dark';
}

const Logo: React.FC<LogoProps> = ({ size = 32, showText = false, variant = 'light' }) => {
  const logoSrc = showText
    ? (variant === 'dark' ? BRAND.logo.dark : BRAND.logo.light)
    : BRAND.logo.icon;

  return (
    <img
      src={logoSrc}
      alt={BRAND.name}
      style={{ height: size, width: 'auto' }}
      className="logo"
    />
  );
};

export default Logo;