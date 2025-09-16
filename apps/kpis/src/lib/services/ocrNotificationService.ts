// Toast notifications are handled client-side via polling

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
    // Server-side: Just log the result, client-side will poll for status
    console.log('OCR Refresh Complete:', result);
  }

  private showErrorNotification(error: string) {
    // Server-side: Just log the error, client-side will poll for status
    console.error('OCR Refresh Error:', error);
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
