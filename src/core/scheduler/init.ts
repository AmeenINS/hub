import { schedulerService } from '@/core/scheduler/scheduler-service';

/**
 * Global Scheduler Initialization
 * This file starts the scheduler service when the application starts
 */

let isSchedulerStarted = false;

export async function initializeScheduler() {
  if (isSchedulerStarted) {
    console.log('⚠️ Scheduler already initialized');
    return;
  }

  try {
    console.log('🚀 Initializing Global Scheduler Service...');
    
    // Start the scheduler service
    await schedulerService.start();
    
    isSchedulerStarted = true;
    console.log('✅ Global Scheduler Service initialized successfully');
    
    // Handle graceful shutdown
    const shutdownHandler = async () => {
      console.log('🛑 Shutting down Scheduler Service...');
      schedulerService.stop();
      process.exit(0);
    };

    process.on('SIGINT', shutdownHandler);
    process.on('SIGTERM', shutdownHandler);
    
  } catch (error) {
    console.error('❌ Failed to initialize Scheduler Service:', error);
    throw error;
  }
}

// Initialize scheduler when module is imported
if (typeof window === 'undefined') {
  // Only run on server side
  initializeScheduler().catch(console.error);
}

export { schedulerService };
