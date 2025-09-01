import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react";
import { useOcrNotifications } from "@/hooks/useOcrNotifications";
import { useTranslations } from "next-intl";

export function OcrRefreshProgress() {
  const { isRunning, progress, result, error, startTime } = useOcrNotifications();
  const t = useTranslations('invoices');

  if (!isRunning && !result && !error) {
    return null;
  }

  const getStatusIcon = () => {
    if (isRunning) {
      return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
    } else if (result) {
      if (result.successful === result.totalInvoices) {
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      } else if (result.successful > 0) {
        return <CheckCircle className="h-4 w-4 text-yellow-500" />;
      } else {
        return <XCircle className="h-4 w-4 text-red-500" />;
      }
    } else if (error) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    return <Clock className="h-4 w-4 text-gray-500" />;
  };

  const getStatusText = () => {
    if (isRunning) {
      return t('ocrRefresh.running');
    } else if (result) {
      if (result.successful === result.totalInvoices) {
        return t('ocrRefresh.complete');
      } else if (result.successful > 0) {
        return t('ocrRefresh.partial');
      } else {
        return t('ocrRefresh.failed');
      }
    } else if (error) {
      return t('ocrRefresh.error');
    }
    return '';
  };

  const getStatusBadge = () => {
    if (isRunning) {
      return <Badge variant="secondary">{t('ocrRefresh.inProgress')}</Badge>;
    } else if (result) {
      if (result.successful === result.totalInvoices) {
        return <Badge variant="default">{t('ocrRefresh.success')}</Badge>;
      } else if (result.successful > 0) {
        return <Badge variant="secondary">{t('ocrRefresh.partialSuccess')}</Badge>;
      } else {
        return <Badge variant="destructive">{t('ocrRefresh.failure')}</Badge>;
      }
    } else if (error) {
      return <Badge variant="destructive">{t('ocrRefresh.error')}</Badge>;
    }
    return null;
  };

  const getDescription = () => {
    if (isRunning && progress) {
      return t('ocrRefresh.progress', { 
        completed: progress.completed, 
        total: progress.total,
        percentage: progress.percentage 
      });
    } else if (result) {
      const duration = Math.round(result.duration / 1000);
      if (result.successful === result.totalInvoices) {
        return t('ocrRefresh.successDescription', { 
          count: result.successful, 
          duration 
        });
      } else if (result.successful > 0) {
        return t('ocrRefresh.partialDescription', { 
          successful: result.successful, 
          total: result.totalInvoices, 
          failed: result.failed,
          duration 
        });
      } else {
        return t('ocrRefresh.failureDescription', { 
          count: result.totalInvoices 
        });
      }
    } else if (error) {
      return t('ocrRefresh.errorDescription', { error });
    }
    return '';
  };

  return (
    <Card className="mb-4 border-l-4 border-l-blue-500">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="font-medium">{getStatusText()}</span>
          </div>
          {getStatusBadge()}
        </div>
        
        <p className="text-sm text-muted-foreground mb-3">
          {getDescription()}
        </p>
        
        {isRunning && progress && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{t('ocrRefresh.progress')}</span>
              <span>{progress.percentage}%</span>
            </div>
            <Progress value={progress.percentage} className="h-2" />
          </div>
        )}
        
        {result && result.failed > 0 && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm">
            <p className="text-red-700 font-medium">{t('ocrRefresh.failedInvoices')}:</p>
            <ul className="mt-1 text-red-600">
              {result.results
                .filter(r => !r.success)
                .slice(0, 3) // Show only first 3 failed invoices
                .map(r => (
                  <li key={r.invoiceId}>
                    {t('ocrRefresh.invoiceId')} {r.invoiceId}: {r.error}
                  </li>
                ))}
              {result.failed > 3 && (
                <li className="text-red-500">
                  {t('ocrRefresh.andMore', { count: result.failed - 3 })}
                </li>
              )}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
