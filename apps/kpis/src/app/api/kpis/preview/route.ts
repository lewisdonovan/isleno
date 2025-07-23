import { NextRequest, NextResponse } from 'next/server';
import { getTransformFunction } from '@isleno/utils';
import { mondayGraphQLPaginatedWithTemplate } from '@isleno/monday-client';
import { validateSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  // Session-based auth (Monday login)
  const authResult = validateSession(request);
  if (!authResult.success || !authResult.session) {
    return NextResponse.json({ error: authResult.error || 'Unauthorized' }, { status: authResult.status || 401 });
  }

  try {
    const body = await request.json();
    const { graphql_query, transform_function, notes, date = new Date().toISOString().split('T')[0] } = body;

    if (!graphql_query) {
      return NextResponse.json({ error: 'graphql_query is required' }, { status: 400 });
    }

    // 1. Run the Monday GraphQL query
    let rawData: any = null;
    try {
      const usesItemsPage = graphql_query.includes('items_page');
      if (usesItemsPage) {
        rawData = await mondayGraphQLPaginatedWithTemplate(
          graphql_query,
          date,
          undefined,
          { pageSize: 500, delayBetweenPages: 100, maxPages: 50 }
        );
      } else {
        const { mondayGraphQLWithTemplate } = await import('@isleno/monday-client');
        rawData = await mondayGraphQLWithTemplate(graphql_query, date);
      }
    } catch (mondayError) {
      return NextResponse.json({ error: `Monday.com API error: ${(mondayError as Error).message}` }, { status: 500 });
    }

    // 2. Run the transform function if provided
    let transformOutput: number | null = null;
    if (transform_function) {
      // Build a config object matching the kpi_snapshot_configs Row type
      const config = {
        created_at: null,
        created_by: null,
        graphql_query,
        id: '',
        kpi_id: null,
        notes: notes || null,
        source_board_ids: null,
        transform_function,
        updated_at: null,
        updated_by: null,
      };
      const transformFn = getTransformFunction(transform_function);
      if (!transformFn) {
        return NextResponse.json({ error: `Missing transform function: ${transform_function}` }, { status: 400 });
      }
      try {
        transformOutput = await transformFn({ rawData, config, date });
      } catch (transformError) {
        return NextResponse.json({ error: `Transform function failed: ${(transformError as Error).message}` }, { status: 500 });
      }
    }

    return NextResponse.json({ rawData, transformOutput }, { status: 200 });
  } catch (error) {
    console.error('Error in kpis/preview route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 