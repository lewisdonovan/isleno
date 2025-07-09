"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BoardTable } from '@/components/BoardTable'
import { useBoards } from '@/hooks/useBoards'
import { BoardsDemo } from '@/components/BoardsDemo'

export default function BoardsPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const { boards, error, isLoading, hasNextPage, hasPrevPage } = useBoards(currentPage, 20)

  const handleNextPage = () => {
    if (hasNextPage) {
      setCurrentPage(prev => prev + 1)
    }
  }

  const handlePrevPage = () => {
    if (hasPrevPage) {
      setCurrentPage(prev => prev - 1)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Monday.com Boards</h1>
          <p className="text-muted-foreground">
            Browse and view your Monday.com boards
          </p>
        </div>

        <BoardsDemo />

        <Card>
          <CardHeader>
            <CardTitle>All Boards</CardTitle>
            <CardDescription>
              Click on a board name to view its details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BoardTable
              boards={boards}
              loading={isLoading}
              error={error ? 'Failed to load boards' : null}
              currentPage={currentPage}
              hasNextPage={hasNextPage}
              hasPrevPage={hasPrevPage}
              onNextPage={handleNextPage}
              onPrevPage={handlePrevPage}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 