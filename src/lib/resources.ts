/**
 * Resource URL parsing and thumbnail generation utilities
 */

export type ResourceProvider = 'youtube' | 'dropbox' | 'drive' | 'zoom' | 'generic';

export interface ParsedResourceUrl {
  provider: ResourceProvider;
  thumbnailUrl?: string;
}

/**
 * Extract YouTube video ID from various YouTube URL formats
 */
function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/.*[?&]v=([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Detect provider and generate thumbnail URL from resource URL
 */
export function parseResourceUrl(url: string): ParsedResourceUrl {
  if (!url) {
    return { provider: 'generic' };
  }

  const lowerUrl = url.toLowerCase();

  // YouTube detection
  const youtubeVideoId = extractYouTubeVideoId(lowerUrl);
  if (youtubeVideoId) {
    return {
      provider: 'youtube',
      thumbnailUrl: `https://img.youtube.com/vi/${youtubeVideoId}/hqdefault.jpg`,
    };
  }

  // Dropbox detection
  if (lowerUrl.includes('dropbox.com') || lowerUrl.includes('dropboxusercontent.com')) {
    return { provider: 'dropbox' };
  }

  // Google Drive detection
  if (lowerUrl.includes('drive.google.com') || lowerUrl.includes('docs.google.com')) {
    return { provider: 'drive' };
  }

  // Zoom detection
  if (lowerUrl.includes('zoom.us') || lowerUrl.includes('zoom.com')) {
    return { provider: 'zoom' };
  }

  // Default
  return { provider: 'generic' };
}

/**
 * Get provider icon name for display
 */
export function getProviderIcon(provider: ResourceProvider): string {
  switch (provider) {
    case 'youtube':
      return '🎥';
    case 'dropbox':
      return '📦';
    case 'drive':
      return '📁';
    case 'zoom':
      return '💻';
    default:
      return '🔗';
  }
}

/**
 * Get provider display name
 */
export function getProviderName(provider: ResourceProvider): string {
  switch (provider) {
    case 'youtube':
      return 'YouTube';
    case 'dropbox':
      return 'Dropbox';
    case 'drive':
      return 'Google Drive';
    case 'zoom':
      return 'Zoom';
    default:
      return 'Link';
  }
}

