import useSWR from 'swr';

export function useCurrentUser() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/monday/me',
    async (url: string) => {
      const res = await fetch(url);
      if (!res.ok) {
        // Don't redirect automatically - let the middleware handle auth
        throw new Error('Failed to fetch user info');
      }
      return res.json();
    },
    { revalidateOnFocus: false }
  );

  return {
    user: data?.data?.me || null,
    error,
    isLoading,
    mutate,
  };
} 