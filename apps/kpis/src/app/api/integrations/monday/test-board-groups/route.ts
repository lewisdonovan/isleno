import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { getMondayToken } from '@/lib/auth';
import { mondayRequest } from '@/lib/auth';
import { getMondayBoardId } from '@/lib/constants/mondayBoards';

export async function GET(request: NextRequest) {
  try {
    // Validate Supabase session
    const supabase = await supabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No authenticated user' },
        { status: 401 }
      );
    }

    // Get Monday token for this user
    const mondayToken = await getMondayToken(user.id);
    if (!mondayToken) {
      return NextResponse.json(
        { error: 'No Monday.com token available' },
        { status: 401 }
      );
    }

    // Test board access and list groups
    const token = mondayToken;
    const boardId = getMondayBoardId('PROPERTY_DATABASE');
    
    const testQuery = `
      query GetBoardGroups($boardId: ID!) {
        boards(ids: [$boardId]) {
          id
          name
          groups {
            id
            title
            color
          }
        }
      }
    `;

    try {
      const data = await mondayRequest<{ boards: any[] }>(
        token,
        testQuery,
        { boardId },
        user.id
      );
      
      return NextResponse.json({
        success: true,
        boardId,
        board: data.boards?.[0],
        groups: data.boards?.[0]?.groups || [],
        message: 'Board groups retrieved successfully'
      });
    } catch (error) {
      console.error('Board groups test failed:', error);
      return NextResponse.json(
        { 
          error: 'Failed to retrieve board groups',
          details: error instanceof Error ? error.message : 'Unknown error',
          boardId
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error testing board groups:', error);
    return NextResponse.json(
      { error: 'Failed to test board groups' },
      { status: 500 }
    );
  }
} 