import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Board } from '@/types/monday';

interface BoardTableProps {
  boards: Board[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  onNextPage: () => void;
  onPrevPage: () => void;
}

export function BoardTable({ boards, loading, error, currentPage, hasNextPage, hasPrevPage, onNextPage, onPrevPage }: BoardTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <span className="ml-2">Loading boards...</span>
      </div>
    );
  }
  if (error) {
    return <div className="text-center p-8 text-destructive">{error}</div>;
  }
  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>ID</TableHead>
            <TableHead>State</TableHead>
            <TableHead>Type</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {boards.map((board) => (
            <TableRow key={board.id}>
              <TableCell>
                <Link 
                  href={`/boards/${board.id}`}
                  className="text-primary hover:text-primary/80 hover:underline font-medium"
                >
                  {board.name}
                </Link>
              </TableCell>
              <TableCell className="font-mono text-sm">
                {board.id}
              </TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  board.state === 'active' 
                    ? 'bg-teal-100 text-teal-800' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {board.state || 'Unknown'}
                </span>
              </TableCell>
              <TableCell className="text-sm">
                {board.board_kind || 'Standard'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Page {currentPage}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onPrevPage}
            disabled={!hasPrevPage}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onNextPage}
            disabled={!hasNextPage}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
} 