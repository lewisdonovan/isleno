import useSWR from 'swr';

export function useBoards(page: number, limit: number = 20) {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/monday/boards?page=${page}&limit=${limit}`,
    async (url: string) => {
      const res = await fetch(url);
      if (!res.ok) {
        // Don't redirect automatically - let the middleware handle auth
        throw new Error('Failed to fetch boards');
      }
      return res.json();
    },
    { revalidateOnFocus: false }
  );

  return {
    boards: data?.boards || [],
    error,
    isLoading,
    mutate,
    hasNextPage: data?.boards?.length === limit,
    hasPrevPage: page > 1,
  };
} 