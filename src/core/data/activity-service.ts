/**
 * Activity Service - Insurance Brokerage CRM
 * Handles all activity-related database operations
 */

import lmdb from './lmdb';
import { Activity, ActivityType, ActivityStatus } from '@/shared/types/database';
import { nanoid } from 'nanoid';

export class ActivityService {
  private db = lmdb;
  private readonly COLLECTION = 'activities';

  /**
   * Create a new activity
   */
  async createActivity(data: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>): Promise<Activity> {
    const activity: Activity = {
      ...data,
      id: nanoid(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.db.create(this.COLLECTION, activity.id, activity);
    return activity;
  }

  /**
   * Get an activity by ID
   */
  async getActivityById(id: string): Promise<Activity | null> {
    return this.db.getById<Activity>(this.COLLECTION, id);
  }

  /**
   * Get all activities
   */
  async getAllActivities(): Promise<Activity[]> {
    return this.db.getAll<Activity>(this.COLLECTION);
  }

  /**
   * Get activities assigned to a user
   */
  async getActivitiesByAssignedUser(userId: string): Promise<Activity[]> {
    const allActivities = await this.getAllActivities();
    return allActivities.filter(activity => activity.assignedTo === userId);
  }

  /**
   * Get activities by type
   */
  async getActivitiesByType(type: ActivityType): Promise<Activity[]> {
    const allActivities = await this.getAllActivities();
    return allActivities.filter(activity => activity.type === type);
  }

  /**
   * Get activities by status
   */
  async getActivitiesByStatus(status: ActivityStatus): Promise<Activity[]> {
    const allActivities = await this.getAllActivities();
    return allActivities.filter(activity => activity.status === status);
  }

  /**
   * Get activities by contact
   */
  async getActivitiesByContact(contactId: string): Promise<Activity[]> {
    const allActivities = await this.getAllActivities();
    return allActivities.filter(activity => activity.contactId === contactId);
  }

  /**
   * Get activities by company
   */
  async getActivitiesByCompany(companyId: string): Promise<Activity[]> {
    const allActivities = await this.getAllActivities();
    return allActivities.filter(activity => activity.companyId === companyId);
  }

  /**
   * Get activities by lead
   */
  async getActivitiesByLead(leadId: string): Promise<Activity[]> {
    const allActivities = await this.getAllActivities();
    return allActivities.filter(activity => activity.leadId === leadId);
  }

  /**
   * Get activities by deal
   */
  async getActivitiesByDeal(dealId: string): Promise<Activity[]> {
    const allActivities = await this.getAllActivities();
    return allActivities.filter(activity => activity.dealId === dealId);
  }

  /**
   * Get activities by campaign
   */
  async getActivitiesByCampaign(campaignId: string): Promise<Activity[]> {
    const allActivities = await this.getAllActivities();
    return allActivities.filter(activity => activity.campaignId === campaignId);
  }

  /**
   * Get activities by date range
   */
  async getActivitiesByDateRange(startDate: string, endDate: string): Promise<Activity[]> {
    const allActivities = await this.getAllActivities();
    return allActivities.filter(activity => 
      activity.startDate >= startDate && activity.startDate <= endDate
    );
  }

  /**
   * Get upcoming activities
   */
  async getUpcomingActivities(userId?: string): Promise<Activity[]> {
    const allActivities = await this.getAllActivities();
    const now = new Date().toISOString();

    let filtered = allActivities.filter(activity => 
      activity.startDate >= now &&
      (activity.status === ActivityStatus.PLANNED || activity.status === ActivityStatus.IN_PROGRESS)
    );

    if (userId) {
      filtered = filtered.filter(activity => activity.assignedTo === userId);
    }

    return filtered.sort((a, b) => a.startDate.localeCompare(b.startDate));
  }

  /**
   * Get overdue activities
   */
  async getOverdueActivities(userId?: string): Promise<Activity[]> {
    const allActivities = await this.getAllActivities();
    const now = new Date().toISOString();

    let filtered = allActivities.filter(activity => 
      activity.startDate < now &&
      activity.status !== ActivityStatus.COMPLETED &&
      activity.status !== ActivityStatus.CANCELLED
    );

    if (userId) {
      filtered = filtered.filter(activity => activity.assignedTo === userId);
    }

    return filtered;
  }

  /**
   * Search activities
   */
  async searchActivities(query: string): Promise<Activity[]> {
    const allActivities = await this.getAllActivities();
    const lowerQuery = query.toLowerCase();
    
    return allActivities.filter(activity => 
      activity.subject.toLowerCase().includes(lowerQuery) ||
      activity.description?.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Update an activity
   */
  async updateActivity(id: string, data: Partial<Activity>): Promise<Activity> {
    const existing = await this.getActivityById(id);
    if (!existing) {
      throw new Error('Activity not found');
    }

    const updated: Activity = {
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
   * Delete an activity
   */
  async deleteActivity(id: string): Promise<void> {
    await this.db.delete(this.COLLECTION, id);
  }

  /**
   * Complete an activity
   */
  async completeActivity(id: string, outcome?: string): Promise<Activity> {
    return this.updateActivity(id, {
      status: ActivityStatus.COMPLETED,
      completedAt: new Date().toISOString(),
      outcome,
    });
  }

  /**
   * Cancel an activity
   */
  async cancelActivity(id: string): Promise<Activity> {
    return this.updateActivity(id, {
      status: ActivityStatus.CANCELLED,
    });
  }

  /**
   * Get activity statistics
   */
  async getActivityStats(userId?: string): Promise<{
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    completed: number;
    overdue: number;
    upcoming: number;
  }> {
    let activities = await this.getAllActivities();
    
    if (userId) {
      activities = activities.filter(activity => activity.assignedTo === userId);
    }

    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    let completed = 0;
    let overdue = 0;
    let upcoming = 0;
    const now = new Date().toISOString();

    activities.forEach(activity => {
      byType[activity.type] = (byType[activity.type] || 0) + 1;
      byStatus[activity.status] = (byStatus[activity.status] || 0) + 1;
      
      if (activity.status === ActivityStatus.COMPLETED) {
        completed++;
      } else if (activity.startDate < now && activity.status !== ActivityStatus.CANCELLED) {
        overdue++;
      } else if (activity.startDate >= now) {
        upcoming++;
      }
    });

    return {
      total: activities.length,
      byType,
      byStatus,
      completed,
      overdue,
      upcoming,
    };
  }
}
