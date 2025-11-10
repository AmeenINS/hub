/**
 * Insurance Products Service
 * Handles CRUD operations for insurance products using LMDB
 */

import { lmdb } from './lmdb';
import { InsuranceProduct, InsuranceProductStatus, InsuranceProductType, InsuranceProductCategory } from '@/shared/types/database';
import { nanoid } from 'nanoid';

const DB_NAME = 'insuranceProducts';

export class InsuranceProductService {
  /**
   * Get all insurance products (excluding soft-deleted)
   */
  async getAllProducts(): Promise<InsuranceProduct[]> {
    const products = await lmdb.getAll<InsuranceProduct>(DB_NAME);
    
    return products
      .filter((p: InsuranceProduct) => !p.isDeleted)
      .sort((a: InsuranceProduct, b: InsuranceProduct) => {
        // Sort by priority (higher first), then by createdAt (newest first)
        if (a.priority !== b.priority) {
          return (b.priority || 0) - (a.priority || 0);
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }

  /**
   * Get insurance product by ID
   */
  async getProductById(id: string): Promise<InsuranceProduct | null> {
    const product = await lmdb.getById<InsuranceProduct>(DB_NAME, id);
    
    if (!product || product.isDeleted) {
      return null;
    }
    
    return product;
  }

  /**
   * Get insurance product by code
   */
  async getProductByCode(code: string): Promise<InsuranceProduct | null> {
    const allProducts = await this.getAllProducts();
    return allProducts.find((p: InsuranceProduct) => p.code === code) || null;
  }

  /**
   * Search insurance products
   */
  async searchProducts(query: string): Promise<InsuranceProduct[]> {
    const allProducts = await this.getAllProducts();
    const lowerQuery = query.toLowerCase();
    
    return allProducts.filter((product: InsuranceProduct) => 
      product.nameEn.toLowerCase().includes(lowerQuery) ||
      product.nameAr?.toLowerCase().includes(lowerQuery) ||
      product.code.toLowerCase().includes(lowerQuery) ||
      product.descriptionEn?.toLowerCase().includes(lowerQuery) ||
      product.descriptionAr?.toLowerCase().includes(lowerQuery) ||
      product.providerNameEn?.toLowerCase().includes(lowerQuery) ||
      product.providerNameAr?.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get products by type
   */
  async getProductsByType(type: InsuranceProductType): Promise<InsuranceProduct[]> {
    const allProducts = await this.getAllProducts();
    return allProducts.filter((p: InsuranceProduct) => p.type === type);
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(category: InsuranceProductCategory): Promise<InsuranceProduct[]> {
    const allProducts = await this.getAllProducts();
    return allProducts.filter((p: InsuranceProduct) => p.category === category);
  }

  /**
   * Get products by status
   */
  async getProductsByStatus(status: InsuranceProductStatus): Promise<InsuranceProduct[]> {
    const allProducts = await this.getAllProducts();
    return allProducts.filter((p: InsuranceProduct) => p.status === status);
  }

  /**
   * Get popular products
   */
  async getPopularProducts(): Promise<InsuranceProduct[]> {
    const allProducts = await this.getAllProducts();
    return allProducts.filter((p: InsuranceProduct) => p.isPopular && p.status === InsuranceProductStatus.ACTIVE);
  }

  /**
   * Get online available products
   */
  async getOnlineProducts(): Promise<InsuranceProduct[]> {
    const allProducts = await this.getAllProducts();
    return allProducts.filter((p: InsuranceProduct) => p.isAvailableOnline && p.status === InsuranceProductStatus.ACTIVE);
  }

  /**
   * Create new insurance product
   */
  async createProduct(data: Omit<InsuranceProduct, 'id' | 'createdAt' | 'updatedAt'>): Promise<InsuranceProduct> {
    // Check if code already exists
    const existingProduct = await this.getProductByCode(data.code);
    if (existingProduct) {
      throw new Error(`Product with code ${data.code} already exists`);
    }

    const id = nanoid();
    
    const product: InsuranceProduct = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDeleted: false,
    };
    
    await lmdb.create(DB_NAME, id, product);
    
    return product;
  }

  /**
   * Update insurance product
   */
  async updateProduct(
    id: string, 
    data: Partial<Omit<InsuranceProduct, 'id' | 'createdAt' | 'createdBy'>>
  ): Promise<InsuranceProduct | null> {
    const existingProduct = await lmdb.getById<InsuranceProduct>(DB_NAME, id);
    
    if (!existingProduct || existingProduct.isDeleted) {
      return null;
    }

    // If updating code, check for conflicts
    if (data.code && data.code !== existingProduct.code) {
      const conflictProduct = await this.getProductByCode(data.code);
      if (conflictProduct && conflictProduct.id !== id) {
        throw new Error(`Product with code ${data.code} already exists`);
      }
    }
    
    const updatedProduct = await lmdb.update<InsuranceProduct>(DB_NAME, id, data);
    return updatedProduct;
  }

  /**
   * Soft delete insurance product
   */
  async deleteProduct(id: string, deletedBy: string): Promise<boolean> {
    const product = await lmdb.getById<InsuranceProduct>(DB_NAME, id);
    
    if (!product) {
      return false;
    }
    
    await lmdb.update<InsuranceProduct>(DB_NAME, id, {
      isDeleted: true,
      deletedAt: new Date().toISOString(),
      updatedBy: deletedBy,
    } as Partial<InsuranceProduct>);
    
    return true;
  }

  /**
   * Hard delete insurance product (permanent)
   */
  async permanentDeleteProduct(id: string): Promise<boolean> {
    const product = await lmdb.getById<InsuranceProduct>(DB_NAME, id);
    
    if (!product) {
      return false;
    }
    
    await lmdb.delete(DB_NAME, id);
    return true;
  }

  /**
   * Restore soft-deleted product
   */
  async restoreProduct(id: string): Promise<InsuranceProduct | null> {
    const product = await lmdb.getById<InsuranceProduct>(DB_NAME, id);
    
    if (!product || !product.isDeleted) {
      return null;
    }
    
    const restoredProduct = await lmdb.update<InsuranceProduct>(DB_NAME, id, {
      isDeleted: false,
      deletedAt: undefined,
    } as Partial<InsuranceProduct>);
    
    return restoredProduct;
  }

  /**
   * Get product statistics
   */
  async getProductStatistics() {
    const allProducts = await this.getAllProducts();
    
    return {
      total: allProducts.length,
      active: allProducts.filter((p: InsuranceProduct) => p.status === InsuranceProductStatus.ACTIVE).length,
      inactive: allProducts.filter((p: InsuranceProduct) => p.status === InsuranceProductStatus.INACTIVE).length,
      discontinued: allProducts.filter((p: InsuranceProduct) => p.status === InsuranceProductStatus.DISCONTINUED).length,
      popular: allProducts.filter((p: InsuranceProduct) => p.isPopular).length,
      onlineAvailable: allProducts.filter((p: InsuranceProduct) => p.isAvailableOnline).length,
      byType: Object.values(InsuranceProductType).reduce((acc, type) => {
        acc[type] = allProducts.filter((p: InsuranceProduct) => p.type === type).length;
        return acc;
      }, {} as Record<InsuranceProductType, number>),
      byCategory: Object.values(InsuranceProductCategory).reduce((acc, category) => {
        acc[category] = allProducts.filter((p: InsuranceProduct) => p.category === category).length;
        return acc;
      }, {} as Record<InsuranceProductCategory, number>),
    };
  }
}
