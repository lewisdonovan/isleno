import CashflowDashboard from "@/components/CashflowDashboard";

export default function CashflowPage() {
  return (
    <div className="p-6 space-y-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Cashflow & Project Analytics</h1>
        <p className="text-muted-foreground">
          Real-time financial projections and capacity utilization based on project data
        </p>
      </div>
      <CashflowDashboard />
    </div>
  );
} 