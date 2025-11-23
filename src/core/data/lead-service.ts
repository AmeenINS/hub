/**
 * Lead Service - Insurance Brokerage CRM
 * Handles all lead-related database operations
 */

import lmdb from './lmdb';
import { Lead, LeadStatus, LeadSource } from '@/shared/types/database';
import { nanoid } from 'nanoid';

export class LeadService {
  private db = lmdb;
  private readonly COLLECTION = 'leads';

  /**
   * Create a new lead
   */
  async createLead(data: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>): Promise<Lead> {
    const lead: Lead = {
      ...data,
      id: nanoid(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.db.create(this.COLLECTION, lead.id, lead);
    return lead;
  }

  /**
   * Get a lead by ID
   */
  async getLeadById(id: string): Promise<Lead | null> {
    return this.db.getById<Lead>(this.COLLECTION, id);
  }

  /**
   * Get all leads
   */
  async getAllLeads(): Promise<Lead[]> {
    return this.db.getAll<Lead>(this.COLLECTION);
  }

  /**
   * Get leads assigned to a specific user
   */
  async getLeadsByAssignedUser(userId: string): Promise<Lead[]> {
    const allLeads = await this.getAllLeads();
    return allLeads.filter(lead => lead.assignedTo === userId);
  }

  /**
   * Get leads by status
   */
  async getLeadsByStatus(status: LeadStatus): Promise<Lead[]> {
    const allLeads = await this.getAllLeads();
    return allLeads.filter(lead => lead.status === status);
  }

  /**
   * Get leads by insurance type
   */
  async getLeadsByInsuranceType(insuranceType: string): Promise<Lead[]> {
    const allLeads = await this.getAllLeads();
    return allLeads.filter(lead => lead.insuranceType === insuranceType);
  }

  /**
   * Get leads by contact
   */
  async getLeadsByContact(contactId: string): Promise<Lead[]> {
    const allLeads = await this.getAllLeads();
    return allLeads.filter(lead => lead.contactId === contactId);
  }

  /**
   * Get leads by company
   */
  async getLeadsByCompany(companyId: string): Promise<Lead[]> {
    const allLeads = await this.getAllLeads();
    return allLeads.filter(lead => lead.companyId === companyId);
  }

  /**
   * Search leads
   */
  async searchLeads(query: string): Promise<Lead[]> {
    const allLeads = await this.getAllLeads();
    const lowerQuery = query.toLowerCase();
    
    return allLeads.filter(lead => 
      lead.title.toLowerCase().includes(lowerQuery) ||
      lead.description?.toLowerCase().includes(lowerQuery) ||
      lead.insuranceType?.toLowerCase().includes(lowerQuery) ||
      lead.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Update a lead
   */
  async updateLead(id: string, data: Partial<Lead>): Promise<Lead> {
    const existing = await this.getLeadById(id);
    if (!existing) {
      throw new Error('Lead not found');
    }

    const updated: Lead = {
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
   * Delete a lead
   */
  async deleteLead(id: string): Promise<void> {
    await this.db.delete(this.COLLECTION, id);
  }

  /**
   * Convert lead to deal
   */
  async convertToDeal(id: string): Promise<void> {
    await this.updateLead(id, {
      status: LeadStatus.CLOSED_WON,
      actualCloseDate: new Date().toISOString(),
    });
  }

  /**
   * Assign lead to user
   */
  async assignLead(id: string, userId: string): Promise<Lead> {
    return this.updateLead(id, { assignedTo: userId });
  }

  /**
   * Get leads requiring follow-up
   */
  async getLeadsRequiringFollowUp(): Promise<Lead[]> {
    const allLeads = await this.getAllLeads();
    const now = new Date().toISOString();
    
    return allLeads.filter(lead => 
      lead.nextFollowUpDate && 
      lead.nextFollowUpDate <= now &&
      lead.status !== LeadStatus.CLOSED_WON &&
      lead.status !== LeadStatus.CLOSED_LOST
    );
  }

  /**
   * Get lead statistics
   */
  async getLeadStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    bySource: Record<string, number>;
    byInsuranceType: Record<string, number>;
    totalValue: number;
    averageValue: number;
  }> {
    const allLeads = await this.getAllLeads();
    
    const byStatus: Record<string, number> = {};
    const bySource: Record<string, number> = {};
    const byInsuranceType: Record<string, number> = {};
    let totalValue = 0;

    allLeads.forEach(lead => {
      byStatus[lead.status] = (byStatus[lead.status] || 0) + 1;
      bySource[lead.source] = (bySource[lead.source] || 0) + 1;
      
      if (lead.insuranceType) {
        byInsuranceType[lead.insuranceType] = (byInsuranceType[lead.insuranceType] || 0) + 1;
      }
      
      if (lead.value) {
        totalValue += lead.value;
      }
    });

    return {
      total: allLeads.length,
      byStatus,
      bySource,
      byInsuranceType,
      totalValue,
      averageValue: allLeads.length > 0 ? totalValue / allLeads.length : 0,
    };
  }
}
