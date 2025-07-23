import InvoiceClientPage from "./client-page";
import { getLocaleFromCookies } from "@/lib/locale";

export default async function InvoicesPage() {
  const locale = await getLocaleFromCookies();
  const t = (key: string) => {
    const messages = {
      en: {
        title: "Invoice Approvals"
      },
      es: {
        title: "Aprobaciones de Facturas"
      }
    };
    return messages[locale as keyof typeof messages]?.[key as keyof typeof messages.en] || key;
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{t('title')}</h1>
      <InvoiceClientPage />
    </div>
  );
} 