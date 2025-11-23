/**
 * Campaign Service - Insurance Brokerage CRM
 * Handles all campaign-related database operations
 */

import lmdb from './lmdb';
import { Campaign, CampaignType, CampaignStatus } from '@/shared/types/database';
import { nanoid } from 'nanoid';

export class CampaignService {
  private db = lmdb;
  private readonly COLLECTION = 'campaigns';

  async createCampaign(data: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'>): Promise<Campaign> {
    const campaign: Campaign = {
      ...data,
      id: nanoid(),
      metrics: data.metrics || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.db.create(this.COLLECTION, campaign.id, campaign);
    return campaign;
  }

  async getCampaignById(id: string): Promise<Campaign | null> {
    return this.db.getById<Campaign>(this.COLLECTION, id);
  }

  async getAllCampaigns(): Promise<Campaign[]> {
    return this.db.getAll<Campaign>(this.COLLECTION);
  }

  async getCampaignsByType(type: CampaignType): Promise<Campaign[]> {
    const allCampaigns = await this.getAllCampaigns();
    return allCampaigns.filter(campaign => campaign.type === type);
  }

  async getCampaignsByStatus(status: CampaignStatus): Promise<Campaign[]> {
    const allCampaigns = await this.getAllCampaigns();
    return allCampaigns.filter(campaign => campaign.status === status);
  }

  async searchCampaigns(query: string): Promise<Campaign[]> {
    const allCampaigns = await this.getAllCampaigns();
    const lowerQuery = query.toLowerCase();
    
    return allCampaigns.filter(campaign => 
      campaign.name.toLowerCase().includes(lowerQuery) ||
      campaign.description?.toLowerCase().includes(lowerQuery)
    );
  }

  async updateCampaign(id: string, data: Partial<Campaign>): Promise<Campaign> {
    const existing = await this.getCampaignById(id);
    if (!existing) throw new Error('Campaign not found');

    const updated: Campaign = {
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

  async deleteCampaign(id: string): Promise<void> {
    await this.db.delete(this.COLLECTION, id);
  }

  async updateMetrics(id: string, metrics: Record<string, any>): Promise<Campaign> {
    const existing = await this.getCampaignById(id);
    if (!existing) throw new Error('Campaign not found');

    return this.updateCampaign(id, {
      metrics: { ...existing.metrics, ...metrics }
    });
  }

  async getCampaignStats(): Promise<{
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    totalBudget: number;
    totalCost: number;
    totalLeads: number;
    totalDeals: number;
    totalRevenue: number;
  }> {
    const allCampaigns = await this.getAllCampaigns();
    
    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    let totalBudget = 0;
    let totalCost = 0;
    let totalLeads = 0;
    let totalDeals = 0;
    let totalRevenue = 0;

    allCampaigns.forEach(campaign => {
      byType[campaign.type] = (byType[campaign.type] || 0) + 1;
      byStatus[campaign.status] = (byStatus[campaign.status] || 0) + 1;
      
      if (campaign.budget) totalBudget += campaign.budget;
      if (campaign.actualCost) totalCost += campaign.actualCost;
      if (campaign.metrics?.leads) totalLeads += campaign.metrics.leads;
      if (campaign.metrics?.deals) totalDeals += campaign.metrics.deals;
      if (campaign.metrics?.revenue) totalRevenue += campaign.metrics.revenue;
    });

    return {
      total: allCampaigns.length,
      byType,
      byStatus,
      totalBudget,
      totalCost,
      totalLeads,
      totalDeals,
      totalRevenue,
    };
  }
}
