/**
 * Logo — PLACEHOLDER component.
 * Replace with actual logo SVG/image when branding is finalized.
 * For now, renders a simple icon placeholder.
 */

import React from 'react';
import { UtensilsCrossed } from 'lucide-react';
import { BRAND } from '../../config/branding';

interface LogoProps {
  size?: number;
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ size = 32, showText = false }) => {
  return (
    <span className="logo" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      {/* PLACEHOLDER: Replace with actual logo image */}
      <span
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.25,
          background: BRAND.colors.primary,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <UtensilsCrossed size={size * 0.6} color={BRAND.colors.textInverse} />
      </span>
      {showText && (
        <span style={{
          fontWeight: 700,
          fontSize: size * 0.6,
          color: BRAND.colors.text,
          fontFamily: 'Inter, sans-serif',
        }}>
          {BRAND.name}
        </span>
      )}
    </span>
  );
};

export default Logo;
