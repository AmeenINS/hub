/**
 * Insurance Companies API Routes
 * Handles CRUD operations for insurance companies
 */

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { InsuranceCompanyService } from '@/core/data/insurance-companies-service';
import { JWTService } from '@/core/auth/jwt';
import { checkPermission } from '@/core/auth/middleware';
import { logError } from '@/core/logging/logger';

/**
 * GET /api/insurance-companies
 * Get all insurance companies (requires permission)
 */
export async function GET(request: NextRequest) {
  try {
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
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    let companies;
    if (status) {
      companies = await companyService.getCompaniesByStatus(status as any);
    } else if (search) {
      companies = await companyService.searchCompanies(search);
    } else {
      companies = await companyService.getAllCompanies();
    }

    return NextResponse.json({ success: true, data: companies });
  } catch (error) {
    logError('Failed to fetch insurance companies', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch insurance companies' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/insurance-companies
 * Create a new insurance company (requires permission)
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
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
    const companyService = new InsuranceCompanyService();
    
    const company = await companyService.createCompany(body, userId);
    
    revalidatePath('/dashboard/insurance-products');
    return NextResponse.json({ success: true, data: company, message: 'Insurance company created successfully' });
  } catch (error) {
    logError('Failed to create insurance company', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create insurance company' },
      { status: 500 }
    );
  }
}
