/**
 * Simple Notification Scheduler
 * 
 * این فایل یک scheduler ساده برای development است که هر 2 دقیقه
 * notification cron job را فراخوانی می‌کند.
 * 
 * برای production از external cron services استفاده کنید (مثل Vercel Cron)
 */

const CRON_INTERVAL = 2 * 60 * 1000; // 2 minutes
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const CRON_SECRET = process.env.CRON_SECRET || 'change-me-in-production';

let isRunning = false;
let intervalId: NodeJS.Timeout | null = null;

async function runCronJob() {
  if (isRunning) {
    console.log('[Scheduler] Previous job still running, skipping...');
    return;
  }

  isRunning = true;
  
  try {
    console.log('[Scheduler] Running notification cron job...');
    
    const response = await fetch(`${API_URL}/api/notifications/cron`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success) {
      console.log('[Scheduler] ✅ Cron job completed successfully');
      console.log('[Scheduler] Stats:', result.stats);
    } else {
      console.error('[Scheduler] ❌ Cron job failed:', result.error);
    }
  } catch (error) {
    console.error('[Scheduler] ❌ Error running cron job:', error);
  } finally {
    isRunning = false;
  }
}

export function startNotificationScheduler() {
  if (intervalId) {
    console.log('[Scheduler] ⚠️  Scheduler already running');
    return;
  }

  console.log('[Scheduler] 🚀 Starting notification scheduler');
  console.log('[Scheduler] Interval: Every 2 minutes');
  console.log('[Scheduler] API URL:', API_URL);
  
  // Run immediately on start
  runCronJob();
  
  // Then run every 2 minutes
  intervalId = setInterval(runCronJob, CRON_INTERVAL);
  
  console.log('[Scheduler] ✅ Scheduler started successfully');
}

export function stopNotificationScheduler() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('[Scheduler] 🛑 Scheduler stopped');
  }
}

// Auto-start in development
if (process.env.NODE_ENV === 'development' && process.env.AUTO_START_SCHEDULER !== 'false') {
  console.log('[Scheduler] Auto-starting in development mode...');
  startNotificationScheduler();
  
  // Graceful shutdown
  process.on('SIGTERM', stopNotificationScheduler);
  process.on('SIGINT', stopNotificationScheduler);
}
