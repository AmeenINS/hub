/**
 * Product-Company Relations Service
 * Handles many-to-many relationships between insurance products and companies
 * with company-specific details like commissions, limits, and requirements
 */

import { lmdb } from './lmdb';
import { ProductCompanyRelation } from '@/shared/types/database';
import { nanoid } from 'nanoid';

const DB_NAME = 'productCompanyRelations';

export class ProductCompanyRelationService {
  /**
   * Get all relations for a specific product
   */
  async getRelationsByProductId(productId: string): Promise<ProductCompanyRelation[]> {
    const allRelations = await lmdb.getAll<ProductCompanyRelation>(DB_NAME);
    
    return allRelations
      .filter((r: ProductCompanyRelation) => r.productId === productId && r.isActive)
      .sort((a: ProductCompanyRelation, b: ProductCompanyRelation) => {
        // Sort by priority (higher first), then by preferred status
        if (a.isPreferred !== b.isPreferred) {
          return a.isPreferred ? -1 : 1;
        }
        return (b.priority || 0) - (a.priority || 0);
      });
  }

  /**
   * Get all relations for a specific company
   */
  async getRelationsByCompanyId(companyId: string): Promise<ProductCompanyRelation[]> {
    const allRelations = await lmdb.getAll<ProductCompanyRelation>(DB_NAME);
    
    return allRelations
      .filter((r: ProductCompanyRelation) => r.companyId === companyId && r.isActive)
      .sort((a: ProductCompanyRelation, b: ProductCompanyRelation) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }

  /**
   * Get a specific relation
   */
  async getRelationById(id: string): Promise<ProductCompanyRelation | null> {
    const relation = await lmdb.getById<ProductCompanyRelation>(DB_NAME, id);
    
    if (!relation || !relation.isActive) {
      return null;
    }
    
    return relation;
  }

  /**
   * Check if a relation exists between product and company
   */
  async relationExists(productId: string, companyId: string): Promise<boolean> {
    const allRelations = await lmdb.getAll<ProductCompanyRelation>(DB_NAME);
    
    return allRelations.some(
      (r: ProductCompanyRelation) => 
        r.productId === productId && 
        r.companyId === companyId && 
        r.isActive
    );
  }

  /**
   * Get a specific relation by product and company
   */
  async getRelationByProductAndCompany(
    productId: string,
    companyId: string
  ): Promise<ProductCompanyRelation | null> {
    const allRelations = await lmdb.getAll<ProductCompanyRelation>(DB_NAME);
    
    return allRelations.find(
      (r: ProductCompanyRelation) => 
        r.productId === productId && 
        r.companyId === companyId && 
        r.isActive
    ) || null;
  }

  /**
   * Create a new product-company relation
   */
  async createRelation(
    data: Omit<ProductCompanyRelation, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>,
    createdBy: string
  ): Promise<ProductCompanyRelation> {
    // Check if relation already exists
    const exists = await this.relationExists(data.productId, data.companyId);
    if (exists) {
      throw new Error('Relation between this product and company already exists');
    }

    const relation: ProductCompanyRelation = {
      id: `pcr_${nanoid()}`,
      ...data,
      createdBy,
      updatedBy: createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await lmdb.create(DB_NAME, relation.id, relation);
    return relation;
  }

  /**
   * Update a product-company relation
   */
  async updateRelation(
    id: string,
    data: Partial<Omit<ProductCompanyRelation, 'id' | 'productId' | 'companyId' | 'createdAt' | 'createdBy'>>,
    updatedBy: string
  ): Promise<ProductCompanyRelation | null> {
    const existingRelation = await this.getRelationById(id);
    if (!existingRelation) {
      throw new Error('Relation not found');
    }

    const updatedRelation = await lmdb.update<ProductCompanyRelation>(DB_NAME, id, {
      ...data,
      updatedBy,
    });

    return updatedRelation;
  }

  /**
   * Delete a product-company relation (soft delete)
   */
  async deleteRelation(id: string, deletedBy: string): Promise<boolean> {
    const relation = await this.getRelationById(id);
    if (!relation) {
      throw new Error('Relation not found');
    }

    await lmdb.update<ProductCompanyRelation>(DB_NAME, id, {
      isActive: false,
      updatedBy: deletedBy,
    });

    return true;
  }

  /**
   * Delete all relations for a product
   */
  async deleteRelationsByProductId(productId: string, deletedBy: string): Promise<number> {
    const relations = await this.getRelationsByProductId(productId);
    
    for (const relation of relations) {
      await this.deleteRelation(relation.id, deletedBy);
    }
    
    return relations.length;
  }

  /**
   * Delete all relations for a company
   */
  async deleteRelationsByCompanyId(companyId: string, deletedBy: string): Promise<number> {
    const relations = await this.getRelationsByCompanyId(companyId);
    
    for (const relation of relations) {
      await this.deleteRelation(relation.id, deletedBy);
    }
    
    return relations.length;
  }

  /**
   * Bulk create or update relations for a product
   * This is useful when editing a product and updating all company links at once
   */
  async syncProductCompanies(
    productId: string,
    companyRelations: Array<{
      companyId: string;
      commissionRate?: number;
      commissionType?: 'PERCENTAGE' | 'FIXED';
      fixedCommission?: number;
      minCoverage?: number;
      maxCoverage?: number;
      basePremium?: number;
      limitationsEn?: string;
      limitationsAr?: string;
      requirementsEn?: string;
      requirementsAr?: string;
      documentsRequired?: string[];
      pricingFactorsOverride?: Record<string, unknown>;
      minDuration?: number;
      maxDuration?: number;
      isPreferred?: boolean;
      priority?: number;
      processingTimeInDays?: number;
      claimProcessDetailsEn?: string;
      claimProcessDetailsAr?: string;
      notes?: string;
      metadata?: Record<string, unknown>;
    }>,
    userId: string
  ): Promise<ProductCompanyRelation[]> {
    // Get existing relations
    const existingRelations = await this.getRelationsByProductId(productId);
    const existingCompanyIds = existingRelations.map(r => r.companyId);
    const newCompanyIds = companyRelations.map(r => r.companyId);

    // Delete relations that are no longer in the list
    for (const relation of existingRelations) {
      if (!newCompanyIds.includes(relation.companyId)) {
        await this.deleteRelation(relation.id, userId);
      }
    }

    // Create or update relations
    const updatedRelations: ProductCompanyRelation[] = [];
    
    for (const companyData of companyRelations) {
      const existingRelation = await this.getRelationByProductAndCompany(
        productId,
        companyData.companyId
      );

      if (existingRelation) {
        // Update existing relation
        const updated = await this.updateRelation(
          existingRelation.id,
          companyData,
          userId
        );
        if (updated) {
          updatedRelations.push(updated);
        }
      } else {
        // Create new relation
        const created = await this.createRelation(
          {
            ...companyData,
            productId,
            isActive: true,
          },
          userId
        );
        updatedRelations.push(created);
      }
    }

    return updatedRelations;
  }

  /**
   * Get statistics
   */
  async getStatistics(): Promise<{
    totalRelations: number;
    activeRelations: number;
    preferredRelations: number;
    averageCommissionRate: number;
  }> {
    const allRelations = await lmdb.getAll<ProductCompanyRelation>(DB_NAME);
    const activeRelations = allRelations.filter((r: ProductCompanyRelation) => r.isActive);

    const commissionsWithRate = activeRelations.filter(
      (r: ProductCompanyRelation) => 
        r.commissionRate !== undefined && 
        r.commissionType === 'PERCENTAGE'
    );

    const averageCommissionRate = commissionsWithRate.length > 0
      ? commissionsWithRate.reduce((sum: number, r: ProductCompanyRelation) => sum + (r.commissionRate || 0), 0) / 
        commissionsWithRate.length
      : 0;

    return {
      totalRelations: allRelations.length,
      activeRelations: activeRelations.length,
      preferredRelations: activeRelations.filter((r: ProductCompanyRelation) => r.isPreferred).length,
      averageCommissionRate: Math.round(averageCommissionRate * 100) / 100,
    };
  }
}
