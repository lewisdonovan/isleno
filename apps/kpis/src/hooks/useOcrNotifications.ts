import { useState, useEffect } from 'react';
import { ocrNotificationService, OcrRefreshStatus } from '@/lib/services/ocrNotificationService';

export function useOcrNotifications() {
  const [status, setStatus] = useState<OcrRefreshStatus>({ isRunning: false });

  useEffect(() => {
    const unsubscribe = ocrNotificationService.subscribe((newStatus) => {
      setStatus(newStatus);
    });

    return unsubscribe;
  }, []);

  return {
    status,
    isRunning: status.isRunning,
    progress: status.progress,
    result: status.result,
    error: status.error,
    startTime: status.startTime
  };
}
