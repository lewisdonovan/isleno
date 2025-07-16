import { supabaseServer } from "@/lib/supabaseServer";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import KpiCategoryClient from "@/components/KpiCategoryClient";
import type { Database } from "@isleno/types/db/public";

interface PageProps {
  params: Promise<{
    department: string;
    category: string;
  }>;
}

export default async function CategoryPage({ params }: PageProps) {
  const { department: departmentKey, category: categoryKey } = await params;

  // First, get the department to validate it exists
  const { data: department, error: departmentError } = await supabaseServer
    .from("departments")
    .select("*")
    .eq("key", departmentKey)
    .single();

  if (departmentError || !department) {
    notFound();
  }

  // Get the category by kpi_category_key
  const { data: category, error: categoryError } = await supabaseServer
    .from("kpi_categories")
    .select("*")
    .eq("kpi_category_key", categoryKey)
    .eq("department_id", department.department_id)
    .single();

  if (categoryError || !category) {
    notFound();
  }

  // Get all KPIs in this category using the join table
  const { data: kpiRelations, error: kpiRelationsError } = await supabaseServer
    .from("kpi_kpi_categories")
    .select("*")
    .eq("category_id", category.category_id);

  if (kpiRelationsError) {
    console.error("Error fetching KPI relations:", kpiRelationsError);
    return (
      <div className="p-6">
        <div className="text-red-500">Error loading KPIs: {kpiRelationsError.message}</div>
      </div>
    );
  }

  // Get the actual KPI data for all KPIs in this category
  const kpiIds = kpiRelations?.map(relation => relation.kpi_id) || [];
  
  let kpis: Database['public']['Tables']['kpis']['Row'][] = [];
  if (kpiIds.length > 0) {
    const { data: kpisData, error: kpisError } = await supabaseServer
      .from("kpis")
      .select("*")
      .in("kpi_id", kpiIds)
      .eq("is_active", true)
      .order("kpi_name");

    if (kpisError) {
      console.error("Error fetching KPIs:", kpisError);
      return (
        <div className="p-6">
          <div className="text-red-500">Error loading KPI details: {kpisError.message}</div>
        </div>
      );
    }
    kpis = kpisData || [];
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Link href={`/kpis/${departmentKey}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Categories
          </Button>
        </Link>
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{category.category_name}</h1>
          <p className="text-muted-foreground">
            {department.department_name} • KPI Category
          </p>
          {category.description && (
            <p className="text-sm text-muted-foreground">{category.description}</p>
          )}
        </div>
      </div>

      <KpiCategoryClient
        _initialDepartment={department}
        _initialCategory={category}
        initialKpis={kpis}
      />
    </div>
  );
} 