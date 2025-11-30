import { NextRequest, NextResponse } from 'next/server';
import { CompanyService } from '@/core/data/crm-service';
import { JWTService } from '@/core/auth/jwt';
import { checkPermission } from '@/core/auth/middleware';
import { logError } from '@/core/logging/logger';
import { getAccessibleUserIds, filterByHierarchicalAccess } from '@/core/utils/hierarchical-access';

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

    const hasPermission = await checkPermission(payload.userId, 'crm_companies', 'read');
    if (!hasPermission) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const companyService = new CompanyService();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    // Get accessible user IDs (self + subordinates)
    const accessibleUserIds = await getAccessibleUserIds(payload.userId);

    let companies;
    if (search) {
      companies = await companyService.searchCompanies(search);
    } else {
      companies = await companyService.getAllCompanies();
    }

    // Filter companies by hierarchical access
    const filteredCompanies = filterByHierarchicalAccess(companies, accessibleUserIds);

    return NextResponse.json({ success: true, data: filteredCompanies });
  } catch (error) {
    logError('GET /api/crm/companies', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

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

    const hasPermission = await checkPermission(payload.userId, 'crm_companies', 'create');
    if (!hasPermission) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const companyService = new CompanyService();
    
    const companyData = {
      ...body,
      createdBy: payload.userId,
      assignedTo: body.assignedTo || payload.userId,
    };

    const company = await companyService.createCompany(companyData);

    return NextResponse.json({
      success: true,
      data: company,
      message: 'Company created successfully',
    }, { status: 201 });
  } catch (error) {
    logError('POST /api/crm/companies', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}