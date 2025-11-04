/**
 * CRM Database Service
 * Handles all CRM-related database operations using LMDB
 */

import { lmdb } from './lmdb';
import { 
  Contact, 
  Company, 
  Lead, 
  Deal, 
  Activity, 
  Pipeline, 
  Campaign, 
  EmailTemplate,
  LeadStatus,
  DealStage,

} from '@/types/database';
import { nanoid } from 'nanoid';
import { softDelete, restore, filterDeleted, getDeletedOnly } from '@/lib/soft-delete';

// ==================== Contact Service ====================

export class ContactService {
  private readonly dbName = 'contacts';

  async createContact(contactData: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>): Promise<Contact> {
    const id = nanoid();
    const contact: Contact = {
      ...contactData,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await lmdb.create(this.dbName, id, contact);
    return contact;
  }

  async getContactById(id: string): Promise<Contact | null> {
    return lmdb.getById<Contact>(this.dbName, id);
  }

  async getAllContacts(): Promise<Contact[]> {
    const allContacts = await lmdb.getAll<Contact>(this.dbName);
    // Return only non-deleted contacts by default
    return filterDeleted(allContacts);
  }

  async updateContact(id: string, updates: Partial<Contact>): Promise<Contact> {
    const existing = await this.getContactById(id);
    if (!existing) throw new Error('Contact not found');
    
    const updated: Contact = { ...existing, ...updates, id, updatedAt: new Date().toISOString() };
    await lmdb.update(this.dbName, id, updated);
    return updated;
  }

  /**
   * Soft delete a contact
   * Contact is marked as deleted but not physically removed from database
   */
  async softDeleteContact(id: string, userId: string): Promise<boolean> {
    const existing = await lmdb.getById<Contact>(this.dbName, id);
    if (!existing) return false;
    
    const deletedContact = softDelete(existing, { userId });
    await lmdb.update(this.dbName, id, deletedContact);
    return true;
  }

  /**
   * Restore a soft-deleted contact
   */
  async restoreContact(id: string, userId: string): Promise<Contact | null> {
    const existing = await lmdb.getById<Contact>(this.dbName, id);
    if (!existing || !existing.isDeleted) return null;
    
    const restoredContact = restore(existing, { userId });
    await lmdb.update(this.dbName, id, restoredContact);
    return restoredContact;
  }

  /**
   * Get all soft-deleted contacts
   */
  async getDeletedContacts(): Promise<Contact[]> {
    const allContacts = await lmdb.getAll<Contact>(this.dbName);
    return getDeletedOnly(allContacts);
  }

  /**
   * Permanently delete a contact - Admin only
   * WARNING: This cannot be undone!
   */
  async permanentDeleteContact(id: string): Promise<boolean> {
    return lmdb.delete(this.dbName, id);
  }

  /**
   * Legacy delete method - now redirects to soft delete
   * @deprecated Use softDeleteContact instead
   */
  async deleteContact(id: string): Promise<boolean> {
    console.warn('deleteContact is deprecated. Use softDeleteContact instead.');
    return this.softDeleteContact(id, 'system');
  }

  async searchContacts(query: string): Promise<Contact[]> {
    const allContacts = await this.getAllContacts(); // Already filtered (non-deleted)
    const searchTerm = query.toLowerCase();
    return allContacts.filter((contact: Contact) => 
      contact.fullNameEn?.toLowerCase().includes(searchTerm) ||
      contact.fullNameAr?.toLowerCase().includes(searchTerm) ||
      `${contact.firstName ?? ''} ${contact.lastName ?? ''}`.trim().toLowerCase().includes(searchTerm) ||
      contact.firstName?.toLowerCase().includes(searchTerm) ||
      contact.lastName?.toLowerCase().includes(searchTerm) ||
      contact.email?.toLowerCase().includes(searchTerm) ||
      contact.phone?.includes(searchTerm)
    );
  }

  async getContactsByAssignee(userId: string): Promise<Contact[]> {
    const allContacts = await this.getAllContacts();
    return allContacts.filter((contact: Contact) => contact.assignedTo === userId);
  }
}

// ==================== Company Service ====================

export class CompanyService {
  private readonly dbName = 'companies';

