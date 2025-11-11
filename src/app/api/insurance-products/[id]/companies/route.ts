/**
 * Product-Company Relations API Routes
 * Manages relationships between insurance products and companies
 */

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { ProductCompanyRelationService } from '@/core/data/product-company-relation-service';
import { JWTService } from '@/core/auth/jwt';
import { checkPermission } from '@/core/auth/middleware';
import { logError } from '@/core/logging/logger';

/**
 * GET /api/insurance-products/[id]/companies
 * Get all companies linked to a product
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
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

    const relationService = new ProductCompanyRelationService();
    const relations = await relationService.getRelationsByProductId(productId);

    return NextResponse.json({ success: true, data: relations });
  } catch (error) {
    logError('Failed to fetch product companies', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch product companies' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/insurance-products/[id]/companies
 * Link a company to a product with specific details
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const payload = JWTService.verifyToken(token);
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const userId = payload.userId;
    const hasPermission = await checkPermission(userId, 'insurance-products', 'edit');
    if (!hasPermission) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const relationService = new ProductCompanyRelationService();

    const relation = await relationService.createRelation(
      {
        productId: productId,
        companyId: body.companyId,
        commissionRate: body.commissionRate,
        commissionType: body.commissionType,
        fixedCommission: body.fixedCommission,
        minCoverage: body.minCoverage,
        maxCoverage: body.maxCoverage,
        basePremium: body.basePremium,
        limitationsEn: body.limitationsEn,
        limitationsAr: body.limitationsAr,
        requirementsEn: body.requirementsEn,
        requirementsAr: body.requirementsAr,
        documentsRequired: body.documentsRequired,
        pricingFactorsOverride: body.pricingFactorsOverride,
        minDuration: body.minDuration,
        maxDuration: body.maxDuration,
        isActive: true,
        isPreferred: body.isPreferred || false,
        priority: body.priority,
        processingTimeInDays: body.processingTimeInDays,
        claimProcessDetailsEn: body.claimProcessDetailsEn,
        claimProcessDetailsAr: body.claimProcessDetailsAr,
        notes: body.notes,
        metadata: body.metadata,
      },
      userId
    );

    revalidatePath(`/dashboard/insurance-products/${productId}`);
    return NextResponse.json({
      success: true,
      data: relation,
      message: 'Company linked to product successfully',
    });
  } catch (error) {
    logError('Failed to link company to product', error);

    if (error instanceof Error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { success: false, error: 'Failed to link company to product' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/insurance-products/[id]/companies
 * Bulk update all company relations for a product
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const payload = JWTService.verifyToken(token);
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const userId = payload.userId;
    const hasPermission = await checkPermission(userId, 'insurance-products', 'edit');
    if (!hasPermission) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const relationService = new ProductCompanyRelationService();

    const relations = await relationService.syncProductCompanies(
      productId,
      body.companies || [],
      userId
    );

    revalidatePath(`/dashboard/insurance-products/${productId}`);
    return NextResponse.json({
      success: true,
      data: relations,
      message: 'Product companies updated successfully',
    });
  } catch (error) {
    logError('Failed to update product companies', error);

    if (error instanceof Error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update product companies' },
      { status: 500 }
    );
  }
}
