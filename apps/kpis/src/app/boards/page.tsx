"use client"

import { useEffect, useState } from 'react';
import { BoardTable } from '@/components/BoardTable';
import { BoardsDemo } from '@/components/BoardsDemo';
import { Board } from '@isleno/types/monday';
import { useTranslations } from 'next-intl';

export default function BoardsPage() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);
  const t = useTranslations('pages.boards');

  useEffect(() => {
    fetchBoards(currentPage);
  }, [currentPage]);

  const fetchBoards = async (page: number) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/integrations/monday/boards?page=${page}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch boards');
      }
      
      const data = await response.json();
      setBoards(data.data?.boards ?? []);
      setHasNextPage(data.data?.hasNextPage ?? false);
      setHasPrevPage(data.data?.hasPrevPage ?? false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('description')}
          </p>
        </div>

        <BoardsDemo />

        <BoardTable
          boards={boards}
          loading={loading}
          error={error}
          currentPage={currentPage}
          hasNextPage={hasNextPage}
          hasPrevPage={hasPrevPage}
          onNextPage={() => setCurrentPage(prev => prev + 1)}
          onPrevPage={() => setCurrentPage(prev => prev - 1)}
        />
      </div>
    </div>
  );
} 