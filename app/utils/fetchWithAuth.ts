/**
 * Wrapper around fetch that redirects to login on 401.
 * Use in dashboard pages instead of raw fetch().
 */
export async function fetchWithAuth(url: string, options?: RequestInit): Promise<Response> {
  const response = await fetch(url, options);
  if (response.status === 401) {
    // Session expired — redirect to login
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new Error('Session expired. Redirecting to login...');
  }
  return response;
}
