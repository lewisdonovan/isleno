import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { BoardDetails } from '@isleno/types/monday'
import { fetchBoardDetails } from '@/lib/monday/services'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

interface BoardDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function BoardDetailPage({ params }: BoardDetailPageProps) {
  const { id } = await params;
  let boardData: BoardDetails | null = null;

  try {
    // Get session from cookies
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('monday_session');
    
    if (!sessionCookie) {
      redirect('/auth/login');
    }

    const session = JSON.parse(sessionCookie.value);
    
    // Check if session is expired
    if (Date.now() > session.expiresAt) {
      redirect('/auth/login');
    }

    boardData = await fetchBoardDetails(session, id);
  } catch (err) {
    console.error('Error fetching board details:', err);
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Link href="/boards">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Boards
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Board Details</h1>
              <p className="text-muted-foreground">
                Board ID: {id}
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Board Data</CardTitle>
              <CardDescription>
                Complete board information from Monday.com API including items
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center p-8 text-destructive">
                Failed to load board details
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link href="/boards">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Boards
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Board Details</h1>
            <p className="text-muted-foreground">
              Board ID: {id}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Board Data</CardTitle>
            <CardDescription>
              Complete board information from Monday.com API including items
            </CardDescription>
          </CardHeader>
          <CardContent>
            {boardData ? (
              <div className="space-y-4">
                <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm max-h-[65vh]">
                  {JSON.stringify(boardData, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="text-center p-8 text-muted-foreground">
                No board data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 