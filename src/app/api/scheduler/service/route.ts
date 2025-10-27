import { NextResponse } from 'next/server';
import { schedulerService } from '@/scheduler-init';

/**
 * Global Scheduler Service Status API
 * GET: Get scheduler service status
 */
export async function GET() {
  try {
    const status = schedulerService.getStatus();
    
    return NextResponse.json({
      success: true,
      data: {
        ...status,
        message: status.running 
          ? 'Scheduler service is running' 
          : 'Scheduler service is stopped'
      }
    });
    
  } catch (error) {
    console.error('Error getting scheduler status:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get scheduler status'
      },
      { status: 500 }
    );
  }
}
