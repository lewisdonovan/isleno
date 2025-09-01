import { toast } from 'sonner';

export interface OcrRefreshResult {
  totalInvoices: number;
  successful: number;
  failed: number;
  duration: number;
  results: Array<{
    invoiceId: number;
    success: boolean;
    error: string | null;
  }>;
  completedAt: string;
}

export interface OcrRefreshStatus {
  isRunning: boolean;
  startTime?: Date;
  progress?: {
    completed: number;
    total: number;
    percentage: number;
  };
  result?: OcrRefreshResult;
  error?: string;
}

class OcrNotificationService {
  private status: OcrRefreshStatus = { isRunning: false };
  private listeners: Array<(status: OcrRefreshStatus) => void> = [];
  private static instance: OcrNotificationService | null = null;
  private static instancePromise: Promise<OcrNotificationService> | null = null;

  private constructor() {
    // Private constructor to prevent direct instantiation
  }

  static getInstance(): OcrNotificationService {
    if (!OcrNotificationService.instance) {
      OcrNotificationService.instance = new OcrNotificationService();
    }
    return OcrNotificationService.instance;
  }

  // Reset method for testing and cleanup
  static reset(): void {
    OcrNotificationService.instance = null;
  }

  startRefresh(invoiceIds: number[]) {
    this.status = {
      isRunning: true,
      startTime: new Date(),
      progress: {
        completed: 0,
        total: invoiceIds.length,
        percentage: 0
      }
    };
    this.notifyListeners();
  }

  updateProgress(completed: number, total: number) {
    if (this.status.isRunning) {
      this.status.progress = {
        completed,
        total,
        percentage: Math.round((completed / total) * 100)
      };
      this.notifyListeners();
    }
  }

  completeRefresh(result: OcrRefreshResult) {
    this.status = {
      isRunning: false,
      result,
      startTime: this.status.startTime
    };
    
    this.showNotification(result);
    this.notifyListeners();
  }

  failRefresh(error: string) {
    this.status = {
      isRunning: false,
      error,
      startTime: this.status.startTime
    };
    
    this.showErrorNotification(error);
    this.notifyListeners();
  }

  private showNotification(result: OcrRefreshResult) {
    const { successful, failed, totalInvoices, duration } = result;
    
    if (successful === totalInvoices) {
      toast.success('OCR Refresh Complete', {
        description: `Successfully refreshed ${successful} invoice${successful !== 1 ? 's' : ''} in ${Math.round(duration / 1000)}s`,
        duration: 5000
      });
    } else if (successful > 0) {
      toast.success('OCR Refresh Partially Complete', {
        description: `Refreshed ${successful}/${totalInvoices} invoices successfully. ${failed} failed.`,
        duration: 7000
      });
    } else {
      toast.error('OCR Refresh Failed', {
        description: `Failed to refresh ${totalInvoices} invoice${totalInvoices !== 1 ? 's' : ''}. Please try again.`,
        duration: 7000
      });
    }
  }

  private showErrorNotification(error: string) {
    let title = 'OCR Refresh Error';
    let description = error;
    
    // Provide more specific error messages based on error content
    if (error.includes('Network error') || error.includes('fetch')) {
      title = 'Network Connection Error';
      description = 'Unable to connect to the OCR service. Please check your internet connection and try again.';
    } else if (error.includes('Authentication error') || error.includes('401')) {
      title = 'Authentication Error';
      description = 'Your session has expired. Please refresh the page and try again.';
    } else if (error.includes('Permission denied') || error.includes('403')) {
      title = 'Permission Denied';
      description = 'You do not have permission to perform OCR refresh operations.';
    } else if (error.includes('Service not found') || error.includes('404')) {
      title = 'Service Unavailable';
      description = 'The OCR service is not available. Please contact support.';
    } else if (error.includes('Server error') || error.includes('500')) {
      title = 'Server Error';
      description = 'The OCR service encountered an internal error. Please try again later.';
    } else if (error.includes('Service unavailable') || error.includes('502') || error.includes('503') || error.includes('504')) {
      title = 'Service Temporarily Unavailable';
      description = 'The OCR service is temporarily down. Please try again in a few minutes.';
    } else if (error.includes('timeout')) {
      title = 'Request Timeout';
      description = 'The OCR refresh operation took too long. Please try again.';
    } else if (error.includes('Odoo API')) {
      title = 'Odoo Service Error';
      description = 'Unable to communicate with the Odoo system. Please try again later.';
    }
    
    toast.error(title, {
      description,
      duration: 7000
    });
  }

  getStatus(): OcrRefreshStatus {
    return { ...this.status };
  }

  subscribe(listener: (status: OcrRefreshStatus) => void): () => void {
    this.listeners.push(listener);
    // Immediately call with current status
    listener(this.getStatus());
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.getStatus()));
  }

  reset() {
    this.status = { isRunning: false };
    this.notifyListeners();
  }
}

export const ocrNotificationService = OcrNotificationService.getInstance();
