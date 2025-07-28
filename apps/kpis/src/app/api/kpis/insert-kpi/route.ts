import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

interface SnapshotBody {
  kpi_key: string;
  snapshot_date: string;
  snapshot_data?: any | null;
  numeric_value?: number | null;
  date_value?: string | null;
  text_value?: string | null;
  location: string;
  closer_monday_id: string;
  closer_name: string;
}

type SnapshotInsert = {
  kpi_id: string;
  snapshot_date: string;
  location: string;
  closer_monday_id: string;
  closer_name: string;
  snapshot_data?: any;
  numeric_value?: number;
  date_value?: string;
  text_value?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SnapshotBody;

    const {
      kpi_key,
      snapshot_date,
      snapshot_data,
      numeric_value,
      date_value,
      text_value,
      location,
      closer_monday_id,
      closer_name,
    } = body;

    const hasContent =
      snapshot_data != null ||
      numeric_value != null ||
      date_value != null ||
      text_value != null;

    if (
      !kpi_key ||
      !snapshot_date ||
      !location ||
      !closer_monday_id ||
      !closer_name ||
      !hasContent
    ) {
      return NextResponse.json(
        { success: false, message: "Faltan parámetros obligatorios" },
        { status: 400 }
      );
    }

    const { data: kpiData, error: kpiError } = await supabaseServer
      .from("kpis")
      .select("kpi_id")
      .eq("kpi_key", kpi_key)
      .single();

    if (kpiError || !kpiData) {
      return NextResponse.json(
        { success: false, message: "kpi_key no encontrado" },
        { status: 404 }
      );
    }

    const snapshotRow: SnapshotInsert = {
      kpi_id: kpiData.kpi_id,
      snapshot_date,
      location,
      closer_monday_id,
      closer_name,
    };

    if (snapshot_data != null) snapshotRow.snapshot_data = snapshot_data;
    if (numeric_value != null) snapshotRow.numeric_value = numeric_value;
    if (date_value != null) snapshotRow.date_value = date_value;
    if (text_value != null) snapshotRow.text_value = text_value;

    const { data: insertData, error } = await supabaseServer
      .from("snapshots")
      .insert(snapshotRow)
      .select("snapshot_id")
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Snapshot successfully created",
        snapshot_id: insertData.snapshot_id,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
