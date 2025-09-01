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
        // Try to get detailed error information from the response
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = `${errorMessage} - ${errorData.error}`;
          }
          if (errorData.details) {
            errorMessage = `${errorMessage} (${errorData.details})`;
          }
        } catch (parseError) {
          // If we can't parse the error response, use the status text
          console.warn('Could not parse error response:', parseError);
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      setStatus(data);
    } catch (err) {
      let errorMessage = 'Unknown error occurred';
      
      if (err instanceof Error) {
        if (err.name === 'TypeError' && err.message.includes('fetch')) {
          errorMessage = 'Network error: Unable to connect to the server. Please check your internet connection.';
        } else if (err.message.includes('HTTP 401')) {
          errorMessage = 'Authentication error: Your session may have expired. Please refresh the page.';
        } else if (err.message.includes('HTTP 403')) {
          errorMessage = 'Permission denied: You do not have access to check OCR status.';
        } else if (err.message.includes('HTTP 404')) {
          errorMessage = 'Service not found: The OCR status endpoint is not available.';
        } else if (err.message.includes('HTTP 500')) {
          errorMessage = 'Server error: The OCR status service is temporarily unavailable. Please try again later.';
        } else if (err.message.includes('HTTP 502') || err.message.includes('HTTP 503') || err.message.includes('HTTP 504')) {
          errorMessage = 'Service unavailable: The OCR status service is down. Please try again later.';
        } else if (err.message.includes('timeout')) {
          errorMessage = 'Request timeout: The OCR status check took too long. Please try again.';
        } else {
          errorMessage = err.message;
        }
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      console.error('OCR status check failed:', {
        error: err,
        message: errorMessage,
        invoiceIds: zeroValueInvoiceIds,
        timestamp: new Date().toISOString()
      });
      
      setError(errorMessage);
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
