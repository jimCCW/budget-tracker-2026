/**
 * Produces a short human-readable device label (e.g. "Chrome · Windows") from
 * a User-Agent header using simple substring matching — good enough for the
 * Settings > Security session list without pulling in a UA-parsing dependency.
 * @param userAgent - The raw `User-Agent` header recorded at login, if any.
 */
export function describeUserAgent(userAgent?: string | null): string {
  if (!userAgent) return 'Unknown device';

  const browser = userAgent.includes('Edg/')
    ? 'Edge'
    : userAgent.includes('Chrome/')
      ? 'Chrome'
      : userAgent.includes('Firefox/')
        ? 'Firefox'
        : userAgent.includes('Safari/') && !userAgent.includes('Chrome/')
          ? 'Safari'
          : 'Browser';

  const os = userAgent.includes('iPhone')
    ? 'iPhone'
    : userAgent.includes('iPad')
      ? 'iPad'
      : userAgent.includes('Android')
        ? 'Android'
        : userAgent.includes('Mac OS X')
          ? 'Mac'
          : userAgent.includes('Windows')
            ? 'Windows'
            : userAgent.includes('Linux')
              ? 'Linux'
              : null;

  return os ? `${browser} · ${os}` : browser;
}
