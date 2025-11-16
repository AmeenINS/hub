/**
 * Insurance Company Detail API Routes
 * Handles GET, PUT, DELETE operations for individual insurance companies
 */

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { InsuranceCompanyService } from '@/core/data/insurance-companies-service';
import { JWTService } from '@/core/auth/jwt';
import { checkPermission } from '@/core/auth/middleware';
import { logError } from '@/core/logging/logger';

/**
 * GET /api/insurance-companies/[id]
 * Get a specific insurance company
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.cookies.get('auth-token')?.value;
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

    const companyService = new InsuranceCompanyService();
    const company = await companyService.getCompanyById(id);

    if (!company) {
      return NextResponse.json({ success: false, error: 'Company not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: company });
  } catch (error) {
    logError('Failed to fetch insurance company', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch insurance company' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/insurance-companies/[id]
 * Update an insurance company
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.cookies.get('auth-token')?.value;
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
    const companyService = new InsuranceCompanyService();

    const company = await companyService.updateCompany(id, body, userId);

    revalidatePath('/dashboard/insurance-companies');
    return NextResponse.json({
      success: true,
      data: company,
      message: 'Insurance company updated successfully',
    });
  } catch (error) {
    logError('Failed to update insurance company', error);

    if (error instanceof Error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update insurance company' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/insurance-companies/[id]
 * Delete an insurance company (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.cookies.get('auth-token')?.value;
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

    const companyService = new InsuranceCompanyService();
    await companyService.deleteCompany(id, userId);

    revalidatePath('/dashboard/insurance-companies');
    return NextResponse.json({
      success: true,
      message: 'Insurance company deleted successfully',
    });
  } catch (error) {
    logError('Failed to delete insurance company', error);

    if (error instanceof Error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { success: false, error: 'Failed to delete insurance company' },
      { status: 500 }
    );
  }
}
