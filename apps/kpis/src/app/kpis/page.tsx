import { supabaseServer } from "@/lib/supabaseServer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, Settings, Calendar, Building2 } from "lucide-react";
import Link from "next/link";
import { getLocaleFromCookies, t } from "@/lib/locale";

export default async function KpisPage() {
  const locale = await getLocaleFromCookies();
  
  // Fetch all departments from the database
  const supabase = await supabaseServer();
  const { data: departments, error } = await supabase
    .from("departments")
    .select("department_id, department_name, description, key")
    .order("department_name");

  if (error) {
    console.error("Error fetching departments:", error);
    return (
      <div className="p-6">
        <div className="text-red-500">{t(locale, 'kpis', 'errorLoadingDepartments').replace('{message}', error.message)}</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{t(locale, 'kpis', 'dashboard')}</h1>
        <p className="text-muted-foreground">
          {t(locale, 'kpis', 'description')}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>{t(locale, 'kpis', 'liveKPIs')}</span>
            </CardTitle>
            <CardDescription>
              {t(locale, 'kpis', 'liveKPIsDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/kpis/live">
              <Button className="w-full">
                <TrendingUp className="h-4 w-4 mr-2" />
                {t(locale, 'kpis', 'viewLiveKPIs')}
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>{t(locale, 'kpis', 'historicalData')}</span>
            </CardTitle>
            <CardDescription>
              {t(locale, 'kpis', 'historicalDataDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline" disabled>
              <Calendar className="h-4 w-4 mr-2" />
              {t(locale, 'kpis', 'comingSoon')}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>{t(locale, 'kpis', 'kpiManagement')}</span>
            </CardTitle>
            <CardDescription>
              {t(locale, 'kpis', 'kpiManagementDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline" disabled>
              <Settings className="h-4 w-4 mr-2" />
              {t(locale, 'kpis', 'comingSoon')}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="h-5 w-5" />
            <span>{t(locale, 'kpis', 'departments')}</span>
          </CardTitle>
          <CardDescription>
            {t(locale, 'kpis', 'departmentsDesc')}
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
                      {t(locale, 'kpis', 'viewKPIs')}
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t(locale, 'kpis', 'noDepartmentsFound')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>{t(locale, 'kpis', 'quickStats')}</CardTitle>
            <CardDescription>
              {t(locale, 'kpis', 'quickStatsDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">{t(locale, 'kpis', 'departmentsCount')}</p>
                <p className="text-2xl font-bold">{departments?.length || 0}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">{t(locale, 'kpis', 'categories')}</p>
                <p className="text-2xl font-bold">--</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">{t(locale, 'kpis', 'activeKPIs')}</p>
                <p className="text-2xl font-bold">--</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">{t(locale, 'kpis', 'lastUpdated')}</p>
                <p className="text-2xl font-bold">--</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
