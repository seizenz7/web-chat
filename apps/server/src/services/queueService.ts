/**
 * Bull Queue Service
 *
 * Manages background jobs using Bull (backed by Redis).
 *
 * Why use job queues?
 * - Decouple long operations from HTTP requests (faster response times)
 * - Retry failed jobs automatically
 * - Schedule jobs for later execution
 * - Distribute work across multiple workers
 * - Monitor job status and progress
 *
 * Example scenarios:
 * - Sending emails (don't want user to wait 5 seconds for SMTP)
 * - Generating reports (might take minutes)
 * - Processing images/videos (slow CPU operations)
 * - Batch operations (update millions of records)
 * - Scheduled tasks (daily cleanup, weekly reports)
 *
 * Flow:
 *   1. Controller/Service adds job to queue: queue.add(data)
 *   2. Returns immediately (202 Accepted)
 *   3. Worker processes job asynchronously
 *   4. On completion, job is marked as done
 *   5. Failures are retried or logged
 */

import Queue from 'bull';
import { config } from '../config';
import { logger } from '../utils/logging';

// Create queues for different job types
// Each queue manages its own set of jobs and workers

/**
 * Email Queue
 * Processes: sending emails, newsletters, notifications
 */
export const emailQueue = new Queue('email', {
  redis: {
    host: config.redis.host,
    port: config.redis.port,
  },
});

/**
 * Report Queue
 * Processes: generating PDFs, Excel exports, analytics reports
 */
export const reportQueue = new Queue('report', {
  redis: {
    host: config.redis.host,
    port: config.redis.port,
  },
});

/**
 * Image Queue
 * Processes: image resizing, cropping, compression, OCR
 */
export const imageQueue = new Queue('image', {
  redis: {
    host: config.redis.host,
    port: config.redis.port,
  },
});

/**
 * Initialize all job queues with workers and event handlers
 * This is called once at server startup from index.ts
 */
export function initializeQueues() {
  logger.info('Initializing Bull job queues...');

  // Email Queue Worker
  emailQueue.process(async (job) => {
    logger.info('Processing email job', { jobId: job.id, data: job.data });

    try {
      // In a real app, send email via SMTP here
      // await sendEmailViaSMTP(job.data.to, job.data.subject, job.data.body);

      // For now, just simulate work
      await new Promise((resolve) => setTimeout(resolve, 1000));

      logger.info('Email sent', { jobId: job.id });
      return { success: true, jobId: job.id };
    } catch (error) {
      logger.error('Email job failed', { jobId: job.id, error });
      // The job will be automatically retried (up to maxAttempts)
      throw error;
    }
  });

  // Report Queue Worker
  reportQueue.process(async (job) => {
    logger.info('Processing report job', { jobId: job.id, data: job.data });

    try {
      // In a real app, generate PDF or Excel here
      // const report = await generateReport(job.data.type, job.data.filters);

      // Simulate work
      await new Promise((resolve) => setTimeout(resolve, 2000));

      logger.info('Report generated', { jobId: job.id });
      return { success: true, reportUrl: '/reports/123.pdf' };
    } catch (error) {
      logger.error('Report job failed', { jobId: job.id, error });
      throw error;
    }
  });

  // Image Queue Worker
  imageQueue.process(async (job) => {
    logger.info('Processing image job', { jobId: job.id, data: job.data });

    try {
      // In a real app, use sharp or imagemagick here
      // await resizeImage(job.data.imagePath, job.data.sizes);

      // Simulate work
      await new Promise((resolve) => setTimeout(resolve, 1500));

      logger.info('Image processed', { jobId: job.id });
      return { success: true, processedPath: '/images/processed/123.jpg' };
    } catch (error) {
      logger.error('Image job failed', { jobId: job.id, error });
      throw error;
    }
  });

  // Global event handlers (called for all queues)

  // Job completed successfully
  emailQueue.on('completed', (job) => {
    logger.info('Email job completed', { jobId: job.id });
  });

  reportQueue.on('completed', (job) => {
    logger.info('Report job completed', { jobId: job.id });
  });

  imageQueue.on('completed', (job) => {
    logger.info('Image job completed', { jobId: job.id });
  });

  // Job failed (after all retries exhausted)
  emailQueue.on('failed', (job, err) => {
    logger.error('Email job failed permanently', { jobId: job.id, error: err.message });
  });

  reportQueue.on('failed', (job, err) => {
    logger.error('Report job failed permanently', { jobId: job.id, error: err.message });
  });

  imageQueue.on('failed', (job, err) => {
    logger.error('Image job failed permanently', { jobId: job.id, error: err.message });
  });

  logger.info('Bull queues initialized: email, report, image');
}

/**
 * Helper function to add an email job
 * Usage in controller:
 *   await addEmailJob({
 *     to: 'user@example.com',
 *     subject: 'Welcome!',
 *     body: 'Thanks for signing up...'
 *   });
 */
export async function addEmailJob(data: {
  to: string;
  subject: string;
  body: string;
  from?: string;
}) {
  return emailQueue.add(data, {
    attempts: 3, // Retry up to 3 times on failure
    backoff: {
      type: 'exponential',
      delay: 2000, // Start with 2s delay, exponentially increase
    },
    removeOnComplete: true, // Delete job after completion
  });
}

/**
 * Helper function to add a report generation job
 */
export async function addReportJob(data: { type: string; filters?: Record<string, any> }) {
  return reportQueue.add(data, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: true,
  });
}

/**
 * Helper function to add an image processing job
 */
export async function addImageJob(data: { imagePath: string; sizes: number[] }) {
  return imageQueue.add(data, {
    attempts: 2,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: true,
  });
}

/**
 * Monitor job status
 * Useful for tracking long-running jobs in the frontend
 */
export async function getJobStatus(queue: Queue.Queue, jobId: string | number) {
  const job = await queue.getJob(jobId);
  if (!job) {
    return { status: 'not_found' };
  }

  return {
    id: job.id,
    status: job._progress !== undefined ? `progress:${job._progress}%` : 'pending',
    attempts: job.attemptsMade,
    maxAttempts: job.opts.attempts,
  };
}
