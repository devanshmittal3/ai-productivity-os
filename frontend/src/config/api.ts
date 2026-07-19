export function resolveApiBaseUrl(configuredUrl?: string): string {
  if (configuredUrl && configuredUrl.trim()) {
    let baseUrl = configuredUrl.replace(/\/$/, '');
    if (!baseUrl.endsWith('/api/v1')) {
      baseUrl = `${baseUrl}/api/v1`;
    }
    return baseUrl;
  }

  if (typeof window !== 'undefined') {
    const currentOrigin = window.location.origin;
    return `${currentOrigin}/api/v1`;
  }

  return 'http://127.0.0.1:8000/api/v1';
}
