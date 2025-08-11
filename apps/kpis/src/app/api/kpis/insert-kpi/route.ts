import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { Database } from "@isleno/types";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

interface SnapshotBody {
  kpi_key: string;
  snapshot_date: string;
  snapshot_data?: Database["public"]["Tables"]["snapshots"]["Insert"]["snapshot_data"];
  numeric_value?: number | null;
  date_value?: string | null;
  text_value?: string | null;
  location?: Database["public"]["Enums"]["location"] | null;
  closer_monday_id?: string | null;
  frequency?: Database["public"]["Enums"]["kpi_target_frequency"] | null;
}

type SnapshotInsert = {
  kpi_id: string;
  snapshot_date: string;
  frequency: Database["public"]["Enums"]["kpi_target_frequency"];
  snapshot_data?: Database["public"]["Tables"]["snapshots"]["Insert"]["snapshot_data"];
  numeric_value?: number;
  date_value?: string;
  text_value?: string;
};

type SnapshotAttributeInsert = {
  snapshot_id: string;
  kpi_id: string;
  snapshot_attribute: string;
  snapshot_attribute_value: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SnapshotBody;
    const { kpi_key, snapshot_date, snapshot_data, numeric_value, date_value, text_value, location, closer_monday_id, frequency: bodyFrequency } = body;

    if (!kpi_key || !snapshot_date) {
      return NextResponse.json({ success: false, message: "Faltan parámetros obligatorios" }, { status: 400, headers: corsHeaders });
    }

    if (location != null && closer_monday_id != null) {
      return NextResponse.json({ success: false, message: "Solo se permite un atributo: location o closer_monday_id" }, { status: 400, headers: corsHeaders });
    }

    const supabase = await supabaseServer();
    const { data: kpiData, error: kpiError } = await supabase.from("kpis").select("kpi_id").eq("kpi_key", kpi_key).single();

    if (kpiError || !kpiData) {
      return NextResponse.json({ success: false, message: "kpi_key no encontrado" }, { status: 404, headers: corsHeaders });
    }

    const snapshotRow: SnapshotInsert = { kpi_id: kpiData.kpi_id, snapshot_date, frequency: bodyFrequency ?? "daily" };

    if (snapshot_data != null) snapshotRow.snapshot_data = snapshot_data;
    if (numeric_value != null) snapshotRow.numeric_value = numeric_value;
    if (date_value != null) snapshotRow.date_value = date_value;
    if (text_value != null) snapshotRow.text_value = text_value;

    const { data: insertSnap, error: insertSnapError } = await supabase.from("snapshots").insert(snapshotRow).select("snapshot_id").single();

    if (insertSnapError) {
      return NextResponse.json({ success: false, message: insertSnapError.message }, { status: 500, headers: corsHeaders });
    }

    const attributes: SnapshotAttributeInsert[] = [];

    if (location != null) {
      attributes.push({ snapshot_id: insertSnap.snapshot_id, kpi_id: kpiData.kpi_id, snapshot_attribute: "location", snapshot_attribute_value: location });
    }

    if (closer_monday_id != null) {
      attributes.push({ snapshot_id: insertSnap.snapshot_id, kpi_id: kpiData.kpi_id, snapshot_attribute: "closer_monday_id", snapshot_attribute_value: closer_monday_id });
    }

    if (attributes.length > 0) {
      const { error: attrError } = await supabase.from("snapshot_attributes").insert(attributes);
      if (attrError) {
        return NextResponse.json({ success: false, message: attrError.message }, { status: 500, headers: corsHeaders });
      }
    }

    return NextResponse.json({ success: true, message: "Snapshot y atributos creados exitosamente", snapshot_id: insertSnap.snapshot_id }, { status: 201, headers: corsHeaders });
  } catch (err) {
    console.error("insert-kpi error", err);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500, headers: corsHeaders });
  }
}
