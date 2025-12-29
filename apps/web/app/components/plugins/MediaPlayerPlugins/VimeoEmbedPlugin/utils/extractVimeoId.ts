/**
 * Extract Vimeo video ID from various URL formats
 * Supports:
 * - https://vimeo.com/VIDEO_ID
 * - https://player.vimeo.com/video/VIDEO_ID
 * - https://vimeo.com/channels/CHANNEL/VIDEO_ID
 * - https://vimeo.com/groups/GROUP/videos/VIDEO_ID
 * - VIDEO_ID (direct numeric ID)
 */
export function extractVimeoId(url: string): string | null {
  if (!url) return null;

  // Direct video ID (numeric only)
  const directIdPattern = /^\d+$/;
  if (directIdPattern.test(url.trim())) {
    return url.trim();
  }

  // vimeo.com/VIDEO_ID
  const standardPattern = /vimeo\.com\/(\d+)/;
  const standardMatch = url.match(standardPattern);
  if (standardMatch) return standardMatch[1] || null;

  // player.vimeo.com/video/VIDEO_ID
  const playerPattern = /player\.vimeo\.com\/video\/(\d+)/;
  const playerMatch = url.match(playerPattern);
  if (playerMatch) return playerMatch[1] || null;

  // vimeo.com/channels/CHANNEL/VIDEO_ID
  const channelPattern = /vimeo\.com\/channels\/[^/]+\/(\d+)/;
  const channelMatch = url.match(channelPattern);
  if (channelMatch) return channelMatch[1] || null;

  // vimeo.com/groups/GROUP/videos/VIDEO_ID
  const groupPattern = /vimeo\.com\/groups\/[^/]+\/videos\/(\d+)/;
  const groupMatch = url.match(groupPattern);
  if (groupMatch) return groupMatch[1] || null;

  return null;
}

/**
 * Generate Vimeo thumbnail URL from video ID
 * Note: Vimeo requires an API call to get the actual thumbnail
 * This is a placeholder that returns the embed URL for preview
 */
export function getVimeoThumbnail(videoId: string): string {
  // Vimeo doesn't have a simple thumbnail URL pattern like YouTube
  // We'll use the Vimeo oEmbed API endpoint to get thumbnail info
  // For now, return a placeholder or the embed preview
  return `https://vimeo.com/${videoId}`;
}

/**
 * Generate Vimeo embed URL with parameters
 */
export function getVimeoEmbedUrl(
  videoId: string,
  options: {
    autoplay?: boolean;
    loop?: boolean;
    muted?: boolean;
    controls?: boolean;
    title?: boolean;
    byline?: boolean;
    portrait?: boolean;
    color?: string;
    dnt?: boolean;
  } = {},
): string {
  const params = new URLSearchParams();

  if (options.autoplay) params.append('autoplay', '1');
  if (options.loop) params.append('loop', '1');
  if (options.muted) params.append('muted', '1');
  if (options.controls === false) params.append('controls', '0');
  if (options.title === false) params.append('title', '0');
  if (options.byline === false) params.append('byline', '0');
  if (options.portrait === false) params.append('portrait', '0');
  if (options.color) params.append('color', options.color);
  if (options.dnt) params.append('dnt', '1');

  const queryString = params.toString();
  return `https://player.vimeo.com/video/${videoId}${queryString ? `?${queryString}` : ''}`;
}
