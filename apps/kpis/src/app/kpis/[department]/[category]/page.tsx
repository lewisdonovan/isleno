import { supabaseServer } from "@/lib/supabaseServer";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import KpiCategoryClient from "@/components/KpiCategoryClient";
import type { Database } from "@isleno/types/db/public";
import { getLocaleFromCookies } from "@/lib/locale";

interface PageProps {
  params: Promise<{
    department: string;
    category: string;
  }>;
}

export default async function CategoryPage({ params }: PageProps) {
  const { department: departmentKey, category: categoryKey } = await params;
  const locale = await getLocaleFromCookies();
  const t = (key: string) => {
    const messages = {
      en: {
        backToCategories: "Back to Categories",
        kpiCategory: "KPI Category",
        errorLoadingKPIs: "Error loading KPIs:",
        errorLoadingKPIDetails: "Error loading KPI details:"
      },
      es: {
        backToCategories: "Volver a Categorías",
        kpiCategory: "Categoría de KPI",
        errorLoadingKPIs: "Error al cargar KPIs:",
        errorLoadingKPIDetails: "Error al cargar detalles de KPI:"
      }
    };
    return messages[locale as keyof typeof messages]?.[key as keyof typeof messages.en] || key;
  };

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
        <div className="text-red-500">{t('errorLoadingKPIs')} {kpiRelationsError.message}</div>
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
          <div className="text-red-500">{t('errorLoadingKPIDetails')} {kpisError.message}</div>
        </div>
      );
    }
    kpis = kpisData || [];
    console.log("Fetched KPIs:", kpis);
  }

  //TODO: Define the order of KPIs in this category in DB and fetch it
  const kpiSorting = [
    "collabs_meetings",
    "collabs_leads",
    "collabs_qualified_leads",
    "collabs_total_calls",
    "collabs_meetings",
    "collabs_viewings",
    "collabs_qualified_viewings",
    "collabs_negotiations",
    "collabs_arras_signed_by_seller",

    "calls_collabs",
    "collab_meetings",
    "leads",
    "qualified_leads",
    "calls_total",
    "viewings",
    "qualified_viewings",
    "negotiations",
    "arras_signed",

    "idealista_channel_leads",
    "idealista_channel_qualified_leads",
    "idealista_channel_calls",
    "idealista_channel_qualified_calls",
    "idealista_channel_viewings",
    "idealista_channel_qualified_viewings",
    "idealista_channel_negotiations",
    "idealista_channel_arras_signed",
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Link href={`/kpis/${departmentKey}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('backToCategories')}
          </Button>
        </Link>
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{category.category_name}</h1>
          <p className="text-muted-foreground">
            {department.department_name} • {t('kpiCategory')}
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
        kpiOrder={kpiSorting}
      />
    </div>
  );
} 