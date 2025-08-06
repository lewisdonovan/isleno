'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MondayDisplayService } from '@/lib/services/mondayDisplayService';

interface Board {
  id: string;
  name: string;
}

export function MondayDataDisplay() {
  const t = useTranslations('MondayData');
  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBoards = async () => {
      try {
        const boards = await MondayDisplayService.fetchBoards(5);
        setBoards(boards);
      } catch (err) {
        setError(err instanceof Error ? err.message : (t('fetchError') || String(err)));
      } finally {
        setIsLoading(false);
      }
    };

    fetchBoards();
  }, [t]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : boards.length > 0 ? (
          <ul>
            {boards.map((board) => (
              <li key={board.id}>{board.name}</li>
            ))}
          </ul>
        ) : (
          <p>{t('noData')}</p>
        )}
      </CardContent>
    </Card>
  );
} 