  async createCompany(companyData: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>): Promise<Company> {
    const id = nanoid();
    const company: Company = {
      ...companyData,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await lmdb.create(this.dbName, id, company);
    return company;
  }

  async getCompanyById(id: string): Promise<Company | null> {
    return lmdb.getById<Company>(this.dbName, id);
  }

  async getAllCompanies(): Promise<Company[]> {
    return lmdb.getAll<Company>(this.dbName);
  }

  async updateCompany(id: string, updates: Partial<Company>): Promise<Company> {
    const existing = await this.getCompanyById(id);
    if (!existing) throw new Error('Company not found');
    
    const updated: Company = { ...existing, ...updates, id, updatedAt: new Date().toISOString() };
    await lmdb.update(this.dbName, id, updated);
    return updated;
  }

  async deleteCompany(id: string): Promise<boolean> {
    return lmdb.delete(this.dbName, id);
  }

  async searchCompanies(query: string): Promise<Company[]> {
    const allCompanies = await this.getAllCompanies();
    const searchTerm = query.toLowerCase();
    return allCompanies.filter((company: Company) => 
      company.name.toLowerCase().includes(searchTerm) ||
      company.industry?.toLowerCase().includes(searchTerm)
    );
  }
}

// ==================== Lead Service ====================

export class LeadService {
  private readonly dbName = 'leads';

  async createLead(leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>): Promise<Lead> {
    const id = nanoid();
    const lead: Lead = {
      ...leadData,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await lmdb.create(this.dbName, id, lead);
    return lead;
  }

  async getLeadById(id: string): Promise<Lead | null> {
    return lmdb.getById<Lead>(this.dbName, id);
  }

  async getAllLeads(): Promise<Lead[]> {
    return lmdb.getAll<Lead>(this.dbName);
  }

  async updateLead(id: string, updates: Partial<Lead>): Promise<Lead> {
    const existing = await this.getLeadById(id);
    if (!existing) throw new Error('Lead not found');
    
    const updated: Lead = { ...existing, ...updates, id, updatedAt: new Date().toISOString() };
    await lmdb.update(this.dbName, id, updated);
    return updated;
  }

  async deleteLead(id: string): Promise<boolean> {
    return lmdb.delete(this.dbName, id);
  }

  async getLeadsByStatus(status: LeadStatus): Promise<Lead[]> {
    const allLeads = await this.getAllLeads();
    return allLeads.filter((lead: Lead) => lead.status === status);
  }

  async getLeadsByAssignee(userId: string): Promise<Lead[]> {
    const allLeads = await this.getAllLeads();
    return allLeads.filter((lead: Lead) => lead.assignedTo === userId);
  }
}

// ==================== Deal Service ====================

export class DealService {
  private readonly dbName = 'deals';

  async createDeal(dealData: Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>): Promise<Deal> {
    const id = nanoid();
    const deal: Deal = {
      ...dealData,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await lmdb.create(this.dbName, id, deal);
    return deal;
  }

  async getDealById(id: string): Promise<Deal | null> {
    return lmdb.getById<Deal>(this.dbName, id);
  }

  async getAllDeals(): Promise<Deal[]> {
    return lmdb.getAll<Deal>(this.dbName);
  }

  async updateDeal(id: string, updates: Partial<Deal>): Promise<Deal> {
    const existing = await this.getDealById(id);
    if (!existing) throw new Error('Deal not found');
    
    const updated: Deal = { ...existing, ...updates, id, updatedAt: new Date().toISOString() };
    await lmdb.update(this.dbName, id, updated);
    return updated;
  }

  async deleteDeal(id: string): Promise<boolean> {
    return lmdb.delete(this.dbName, id);
  }

  async getDealsByStage(stage: DealStage): Promise<Deal[]> {
    const allDeals = await this.getAllDeals();
    return allDeals.filter((deal: Deal) => deal.stage === stage);
  }

  async getDealsByAssignee(userId: string): Promise<Deal[]> {
    const allDeals = await this.getAllDeals();
    return allDeals.filter((deal: Deal) => deal.assignedTo === userId);
  }
}

// ==================== Activity Service ====================

export class ActivityService {
  private readonly dbName = 'activities';

