import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { Database } from "@isleno/types";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        const kpiIds     = searchParams.get("kpiIds");
        const startDate  = searchParams.get("startDate");
        const endDate    = searchParams.get("endDate");
        const frequency  = (searchParams.get("frequency") || "daily") as Database["public"]["Enums"]["kpi_target_frequency"];
        const byCloser   = searchParams.get("byCloser");
        const byLocation = searchParams.get("byLocation");

        if (!kpiIds || !startDate || !endDate)
            return NextResponse.json(
                { error: "Missing required parameters: kpiIds, startDate, endDate" },
                { status: 400 }
            );

        if (byCloser && byLocation)
            return NextResponse.json(
                { error: "Use only one filter at a time: byCloser or byLocation" },
                { status: 400 }
            );

        const kpiIdsArray = kpiIds.split(",");
        const supabase = await supabaseServer();

        const selectFields = byCloser
            ? "*, snapshot_attributes(snapshot_attribute,snapshot_attribute_value)"
            : "*, snapshot_attributes(snapshot_attribute,snapshot_attribute_value)";

        let query = supabase
            .from("snapshots")
            .select(selectFields)
            .filter("kpi_id", "in", `(${kpiIdsArray.join(",")})`)
            .gte("snapshot_date", startDate)
            .lte("snapshot_date", endDate)
            .eq("frequency", frequency)
            .order("snapshot_date", { ascending: false });

        if (byCloser) {
            query = query
                .not("snapshot_attributes", "is", "null")
                .eq("snapshot_attributes.snapshot_attribute", "closer_monday_id");
        } else if (byLocation) {
            query = query
                .not("snapshot_attributes", "is", "null")
                .eq("snapshot_attributes.snapshot_attribute", "location");
        } else {
            query = query.is("snapshot_attributes", null);
        }

        const { data: snapshots, error: snapshotsError } = await query;
        if (snapshotsError)
            return NextResponse.json({ error: snapshotsError.message }, { status: 500 });

        if (byCloser) {
            const closerIds = [
                ...new Set(
                    (snapshots ?? [])
                        .flatMap((s: any) => s.snapshot_attributes ?? [])
                        .map((a: any) => a.snapshot_attribute_value)
                        .filter(Boolean)
                ),
            ];

            if (closerIds.length) {
                const { data: profiles, error: profilesError } = await supabase
                    .from("profiles")
                    .select("monday_user_id, full_name")
                    .in("monday_user_id", closerIds);

                if (profilesError)
                    return NextResponse.json({ error: profilesError.message }, { status: 500 });

                const nameMap: Record<string, string> = {};
                (profiles ?? []).forEach((p: any) => {
                    nameMap[p.monday_user_id] = p.full_name;
                });

                snapshots.forEach((s: any) => {
                    const attr = (s.snapshot_attributes ?? [])[0];
                    s.closer_name = attr ? nameMap[attr.snapshot_attribute_value] || null : null;
                });
            }
        }

        return NextResponse.json({ data: snapshots ?? [] });
    } catch (err: any) {
        return NextResponse.json(
            { error: `Internal server error: ${err.message ?? err}` },
            { status: 500 }
        );
    }
}