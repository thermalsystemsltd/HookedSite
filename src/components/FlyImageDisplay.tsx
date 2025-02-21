import React, { useState } from 'react';

interface FlyImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function FlyImage({ src, alt, className = "w-16 h-16 object-cover rounded" }: FlyImageProps) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fallback image URL
  const fallbackImage = "/placeholder-fly.png"; // Make sure to add a placeholder image

  return (
    <div className={`relative ${className}`}>
      <img
        src={error ? fallbackImage : src}
        alt={alt}
        className={className}
        onError={(e) => {
          console.error('Image failed to load:', src);
          setError(true);
          setLoading(false);
        }}
        onLoad={() => {
          console.log('Image loaded successfully:', src);
          setLoading(false);
        }}
      />
      {loading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded"></div>
      )}
    </div>
  );
} 