  async createActivity(activityData: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>): Promise<Activity> {
    const id = nanoid();
    const activity: Activity = {
      ...activityData,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await lmdb.create(this.dbName, id, activity);
    return activity;
  }

  async getActivityById(id: string): Promise<Activity | null> {
    return lmdb.getById<Activity>(this.dbName, id);
  }

  async getAllActivities(): Promise<Activity[]> {
    return lmdb.getAll<Activity>(this.dbName);
  }

  async updateActivity(id: string, updates: Partial<Activity>): Promise<Activity> {
    const existing = await this.getActivityById(id);
    if (!existing) throw new Error('Activity not found');
    
    const updated: Activity = { ...existing, ...updates, id, updatedAt: new Date().toISOString() };
    await lmdb.update(this.dbName, id, updated);
    return updated;
  }

  async deleteActivity(id: string): Promise<boolean> {
    return lmdb.delete(this.dbName, id);
  }

  async getActivitiesByContact(contactId: string): Promise<Activity[]> {
    const allActivities = await this.getAllActivities();
    return allActivities.filter((activity: Activity) => activity.contactId === contactId);
  }

  async getActivitiesByAssignee(userId: string): Promise<Activity[]> {
    const allActivities = await this.getAllActivities();
    return allActivities.filter((activity: Activity) => activity.assignedTo === userId);
  }
}

// ==================== Pipeline Service ====================

export class PipelineService {
  private readonly dbName = 'pipelines';

  async createPipeline(pipelineData: Omit<Pipeline, 'id' | 'createdAt' | 'updatedAt'>): Promise<Pipeline> {
    const id = nanoid();
    const pipeline: Pipeline = {
      ...pipelineData,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await lmdb.create(this.dbName, id, pipeline);
    return pipeline;
  }

  async getPipelineById(id: string): Promise<Pipeline | null> {
    return lmdb.getById<Pipeline>(this.dbName, id);
  }

  async getAllPipelines(): Promise<Pipeline[]> {
    return lmdb.getAll<Pipeline>(this.dbName);
  }

  async updatePipeline(id: string, updates: Partial<Pipeline>): Promise<Pipeline> {
    const existing = await this.getPipelineById(id);
    if (!existing) throw new Error('Pipeline not found');
    
    const updated: Pipeline = { ...existing, ...updates, id, updatedAt: new Date().toISOString() };
    await lmdb.update(this.dbName, id, updated);
    return updated;
  }

  async deletePipeline(id: string): Promise<boolean> {
    return lmdb.delete(this.dbName, id);
  }
}

// ==================== Campaign Service ====================

export class CampaignService {
  private readonly dbName = 'campaigns';

  async createCampaign(campaignData: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'>): Promise<Campaign> {
    const id = nanoid();
    const campaign: Campaign = {
      ...campaignData,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await lmdb.create(this.dbName, id, campaign);
    return campaign;
  }

  async getCampaignById(id: string): Promise<Campaign | null> {
    return lmdb.getById<Campaign>(this.dbName, id);
  }

  async getAllCampaigns(): Promise<Campaign[]> {
    return lmdb.getAll<Campaign>(this.dbName);
  }

  async updateCampaign(id: string, updates: Partial<Campaign>): Promise<Campaign> {
    const existing = await this.getCampaignById(id);
    if (!existing) throw new Error('Campaign not found');
    
    const updated: Campaign = { ...existing, ...updates, id, updatedAt: new Date().toISOString() };
    await lmdb.update(this.dbName, id, updated);
    return updated;
  }

  async deleteCampaign(id: string): Promise<boolean> {
    return lmdb.delete(this.dbName, id);
  }
}

// ==================== Email Template Service ====================

export class EmailTemplateService {
  private readonly dbName = 'email_templates';

  async createTemplate(templateData: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<EmailTemplate> {
    const id = nanoid();
    const template: EmailTemplate = {
      ...templateData,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await lmdb.create(this.dbName, id, template);
    return template;
  }

  async getTemplateById(id: string): Promise<EmailTemplate | null> {
    return lmdb.getById<EmailTemplate>(this.dbName, id);
  }

  async getAllTemplates(): Promise<EmailTemplate[]> {
    return lmdb.getAll<EmailTemplate>(this.dbName);
  }

  async updateTemplate(id: string, updates: Partial<EmailTemplate>): Promise<EmailTemplate> {
    const existing = await this.getTemplateById(id);
    if (!existing) throw new Error('Email template not found');
    
    const updated: EmailTemplate = { ...existing, ...updates, id, updatedAt: new Date().toISOString() };
    await lmdb.update(this.dbName, id, updated);
    return updated;
  }

  async deleteTemplate(id: string): Promise<boolean> {
    return lmdb.delete(this.dbName, id);
  }
}
