import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { InsuranceProductService } from '@/core/data/insurance-products-service';
import { JWTService } from '@/core/auth/jwt';
import { checkPermission } from '@/core/auth/middleware';
import { logError } from '@/core/logging/logger';

/**
 * GET /api/insurance-products
 * Get all insurance products (requires permission)
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
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const popular = searchParams.get('popular');
    const online = searchParams.get('online');

    let products;

    if (search) {
      products = await productService.searchProducts(search);
    } else if (type) {
      products = await productService.getProductsByType(type as any);
    } else if (category) {
      products = await productService.getProductsByCategory(category as any);
    } else if (status) {
      products = await productService.getProductsByStatus(status as any);
    } else if (popular === 'true') {
      products = await productService.getPopularProducts();
    } else if (online === 'true') {
      products = await productService.getOnlineProducts();
    } else {
      products = await productService.getAllProducts();
    }

    return NextResponse.json({
      success: true,
      data: products,
    });
  } catch (error) {
    logError('GET /api/insurance-products', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/insurance-products
 * Create a new insurance product (requires permission)
 */
export async function POST(request: NextRequest) {
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
    const hasPermission = await checkPermission(userId, 'insurance-products', 'create');
    if (!hasPermission) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const productService = new InsuranceProductService();
    
    // Add creator info
    const productData = {
      ...body,
      createdBy: userId,
    };

    const product = await productService.createProduct(productData);

    // Revalidate the insurance products page
    revalidatePath('/dashboard/insurance-products');

    return NextResponse.json({
      success: true,
      data: product,
      message: 'Insurance product created successfully',
    }, { status: 201 });
  } catch (error) {
    logError('POST /api/insurance-products', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    const statusCode = errorMessage.includes('already exists') ? 409 : 500;
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: statusCode }
    );
  }
}
