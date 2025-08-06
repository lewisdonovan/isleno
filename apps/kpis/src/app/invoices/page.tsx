import InvoiceClientPage from "./client-page";
import { getLocaleFromCookies, t } from "@/lib/locale";

export default async function InvoicesPage() {
  const locale = await getLocaleFromCookies();

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">{t(locale, 'invoices', 'title')}</h1>
      <InvoiceClientPage />
    </div>
  );
} 