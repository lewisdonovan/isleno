import { NextRequest, NextResponse } from 'next/server';
import { ocrNotificationService } from '@/lib/services/ocrNotificationService';

export async function GET(_request: NextRequest) {
  try {
    const status = ocrNotificationService.getStatus();
    return NextResponse.json(status);
  } catch (error) {
    console.error('Error getting OCR status:', error);
    return NextResponse.json(
      { error: 'Failed to get OCR status' },
      { status: 500 }
    );
  }
}
