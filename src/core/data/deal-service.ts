/**
 * Deal Service - Insurance Brokerage CRM
 * Handles all deal-related database operations
 */

import lmdb from './lmdb';
import { Deal, DealStage } from '@/shared/types/database';
import { nanoid } from 'nanoid';

export class DealService {
  private db = lmdb;
  private readonly COLLECTION = 'deals';

  /**
   * Create a new deal
   */
  async createDeal(data: Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>): Promise<Deal> {
    const deal: Deal = {
      ...data,
      id: nanoid(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.db.create(this.COLLECTION, deal.id, deal);
    return deal;
  }

  /**
   * Get a deal by ID
   */
  async getDealById(id: string): Promise<Deal | null> {
    return this.db.getById<Deal>(this.COLLECTION, id);
  }

  /**
   * Get all deals
   */
  async getAllDeals(): Promise<Deal[]> {
    return this.db.getAll<Deal>(this.COLLECTION);
  }

  /**
   * Get deals assigned to a specific user
   */
  async getDealsByAssignedUser(userId: string): Promise<Deal[]> {
    const allDeals = await this.getAllDeals();
    return allDeals.filter(deal => deal.assignedTo === userId);
  }

  /**
   * Get deals by stage
   */
  async getDealsByStage(stage: DealStage): Promise<Deal[]> {
    const allDeals = await this.getAllDeals();
    return allDeals.filter(deal => deal.stage === stage);
  }

  /**
   * Get deals by insurance type
   */
  async getDealsByInsuranceType(insuranceType: string): Promise<Deal[]> {
    const allDeals = await this.getAllDeals();
    return allDeals.filter(deal => deal.insuranceType === insuranceType);
  }

  /**
   * Get deals by contact
   */
  async getDealsByContact(contactId: string): Promise<Deal[]> {
    const allDeals = await this.getAllDeals();
    return allDeals.filter(deal => deal.contactId === contactId);
  }

  /**
   * Get deals by company
   */
  async getDealsByCompany(companyId: string): Promise<Deal[]> {
    const allDeals = await this.getAllDeals();
    return allDeals.filter(deal => deal.companyId === companyId);
  }

  /**
   * Get deals by lead
   */
  async getDealsByLead(leadId: string): Promise<Deal[]> {
    const allDeals = await this.getAllDeals();
    return allDeals.filter(deal => deal.leadId === leadId);
  }

  /**
   * Search deals
   */
  async searchDeals(query: string): Promise<Deal[]> {
    const allDeals = await this.getAllDeals();
    const lowerQuery = query.toLowerCase();
    
    return allDeals.filter(deal => 
      deal.name.toLowerCase().includes(lowerQuery) ||
      deal.description?.toLowerCase().includes(lowerQuery) ||
      deal.insuranceType.toLowerCase().includes(lowerQuery) ||
      deal.policyNumber?.toLowerCase().includes(lowerQuery) ||
      deal.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Update a deal
   */
  async updateDeal(id: string, data: Partial<Deal>): Promise<Deal> {
    const existing = await this.getDealById(id);
    if (!existing) {
      throw new Error('Deal not found');
    }

    const updated: Deal = {
      ...existing,
      ...data,
      id: existing.id,
      createdAt: existing.createdAt,
      createdBy: existing.createdBy,
      updatedAt: new Date().toISOString(),
    };

    await this.db.update(this.COLLECTION, id, updated);
    return updated;
  }

  /**
   * Delete a deal
   */
  async deleteDeal(id: string): Promise<void> {
    await this.db.delete(this.COLLECTION, id);
  }

  /**
   * Move deal to next stage
   */
  async moveDealToStage(id: string, stage: DealStage): Promise<Deal> {
    return this.updateDeal(id, { stage });
  }

  /**
   * Close deal as won
   */
  async closeDealWon(id: string): Promise<Deal> {
    return this.updateDeal(id, {
      stage: DealStage.CLOSED_WON,
      actualCloseDate: new Date().toISOString(),
      probability: 100,
    });
  }

  /**
   * Close deal as lost
   */
  async closeDealLost(id: string, lostReason?: string): Promise<Deal> {
    return this.updateDeal(id, {
      stage: DealStage.CLOSED_LOST,
      actualCloseDate: new Date().toISOString(),
      probability: 0,
      lostReason,
    });
  }

  /**
   * Assign deal to user
   */
  async assignDeal(id: string, userId: string): Promise<Deal> {
    return this.updateDeal(id, { assignedTo: userId });
  }

  /**
   * Get deal statistics
   */
  async getDealStats(): Promise<{
    total: number;
    byStage: Record<string, number>;
    byInsuranceType: Record<string, number>;
    totalValue: number;
    totalPremium: number;
    totalCommission: number;
    averageValue: number;
    wonDeals: number;
    lostDeals: number;
    winRate: number;
  }> {
    const allDeals = await this.getAllDeals();
    
    const byStage: Record<string, number> = {};
    const byInsuranceType: Record<string, number> = {};
    let totalValue = 0;
    let totalPremium = 0;
    let totalCommission = 0;
    let wonDeals = 0;
    let lostDeals = 0;

    allDeals.forEach(deal => {
      byStage[deal.stage] = (byStage[deal.stage] || 0) + 1;
      byInsuranceType[deal.insuranceType] = (byInsuranceType[deal.insuranceType] || 0) + 1;
      
      totalValue += deal.value;
      totalPremium += deal.premium;
      totalCommission += deal.commission || 0;
      
      if (deal.stage === DealStage.CLOSED_WON) wonDeals++;
      if (deal.stage === DealStage.CLOSED_LOST) lostDeals++;
    });

    const closedDeals = wonDeals + lostDeals;
    const winRate = closedDeals > 0 ? (wonDeals / closedDeals) * 100 : 0;

    return {
      total: allDeals.length,
      byStage,
      byInsuranceType,
      totalValue,
      totalPremium,
      totalCommission,
      averageValue: allDeals.length > 0 ? totalValue / allDeals.length : 0,
      wonDeals,
      lostDeals,
      winRate,
    };
  }

  /**
   * Get deals expiring soon
   */
  async getDealsExpiringSoon(days: number = 30): Promise<Deal[]> {
    const allDeals = await this.getAllDeals();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    const futureDateStr = futureDate.toISOString();

    return allDeals.filter(deal => 
      deal.policyEndDate &&
      deal.policyEndDate <= futureDateStr &&
      deal.stage === DealStage.CLOSED_WON
    );
  }
}
