import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const kpiIds = searchParams.get('kpiIds');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!kpiIds || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required parameters: kpiIds, startDate, endDate' },
        { status: 400 }
      );
    }

    const kpiIdsArray = kpiIds.split(',');

    const { data: snapshotsData, error: snapshotsError } = await supabaseServer
      .from("snapshots")
      .select("*")
      .in("kpi_id", kpiIdsArray)
      .gte("snapshot_date", startDate)
      .lte("snapshot_date", endDate)
      .order("snapshot_date", { ascending: false });

    if (snapshotsError) {
      console.error("Error fetching snapshots:", snapshotsError);
      return NextResponse.json(
        { error: snapshotsError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: snapshotsData || [] });
  } catch (error) {
    console.error("Error in snapshots API:", error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 