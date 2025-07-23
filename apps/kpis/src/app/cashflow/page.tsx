import CashflowDashboard from "@/components/CashflowDashboard";
import { getLocaleFromCookies } from "@/lib/locale";

export default async function CashflowPage() {
  const locale = await getLocaleFromCookies();
  const t = (key: string) => {
    const messages = {
      en: {
        title: "Cashflow & Project Analytics",
        description: "Real-time financial projections and capacity utilization based on project data"
      },
      es: {
        title: "Flujo de Caja y Análisis de Proyectos",
        description: "Proyecciones financieras en tiempo real y utilización de capacidad basada en datos de proyectos"
      }
    };
    return messages[locale as keyof typeof messages]?.[key as keyof typeof messages.en] || key;
  };

  return (
    <div className="p-6 space-y-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">
          {t('description')}
        </p>
      </div>
      <CashflowDashboard />
    </div>
  );
} 