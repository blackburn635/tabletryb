/**
 * Logo — Renders the actual brand logo image.
 * `size` controls the HEIGHT; width scales naturally with aspect ratio.
 */

import React from 'react';

interface LogoProps {
  size?: number;
  variant?: 'light' | 'dark' | 'icon';
}

const LOGO_SRC: Record<string, string> = {
  light: '/assets/logo-light.svg',
  dark: '/assets/logo-dark.svg',
  icon: '/assets/logo-icon.svg',
};

const Logo: React.FC<LogoProps> = ({ size = 32, variant = 'light' }) => {
  return (
    <img
      src={LOGO_SRC[variant]}
      alt="TableTryb"
      style={{
        height: size,
        width: 'auto',
        display: 'block',
      }}
    />
  );
};

export default Logo;