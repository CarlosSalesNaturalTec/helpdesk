import React, { useState } from 'react';

interface StarRatingProps {
  rating: number;
  onChange: (rating: number) => void;
  disabled?: boolean;
}

export const StarRating: React.FC<StarRatingProps> = ({ rating, onChange, disabled = false }) => {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  return (
    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', margin: '16px 0' }}>
      {[1, 2, 3, 4, 5].map((star) => {
        const active = hoverRating !== null ? star <= hoverRating : star <= rating;
        return (
          <button
            key={star}
            type="button"
            disabled={disabled}
            onMouseEnter={() => !disabled && setHoverRating(star)}
            onMouseLeave={() => !disabled && setHoverRating(null)}
            onClick={() => !disabled && onChange(star)}
            style={{
              background: 'none',
              border: 'none',
              cursor: disabled ? 'default' : 'pointer',
              fontSize: '36px',
              color: active ? 'var(--warning-main)' : 'var(--hue-gray-border)',
              transition: 'color 0.15s ease, transform 0.1s ease',
              transform: !disabled && hoverRating === star ? 'scale(1.2)' : 'scale(1)',
              outline: 'none',
            }}
          >
            ★
          </button>
        );
      })}
    </div>
  );
};
