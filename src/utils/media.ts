export interface ParsedMedia {
  type: 'youtube' | 'drive' | 'direct_video' | 'image' | 'unknown';
  embedUrl: string;
  directUrl: string;
  thumbnailUrl?: string;
  providerLabel: string;
  isShort?: boolean;
}

/**
 * Extracts YouTube Video ID from various URL formats (watch, embed, youtu.be, shorts, live)
 */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const cleanUrl = url.trim();

  // Match youtube.com/watch?v=, /embed/, /v/, /shorts/, /live/ or youtu.be/
  const match = cleanUrl.match(
    /(?:(?:www\.|m\.)?youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/i
  );
  if (match && match[1]) {
    return match[1];
  }

  return null;
}

/**
 * Extracts Google Drive File ID from various URL formats
 */
export function extractGoogleDriveId(url: string): string | null {
  if (!url) return null;
  const cleanUrl = url.trim();

  // drive.google.com/file/d/FILE_ID/...
  const fileMatch = cleanUrl.match(/drive\.google\.com\/file\/d\/([\w-]+)/i);
  if (fileMatch && fileMatch[1]) {
    return fileMatch[1];
  }

  // drive.google.com/open?id=FILE_ID or uc?id=FILE_ID
  const queryMatch = cleanUrl.match(/drive\.google\.com\/(?:open|uc)\?.*id=([\w-]+)/i);
  if (queryMatch && queryMatch[1]) {
    return queryMatch[1];
  }

  return null;
}

/**
 * Parses any media URL into embeddable format with metadata
 */
export function parseEmbedMediaUrl(url: string, forceType?: 'video' | 'foto'): ParsedMedia {
  if (!url || typeof url !== 'string') {
    return {
      type: 'unknown',
      embedUrl: '',
      directUrl: '',
      providerLabel: 'Enlace Directo'
    };
  }

  const cleanUrl = url.trim();

  // 1. YouTube (including YouTube Shorts)
  const youtubeId = extractYouTubeId(cleanUrl);
  if (youtubeId) {
    const isShort = /youtube\.com\/shorts\//i.test(cleanUrl);
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1`,
      directUrl: isShort
        ? `https://www.youtube.com/shorts/${youtubeId}`
        : `https://www.youtube.com/watch?v=${youtubeId}`,
      thumbnailUrl: `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
      providerLabel: isShort ? 'YouTube Short' : 'YouTube',
      isShort
    };
  }

  // 2. Google Drive
  const driveId = extractGoogleDriveId(cleanUrl);
  if (driveId) {
    if (forceType === 'foto') {
      return {
        type: 'image',
        embedUrl: `https://lh3.googleusercontent.com/d/${driveId}`,
        directUrl: `https://drive.google.com/file/d/${driveId}/view`,
        thumbnailUrl: `https://lh3.googleusercontent.com/d/${driveId}`,
        providerLabel: 'Google Drive (Imagen)'
      };
    }
    return {
      type: 'drive',
      embedUrl: `https://drive.google.com/file/d/${driveId}/preview`,
      directUrl: `https://drive.google.com/file/d/${driveId}/view`,
      thumbnailUrl: `https://lh3.googleusercontent.com/d/${driveId}`,
      providerLabel: 'Google Drive'
    };
  }

  // 3. Direct Images (Unsplash, direct jpg/png/webp, SVG, data URL)
  const isImage = forceType === 'foto' || 
    /\.(jpeg|jpg|gif|png|webp|svg)($|\?)/i.test(cleanUrl) || 
    cleanUrl.startsWith('data:image/') ||
    cleanUrl.includes('images.unsplash.com') ||
    cleanUrl.includes('imgur.com');

  if (isImage) {
    return {
      type: 'image',
      embedUrl: cleanUrl,
      directUrl: cleanUrl,
      thumbnailUrl: cleanUrl,
      providerLabel: 'Imagen'
    };
  }

  // 4. Direct Videos (MP4, WebM)
  const isDirectVideo = /\.(mp4|webm|ogg)($|\?)/i.test(cleanUrl);
  if (isDirectVideo) {
    return {
      type: 'direct_video',
      embedUrl: cleanUrl,
      directUrl: cleanUrl,
      providerLabel: 'Video MP4/Directo'
    };
  }

  // Fallback
  return {
    type: 'unknown',
    embedUrl: cleanUrl,
    directUrl: cleanUrl,
    providerLabel: 'Enlace Web'
  };
}
