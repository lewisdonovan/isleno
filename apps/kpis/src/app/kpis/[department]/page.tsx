import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FolderOpen } from "lucide-react";
import Link from "next/link";
import { DepartmentProtectedRoute } from "@/components/RouteProtection";
import { getLocaleFromCookies, t } from "@/lib/locale";

interface PageProps {
  params: Promise<{
    department: string;
  }>;
}

export default async function DepartmentPage({ params }: PageProps) {
  const { department: departmentKey } = await params;
  const locale = await getLocaleFromCookies();

  // First, get the department to validate it exists and get its ID
  const supabase = await supabaseServer();
  const { data: department, error: departmentError } = await supabase
    .from("departments")
    .select("department_id, department_name, description")
    .eq("key", departmentKey)
    .single();

  if (departmentError || !department) {
    notFound();
  }

  // Then get all KPI categories for this department
  const { data: categories, error: categoriesError } = await supabase
    .from("kpi_categories")
    .select("category_id, category_name, description, kpi_category_key")
    .eq("department_id", department.department_id)
    .order("category_name");

  if (categoriesError) {
    console.error("Error fetching categories:", categoriesError);
    return (
      <div className="p-6">
        <div className="text-red-500">{t(locale, 'kpis', 'errorLoadingCategories').replace('{message}', categoriesError.message)}</div>
      </div>
    );
  }

  return (
    <DepartmentProtectedRoute departmentId={department.department_id}>
      <div className="p-6 space-y-6">
        <div className="flex items-center space-x-4">
          <Link href="/kpis">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t(locale, 'kpis', 'backToDepartments')}
            </Button>
          </Link>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">{department.department_name}</h1>
            {department.description && (
              <p className="text-muted-foreground">{department.description}</p>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FolderOpen className="h-5 w-5" />
              <span>{t(locale, 'kpis', 'kpiCategories')}</span>
            </CardTitle>
            <CardDescription>
              {t(locale, 'kpis', 'selectCategoryDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {categories && categories.length > 0 ? (
              <div className="space-y-3">
                {categories.map((category) => (
                  <div
                    key={category.category_id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <h3 className="font-medium">{category.category_name}</h3>
                      {category.description && (
                        <p className="text-sm text-muted-foreground">{category.description}</p>
                      )}
                    </div>
                    <Link href={`/kpis/${departmentKey}/${category.kpi_category_key}`}>
                      <Button size="sm">
                        {t(locale, 'kpis', 'viewKPIs')}
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p>{t(locale, 'kpis', 'noCategoriesFound')}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DepartmentProtectedRoute>
  );
} 