'use client';

import { useState } from 'react';

interface EmbeddedFrameProps {
  src: string;
  title: string;
  fallbackUrl?: string;
  className?: string;
}

export default function EmbeddedFrame({ 
  src, 
  title, 
  fallbackUrl, 
  className = '' 
}: EmbeddedFrameProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError && fallbackUrl) {
    return (
      <div className={`bg-gray-50 rounded-lg p-8 text-center ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {title}
        </h3>
        <p className="text-gray-600 mb-4">
          Having trouble loading the embedded content?
        </p>
        <a
          href={fallbackUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Open in New Tab
        </a>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
        <iframe
          src={src}
          title={title}
          className="absolute top-0 left-0 w-full h-full rounded-lg border-0"
          onError={() => setHasError(true)}
          loading="lazy"
        />
      </div>
      
      {fallbackUrl && (
        <div className="mt-4 text-center">
          <a
            href={fallbackUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Open in new tab
          </a>
        </div>
      )}
    </div>
  );
}
