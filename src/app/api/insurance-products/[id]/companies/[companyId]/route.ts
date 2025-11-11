/**
 * Individual Product-Company Relation API Routes
 * Manages a specific relationship between a product and a company
 */

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { ProductCompanyRelationService } from '@/core/data/product-company-relation-service';
import { JWTService } from '@/core/auth/jwt';
import { checkPermission } from '@/core/auth/middleware';
import { logError } from '@/core/logging/logger';

/**
 * GET /api/insurance-products/[id]/companies/[companyId]
 * Get specific company relation details for a product
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; companyId: string }> }
) {
  try {
    const { id: productId, companyId } = await params;
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
    const relation = relations.find((r) => r.companyId === companyId);

    if (!relation) {
      return NextResponse.json({ success: false, error: 'Relation not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: relation });
  } catch (error) {
    logError('Failed to fetch product-company relation', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch relation' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/insurance-products/[id]/companies/[companyId]
 * Update company-specific details for a product
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; companyId: string }> }
) {
  try {
    const { id: productId, companyId } = await params;
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

    // Find existing relation to get its ID
    const relations = await relationService.getRelationsByProductId(productId);
    const existingRelation = relations.find((r) => r.companyId === companyId);

    if (!existingRelation) {
      return NextResponse.json({ success: false, error: 'Relation not found' }, { status: 404 });
    }

    const updatedRelation = await relationService.updateRelation(
      existingRelation.id,
      body,
      userId
    );

    revalidatePath(`/dashboard/insurance-products/${productId}`);
    return NextResponse.json({
      success: true,
      data: updatedRelation,
      message: 'Company details updated successfully',
    });
  } catch (error) {
    logError('Failed to update product-company relation', error);

    if (error instanceof Error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update relation' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/insurance-products/[id]/companies/[companyId]
 * Unlink a company from a product
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; companyId: string }> }
) {
  try {
    const { id: productId, companyId } = await params;
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const payload = JWTService.verifyToken(token);
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const userId = payload.userId;
    const hasPermission = await checkPermission(userId, 'insurance-products', 'delete');
    if (!hasPermission) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const relationService = new ProductCompanyRelationService();

    // Find existing relation to get its ID
    const relations = await relationService.getRelationsByProductId(productId);
    const existingRelation = relations.find((r) => r.companyId === companyId);

    if (!existingRelation) {
      return NextResponse.json({ success: false, error: 'Relation not found' }, { status: 404 });
    }

    await relationService.deleteRelation(existingRelation.id, userId);

    revalidatePath(`/dashboard/insurance-products/${productId}`);
    return NextResponse.json({
      success: true,
      message: 'Company unlinked from product successfully',
    });
  } catch (error) {
    logError('Failed to delete product-company relation', error);

    if (error instanceof Error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { success: false, error: 'Failed to unlink company' },
      { status: 500 }
    );
  }
}
