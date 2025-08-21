import { Badge } from "@/components/ui/badge";

export const getStatusBadge = (state?: string) => {
  switch (state) {
    case 'draft':
      return <Badge variant="secondary" className="text-xs">Draft</Badge>;
    case 'open':
      return <Badge variant="destructive" className="text-xs">Action Required</Badge>;
    case 'posted':
      return <Badge variant="secondary" className="text-xs">Awaiting Approval</Badge>;
    case 'sent':
      return <Badge variant="default" className="text-xs">Sent for Payment</Badge>;
    case 'paid':
      return <Badge variant="default" className="text-xs">Paid</Badge>;
    default:
      return <Badge variant="outline" className="text-xs">Unknown</Badge>;
  }
};
