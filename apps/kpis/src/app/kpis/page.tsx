import { supabaseServer } from "@/lib/supabaseServer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, Settings, Calendar, Building2 } from "lucide-react";
import Link from "next/link";

export default async function KpisPage() {
  // Fetch all departments from the database
  const { data: departments, error } = await supabaseServer
    .from("departments")
    .select("department_id, department_name, description, key")
    .order("department_name");

  if (error) {
    console.error("Error fetching departments:", error);
    return (
      <div className="p-6">
        <div className="text-red-500">Error loading departments: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">KPI Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor and analyze your key performance indicators by department
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Live KPIs</span>
            </CardTitle>
            <CardDescription>
              View real-time KPI data with date range filtering
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/kpis/live">
              <Button className="w-full">
                <TrendingUp className="h-4 w-4 mr-2" />
                View Live KPIs
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Historical Data</span>
            </CardTitle>
            <CardDescription>
              Analyze KPI trends over time with historical data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline" disabled>
              <Calendar className="h-4 w-4 mr-2" />
              Coming Soon
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>KPI Management</span>
            </CardTitle>
            <CardDescription>
              Configure and manage your KPI definitions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline" disabled>
              <Settings className="h-4 w-4 mr-2" />
              Coming Soon
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="h-5 w-5" />
            <span>Departments</span>
          </CardTitle>
          <CardDescription>
            Browse KPIs organized by department
          </CardDescription>
        </CardHeader>
        <CardContent>
          {departments && departments.length > 0 ? (
            <div className="space-y-3">
              {departments.map((department) => (
                <div
                  key={department.department_id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-1">
                    <h3 className="font-medium">{department.department_name}</h3>
                    {department.description && (
                      <p className="text-sm text-muted-foreground">{department.description}</p>
                    )}
                  </div>
                  <Link href={`/kpis/${department.key}`}>
                    <Button size="sm">
                      View KPIs
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No departments found.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
            <CardDescription>
              Overview of your current KPI performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Departments</p>
                <p className="text-2xl font-bold">{departments?.length || 0}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Categories</p>
                <p className="text-2xl font-bold">--</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Active KPIs</p>
                <p className="text-2xl font-bold">--</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                <p className="text-2xl font-bold">--</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
