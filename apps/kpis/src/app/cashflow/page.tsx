import CashflowDashboard from "@/components/CashflowDashboard";
import { getLocaleFromCookies, t } from "@/lib/locale";

export default async function CashflowPage() {
  const locale = await getLocaleFromCookies();

  return (
    <div className="p-6 space-y-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{t(locale, 'pages', 'cashflow', 'title')}</h1>
        <p className="text-muted-foreground">
          {t(locale, 'pages', 'cashflow', 'description')}
        </p>
      </div>
      <CashflowDashboard />
    </div>
  );
} 