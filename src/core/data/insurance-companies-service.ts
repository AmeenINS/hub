/**
 * Insurance Companies Service
 * Handles CRUD operations for insurance companies using LMDB
 */

import { lmdb } from './lmdb';
import { InsuranceCompany, InsuranceCompanyStatus } from '@/shared/types/database';
import { nanoid } from 'nanoid';

const DB_NAME = 'insuranceCompanies';

export class InsuranceCompanyService {
  /**
   * Get all insurance companies (excluding soft-deleted)
   */
  async getAllCompanies(): Promise<InsuranceCompany[]> {
    const companies = await lmdb.getAll<InsuranceCompany>(DB_NAME);
    
    return companies
      .filter((c: InsuranceCompany) => !c.isDeleted)
      .sort((a: InsuranceCompany, b: InsuranceCompany) => a.nameEn.localeCompare(b.nameEn));
  }

  /**
   * Get insurance company by ID
   */
  async getCompanyById(id: string): Promise<InsuranceCompany | null> {
    const company = await lmdb.getById<InsuranceCompany>(DB_NAME, id);
    
    if (!company || company.isDeleted) {
      return null;
    }
    
    return company;
  }

  /**
   * Get insurance company by code
   */
  async getCompanyByCode(code: string): Promise<InsuranceCompany | null> {
    const allCompanies = await this.getAllCompanies();
    return allCompanies.find((c: InsuranceCompany) => c.code === code) || null;
  }

  /**
   * Search insurance companies
   */
  async searchCompanies(query: string): Promise<InsuranceCompany[]> {
    const allCompanies = await this.getAllCompanies();
    const lowerQuery = query.toLowerCase();
    
    return allCompanies.filter((company: InsuranceCompany) => 
      company.nameEn.toLowerCase().includes(lowerQuery) ||
      company.nameAr?.toLowerCase().includes(lowerQuery) ||
      company.code.toLowerCase().includes(lowerQuery) ||
      company.licenseNumber?.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get companies by status
   */
  async getCompaniesByStatus(status: InsuranceCompanyStatus): Promise<InsuranceCompany[]> {
    const allCompanies = await this.getAllCompanies();
    return allCompanies.filter((c: InsuranceCompany) => c.status === status);
  }

  /**
   * Get active companies
   */
  async getActiveCompanies(): Promise<InsuranceCompany[]> {
    return this.getCompaniesByStatus(InsuranceCompanyStatus.ACTIVE);
  }

  /**
   * Create a new insurance company
   */
  async createCompany(
    data: Omit<InsuranceCompany, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>,
    createdBy: string
  ): Promise<InsuranceCompany> {
    // Check if code already exists
    const existingCompany = await this.getCompanyByCode(data.code);
    if (existingCompany) {
      throw new Error('Insurance company with this code already exists');
    }

    const company: InsuranceCompany = {
      id: `ic_${nanoid()}`,
      ...data,
      createdBy,
      updatedBy: createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDeleted: false,
    };

    await lmdb.create(DB_NAME, company.id, company);
    return company;
  }

  /**
   * Update an insurance company
   */
  async updateCompany(
    id: string,
    data: Partial<Omit<InsuranceCompany, 'id' | 'createdAt' | 'createdBy' | 'isDeleted'>>,
    updatedBy: string
  ): Promise<InsuranceCompany | null> {
    const existingCompany = await this.getCompanyById(id);
    if (!existingCompany) {
      throw new Error('Insurance company not found');
    }

    // If code is being updated, check for conflicts
    if (data.code && data.code !== existingCompany.code) {
      const conflictingCompany = await this.getCompanyByCode(data.code);
      if (conflictingCompany && conflictingCompany.id !== id) {
        throw new Error('Insurance company with this code already exists');
      }
    }

    const updatedCompany = await lmdb.update<InsuranceCompany>(DB_NAME, id, {
      ...data,
      updatedBy,
    });

    return updatedCompany;
  }

  /**
   * Soft delete an insurance company
   */
  async deleteCompany(id: string, deletedBy: string): Promise<boolean> {
    const company = await this.getCompanyById(id);
    if (!company) {
      throw new Error('Insurance company not found');
    }

    await lmdb.update<InsuranceCompany>(DB_NAME, id, {
      isDeleted: true,
      deletedAt: new Date().toISOString(),
      updatedBy: deletedBy,
    });

    return true;
  }

  /**
   * Permanently delete an insurance company
   */
  async permanentlyDeleteCompany(id: string): Promise<boolean> {
    await lmdb.delete(DB_NAME, id);
    return true;
  }

  /**
   * Get statistics
   */
  async getStatistics(): Promise<{
    total: number;
    active: number;
    inactive: number;
    suspended: number;
  }> {
    const companies = await lmdb.getAll<InsuranceCompany>(DB_NAME);
    const activeCompanies = companies.filter((c: InsuranceCompany) => !c.isDeleted);

    return {
      total: activeCompanies.length,
      active: activeCompanies.filter((c: InsuranceCompany) => c.status === InsuranceCompanyStatus.ACTIVE).length,
      inactive: activeCompanies.filter((c: InsuranceCompany) => c.status === InsuranceCompanyStatus.INACTIVE).length,
      suspended: activeCompanies.filter((c: InsuranceCompany) => c.status === InsuranceCompanyStatus.SUSPENDED).length,
    };
  }
}
