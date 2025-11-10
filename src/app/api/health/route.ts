import { NextResponse } from 'next/server';

/**
 * Health check endpoint for Docker and monitoring
 * GET /api/health
 */
export const revalidate = 0;

export async function GET() {
  try {
    if (process.env.NEXT_OUTPUT === 'export') {
      return NextResponse.json(
        {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          message: 'Health check is static during `output: export` builds.',
        },
        { status: 200 }
      );
    }

    // Basic health check
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
    };

    return NextResponse.json(health, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}
