import React from 'react';
import { APP_NAME } from '../config.js';

import logoVerticalWebp from '../assets/brand/logo-vertical.webp';
import logoVerticalPng from '../assets/brand/logo-vertical.png';
import logoHorizontalWebp from '../assets/brand/logo-horizontal.webp';
import logoHorizontalPng from '../assets/brand/logo-horizontal.png';
import markWebp from '../assets/brand/mark.webp';
import markPng from '../assets/brand/mark.png';

const VARIANTS = {
  vertical: { webp: logoVerticalWebp, png: logoVerticalPng },
  horizontal: { webp: logoHorizontalWebp, png: logoHorizontalPng },
  mark: { webp: markWebp, png: markPng },
} as const;

interface BrandLogoProps {
  variant: keyof typeof VARIANTS;
  height: number;
  className?: string;
  style?: React.CSSProperties;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ variant, height, className, style }) => {
  const { webp, png } = VARIANTS[variant];

  return (
    <picture>
      <source srcSet={webp} type="image/webp" />
      <img
        src={png}
        alt={APP_NAME}
        height={height}
        decoding="async"
        className={className}
        style={{ height, width: 'auto', display: 'block', ...style }}
      />
    </picture>
  );
};
