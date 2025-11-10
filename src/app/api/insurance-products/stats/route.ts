import { NextRequest, NextResponse } from 'next/server';
import { InsuranceProductService } from '@/core/data/insurance-products-service';
import { JWTService } from '@/core/auth/jwt';
import { checkPermission } from '@/core/auth/middleware';
import { logError } from '@/core/logging/logger';

/**
 * GET /api/insurance-products/stats
 * Get insurance products statistics (requires permission)
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const payload = JWTService.verifyToken(token);
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const userId = payload.userId;
    const hasPermission = await checkPermission(userId, 'insurance-products', 'view');
    if (!hasPermission) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const productService = new InsuranceProductService();
    const stats = await productService.getProductStatistics();

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logError('GET /api/insurance-products/stats', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
