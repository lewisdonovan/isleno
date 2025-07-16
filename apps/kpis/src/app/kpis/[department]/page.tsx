import { supabaseServer } from "@/lib/supabaseServer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FolderOpen } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{
    department: string;
  }>;
}

export default async function DepartmentPage({ params }: PageProps) {
  const { department: departmentKey } = await params;

  // First, get the department to validate it exists and get its ID
  const { data: department, error: departmentError } = await supabaseServer
    .from("departments")
    .select("department_id, department_name, description")
    .eq("key", departmentKey)
    .single();

  if (departmentError || !department) {
    notFound();
  }

  // Then get all KPI categories for this department
  const { data: categories, error: categoriesError } = await supabaseServer
    .from("kpi_categories")
    .select("category_id, category_name, description, kpi_category_key")
    .eq("department_id", department.department_id)
    .order("category_name");

  if (categoriesError) {
    console.error("Error fetching categories:", categoriesError);
    return (
      <div className="p-6">
        <div className="text-red-500">Error loading categories: {categoriesError.message}</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/kpis">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Departments
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
            <span>KPI Categories</span>
          </CardTitle>
          <CardDescription>
            Select a category to view its KPIs
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
                      View KPIs
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No KPI categories found for this department.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 