import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getTransformFunction } from '@isleno/utils';
import { mondayGraphQLPaginatedWithTemplate } from '@isleno/monday-client';
import { validateApiKey } from '@/lib/auth';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ExecuteSnapshotRequest {
  kpi_id: string;
  date?: string; // Optional: defaults to today
}

interface ExecuteSnapshotResponse {
  value: number;
  snapshot_id: string;
}

/**
 * POST /api/kpis/snapshots/execute
 * Executes a KPI snapshot for a given KPI and date
 */
export async function POST(request: NextRequest) {
  // API key authentication
  const auth = validateApiKey(request);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status ?? 401 });
  }

  try {
    const body: ExecuteSnapshotRequest = await request.json();
    const { kpi_id, date = new Date().toISOString().split('T')[0] } = body;

    if (!kpi_id) {
      return NextResponse.json(
        { error: 'kpi_id is required' },
        { status: 400 }
      );
    }

    // 1. Fetch config from kpi_snapshot_configs
    const { data: config, error: configError } = await supabase
      .from('kpi_snapshot_configs')
      .select('*')
      .eq('kpi_id', kpi_id)
      .single();

    if (configError || !config) {
      return NextResponse.json(
        { error: `No snapshot config found for KPI: ${kpi_id}` },
        { status: 404 }
      );
    }

    // 2. Pull Monday data using the GraphQL query
    let rawData: any = null;
    
    if (config.graphql_query) {
      try {
        console.log({config})
        
        // Check if the query uses items_page for pagination
        const usesItemsPage = config.graphql_query.includes('items_page');
        
        if (usesItemsPage) {
          // Use paginated function for items_page queries
          rawData = await mondayGraphQLPaginatedWithTemplate(
            config.graphql_query, 
            date,
            undefined, // variables
            {
              pageSize: 500, // Maximum page size
              delayBetweenPages: 100, // 100ms delay between requests
              maxPages: 50 // Limit to 50 pages to prevent runaway queries
            }
          );
        } else {
          // Use regular function for non-paginated queries
          const { mondayGraphQLWithTemplate } = await import('@isleno/monday-client');
          rawData = await mondayGraphQLWithTemplate(config.graphql_query, date);
        }
      } catch (mondayError) {
        console.error('Monday.com API error:', mondayError);
        return NextResponse.json(
          { error: `Monday.com API error: ${(mondayError as Error).message}` },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'No GraphQL query configured for this KPI' },
        { status: 400 }
      );
    }

    // 3. Transform or extract value
    let value: number;

    if (config.transform_function) {
      const transformFn = getTransformFunction(config.transform_function);
      
      if (!transformFn) {
        return NextResponse.json(
          { error: `Missing transform function: ${config.transform_function}` },
          { status: 400 }
        );
      }

      try {
        value = await transformFn({ rawData, config, date });
      } catch (transformError) {
        console.error('Transform function failed:', transformError);
        
        // Log the failure
        await logFailure(kpi_id, date, (transformError as Error).message);
        
        return NextResponse.json(
          { error: `Snapshot failed: ${(transformError as Error).message}` },
          { status: 500 }
        );
      }
    } else {
      // Extract value directly from raw data
      value = extractValueDirectly(rawData);
    }

    // 4. Write to snapshots table
    const { data: snapshot, error: snapshotError } = await supabase
      .from('snapshots')
      .insert({
        kpi_id,
        snapshot_date: date,
        numeric_value: value,
        snapshot_data: rawData, // Store the raw data for debugging
      })
      .select('snapshot_id')
      .single();

    if (snapshotError) {
      console.error('Failed to save snapshot:', snapshotError);
      return NextResponse.json(
        { error: 'Failed to save snapshot' },
        { status: 500 }
      );
    }

    // 5. Return success response
    const response: ExecuteSnapshotResponse = {
      value,
      snapshot_id: snapshot.snapshot_id,
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Unexpected error in snapshot execution:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/kpis/snapshots/execute
 * Fetches all KPI snapshot configs
 */
export async function GET(request: NextRequest) {
  // API key authentication
  const auth = validateApiKey(request);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status ?? 401 });
  }

  try {
    const { data, error } = await supabase
      .from('kpi_snapshot_configs')
      .select('*');

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch snapshot configs', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ configs: data }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * Extract value directly from raw data when no transform function is specified
 */
function extractValueDirectly(rawData: any): number {
  // Default implementation - could be enhanced based on your needs
  if (rawData?.boards) {
    return rawData.boards.length;
  }
  return 0;
}

/**
 * Log snapshot failures for debugging
 */
async function logFailure(kpi_id: string, date: string, errorMessage: string) {
  try {
    console.error(`Snapshot failed for KPI ${kpi_id} on ${date}:`, errorMessage);
    
    // Optionally store in a failures table
    // await supabase.from('snapshot_failures').insert({
    //   kpi_id,
    //   snapshot_date: date,
    //   error_message: errorMessage,
    //   created_at: new Date().toISOString(),
    // });
  } catch (logError) {
    console.error('Failed to log snapshot failure:', logError);
  }
} 
