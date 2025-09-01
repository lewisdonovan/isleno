import { useState, useEffect, useCallback } from 'react';

interface OcrRefreshStatus {
  totalChecked: number;
  stillZeroValue: number;
  updatedInvoices: number;
  stillZeroValueIds: number[];
  updatedInvoiceIds: number[];
}

interface UseOcrRefreshStatusProps {
  zeroValueInvoiceIds: number[];
  enabled: boolean;
  pollingInterval?: number;
}

export function useOcrRefreshStatus({ 
  zeroValueInvoiceIds, 
  enabled, 
  pollingInterval = 5000 
}: UseOcrRefreshStatusProps) {
  const [status, setStatus] = useState<OcrRefreshStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = useCallback(async () => {
    if (!enabled || zeroValueInvoiceIds.length === 0) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/invoices/refresh-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invoiceIds: zeroValueInvoiceIds }),
      });

      if (!response.ok) {
        throw new Error(`Failed to check OCR status: ${response.status}`);
      }

      const data = await response.json();
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [enabled, zeroValueInvoiceIds]);

  useEffect(() => {
    if (!enabled || zeroValueInvoiceIds.length === 0) {
      setStatus(null);
      return;
    }

    // Initial check
    checkStatus();

    // Set up polling
    const interval = setInterval(checkStatus, pollingInterval);

    return () => clearInterval(interval);
  }, [enabled, zeroValueInvoiceIds, checkStatus, pollingInterval]);

  const isComplete = status && status.stillZeroValue === 0;
  const hasUpdates = status && status.updatedInvoices > 0;

  return {
    status,
    isLoading,
    error,
    isComplete,
    hasUpdates,
    checkStatus,
  };
}
