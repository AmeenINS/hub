/**
 * Database Type Definitions
 * LMDB Schema Types for User Management and Task Management System
 */

// ==================== User Management ====================

export interface User {
  id: string;
  email: string;
  password: string; // Hashed with Argon2
  fullNameEn: string;
  fullNameAr?: string;
  phoneNumber?: string;
  avatar?: string;
  avatarUrl?: string; // URL to uploaded avatar image (from file upload system)
  // Position for organizational chart
  position?: string;
  department?: string;
  // Optional manager relationship for hierarchical users
  managerId?: string;
  isActive: boolean;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  isSystemRole: boolean; // true for default roles like 'super_admin'
  moduleLevels?: Record<string, number> | string; // Permission levels for each module
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: string;
  module: string; // e.g., 'users', 'tasks', 'roles'
  action: string; // e.g., 'create', 'read', 'update', 'delete'
  resource?: string; // Optional: specific resource type
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  assignedAt: string;
  assignedBy: string;
}

export interface RolePermission {
  id: string;
  roleId: string;
  permissionId: string;
  createdAt: string;
}

// ==================== Position Management ====================

export interface Position {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  level: number; // Hierarchy level (1 = CEO, 2 = Manager, etc.)
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==================== Task Management ====================

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
  CANCELLED = 'CANCELLED',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  startDate?: string;
  completedAt?: string;
  estimatedHours?: number;
  actualHours?: number;
  departmentId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskAssignment {
  id: string;
  taskId: string;
  userId: string;
  assignedBy: string;
  assignedAt: string;
  completionPercentage: number;
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskAttachment {
  id: string;
  taskId: string;
  userId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

export enum TaskActivityType {
  CREATED = 'CREATED',
  STATUS_CHANGED = 'STATUS_CHANGED',
  PRIORITY_CHANGED = 'PRIORITY_CHANGED',
  ASSIGNED = 'ASSIGNED',
  UNASSIGNED = 'UNASSIGNED',
  UPDATED = 'UPDATED',
  COMMENT_ADDED = 'COMMENT_ADDED',
  ATTACHMENT_ADDED = 'ATTACHMENT_ADDED',
  DUE_DATE_CHANGED = 'DUE_DATE_CHANGED',
}

export interface TaskActivity {
  id: string;
  taskId: string;
  userId: string;
  type: TaskActivityType;
  oldValue?: string;
  newValue?: string;
  comment?: string;
  createdAt: string;
}

// ==================== Security & Audit ====================

export interface Session {
  id: string;
  userId: string;
  token: string;
  refreshToken?: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: string;
  createdAt: string;
}

export interface TwoFactorAuth {
  id: string;
  userId: string;
  secret: string;
  backupCodes: string[];
  isEnabled: boolean;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export enum AuditAction {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  LOGIN_FAILED = 'LOGIN_FAILED',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  PERMISSION_CHANGE = 'PERMISSION_CHANGE',
}

export interface AuditLog {
  id: string;
  userId: string;
  action: AuditAction;
  resource: string; // e.g., 'user', 'task', 'role'
  resourceId?: string;
  changes?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

// ==================== Notifications ====================

export enum NotificationType {
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_UPDATED = 'TASK_UPDATED',
  TASK_COMPLETED = 'TASK_COMPLETED',
  TASK_OVERDUE = 'TASK_OVERDUE',
  COMMENT_ADDED = 'COMMENT_ADDED',
  MENTION = 'MENTION',
  SYSTEM = 'SYSTEM',
  SCHEDULED_REMINDER = 'SCHEDULED_REMINDER',
  SCHEDULED_EVENT = 'SCHEDULED_EVENT',
  RECURRING_EVENT = 'RECURRING_EVENT',
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

// ==================== Department (Optional) ====================

export interface Department {
  id: string;
  name: string;
  description?: string;
  managerId?: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== Support ====================

export enum SupportMessageStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  CLOSED = 'CLOSED',
}

export interface SupportMessage {
  id: string;
  userId: string;
  subject: string;
  message: string;
  status: SupportMessageStatus;
  adminReply?: string;
  repliedAt?: string;
  repliedBy?: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== Helper Types ====================

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ==================== CRM System ====================

export enum LeadStatus {
  NEW = 'NEW',
  QUALIFIED = 'QUALIFIED',
  PROPOSAL = 'PROPOSAL',
  NEGOTIATION = 'NEGOTIATION',
  CLOSED_WON = 'CLOSED_WON',
  CLOSED_LOST = 'CLOSED_LOST',
}

export enum LeadSource {
  WEBSITE = 'WEBSITE',
  PHONE = 'PHONE',
  EMAIL = 'EMAIL',
  REFERRAL = 'REFERRAL',
  SOCIAL_MEDIA = 'SOCIAL_MEDIA',
  ADVERTISEMENT = 'ADVERTISEMENT',
  EVENT = 'EVENT',
  OTHER = 'OTHER',
}

export enum ContactType {
  LEAD = 'LEAD',
  CUSTOMER = 'CUSTOMER',
  PARTNER = 'PARTNER',
  SUPPLIER = 'SUPPLIER',
}

export enum DealStage {
  PROSPECTING = 'PROSPECTING',
  QUALIFICATION = 'QUALIFICATION',
  PROPOSAL = 'PROPOSAL',
  NEGOTIATION = 'NEGOTIATION',
  CLOSED_WON = 'CLOSED_WON',
  CLOSED_LOST = 'CLOSED_LOST',
}

export enum ActivityType {
  CALL = 'CALL',
  EMAIL = 'EMAIL',
  MEETING = 'MEETING',
  TASK = 'TASK',
  NOTE = 'NOTE',
}

export enum ActivityStatus {
  PLANNED = 'PLANNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface Contact {
  id: string;
  type: ContactType;
  fullNameEn: string;
  fullNameAr?: string;
  /**
   * Deprecated: maintained for backward compatibility with existing records.
   * Use fullNameEn/fullNameAr fields instead.
   */
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  jobTitle?: string;
  department?: string;
  companyId?: string;
  avatarUrl?: string;
  preferredContactMethod?: 'Email' | 'Phone' | 'SMS' | 'WhatsApp';
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  website?: string;
  socialMedia?: Record<string, string>;
  notes?: string;
  tags?: string[];
  assignedTo?: string; // User ID
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  // Soft Delete Fields
  isDeleted?: boolean;
  deletedAt?: string | null;
  deletedBy?: string | null;
}

export interface Company {
  id: string;
  name: string;
  industry?: string;
  size?: string; // e.g., '1-10', '11-50', '51-200', etc.
  revenue?: number;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  description?: string;
  logoUrl?: string; // URL to uploaded company logo image
  tags?: string[];
  assignedTo?: string; // User ID
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContactNote {
  id: string;
  contactId: string;
  content: string;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Lead {
  id: string;
  contactId: string;
  companyId?: string;
  title: string;
  description?: string;
  status: LeadStatus;
  source: LeadSource;
  value?: number; // Estimated value in OMR
  probability?: number; // 0-100
  expectedCloseDate?: string;
  actualCloseDate?: string;
  
  // Insurance-specific fields
  insuranceProductIds?: string[]; // Products interested in
  insuranceCompanyIds?: string[]; // Insurance companies to consider
  insuranceType?: string; // e.g., 'Health', 'Motor', 'Property', 'Life'
  currentInsuranceProvider?: string;
  currentPremium?: number; // Current premium in OMR
  renewalDate?: string;
  
  // Assignment and tracking
  assignedTo?: string; // User ID
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  lastContactedAt?: string;
  nextFollowUpDate?: string;
  
  tags?: string[];
  notes?: string;
  customFields?: Record<string, any>;
  
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Deal {
  id: string;
  leadId?: string;
  contactId: string;
  companyId?: string;
  name: string;
  description?: string;
  stage: DealStage;
  value: number; // Deal value in OMR
  probability: number; // 0-100
  expectedCloseDate?: string;
  actualCloseDate?: string;
  
  // Insurance-specific fields
  insuranceProductId?: string; // Selected insurance product
  insuranceCompanyId?: string; // Selected insurance company
  insuranceType: string; // 'Health', 'Motor', 'Property', 'Life', etc.
  policyNumber?: string;
  policyStartDate?: string;
  policyEndDate?: string;
  premium: number; // Premium amount in OMR
  premiumFrequency: 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL';
  coverageAmount?: number; // Coverage amount in OMR
  deductible?: number; // Deductible in OMR
  commission?: number; // Commission in OMR
  commissionPercentage?: number;
  
  // Policy details (flexible for different insurance types)
  policyDetails?: Record<string, any>; // Vehicle details, health info, property info, etc.
  
  // Assignment and tracking
  assignedTo?: string; // User ID
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  lostReason?: string; // If CLOSED_LOST
  competitorInfo?: string;
  
  tags?: string[];
  notes?: string;
  customFields?: Record<string, any>;
  
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  type: ActivityType;
  status: ActivityStatus;
  subject: string;
  description?: string;
  startDate: string;
  endDate?: string;
  duration?: number; // in minutes
  location?: string;
  
  // Meeting/Call details
  outcome?: string; // Result of the activity
  attendees?: string[]; // User IDs
  isReminder?: boolean;
  reminderDate?: string;
  
  // Related entities
  contactId?: string;
  companyId?: string;
  leadId?: string;
  dealId?: string;
  campaignId?: string;
  
  // Assignment
  assignedTo?: string; // User ID
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  
  // Tracking
  completedAt?: string;
  customFields?: Record<string, any>;
  
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Pipeline {
  id: string;
  name: string;
  description?: string;
  stages: PipelineStage[];
  isDefault: boolean;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PipelineStage {
  id: string;
  pipelineId: string;
  name: string;
  description?: string;
  probability: number; // 0-100
  order: number;
  color?: string;
  isActive: boolean;
}

export enum CampaignType {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  SOCIAL_MEDIA = 'SOCIAL_MEDIA',
  ADVERTISING = 'ADVERTISING',
  EVENT = 'EVENT',
  WEBINAR = 'WEBINAR',
  DIRECT_MAIL = 'DIRECT_MAIL',
  REFERRAL = 'REFERRAL',
  OTHER = 'OTHER',
}

export enum CampaignStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  type: CampaignType;
  status: CampaignStatus;
  
  // Dates and budget
  startDate?: string;
  endDate?: string;
  budget?: number; // Budget in OMR
  actualCost?: number; // Actual cost in OMR
  
  // Insurance-specific
  insuranceProductIds?: string[]; // Products being promoted
  insuranceType?: string; // Target insurance type
  targetAudience?: string;
  
  // Goals and metrics
  goals?: string;
  targetLeads?: number;
  targetDeals?: number;
  targetRevenue?: number; // in OMR
  
  // Performance metrics
  metrics?: {
    leads?: number;
    deals?: number;
    revenue?: number; // in OMR
    clicks?: number;
    impressions?: number;
    conversions?: number;
    roi?: number; // Return on investment percentage
    [key: string]: any;
  };
  
  // Assignment
  assignedTo?: string; // Campaign manager
  teamMembers?: string[]; // User IDs
  
  tags?: string[];
  customFields?: Record<string, any>;
  
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  variables?: string[]; // Available variables like {{firstName}}
  category?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Report {
  id: string;
  name: string;
  type: string; // Sales, Activity, Performance, etc.
  description?: string;
  config: Record<string, unknown>;
  isPublic: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== Scheduler System ====================

export enum SchedulerType {
  REMINDER = 'REMINDER',
  TASK_DEADLINE = 'TASK_DEADLINE',
  MEETING = 'MEETING',
  FOLLOW_UP = 'FOLLOW_UP',
  CUSTOM = 'CUSTOM',
  RECURRING = 'RECURRING',
}

export enum SchedulerStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  SNOOZED = 'SNOOZED',
}

export enum RecurrenceType {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}

export enum NotificationMethod {
  IN_APP = 'IN_APP',
  PUSH = 'PUSH',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
}

export interface ScheduledEvent {
  id: string;
  title: string;
  description?: string;
  type: SchedulerType;
  status: SchedulerStatus;
  
  // Timing
  scheduledDate: string;
  scheduledTime: string;
  timezone: string;
  
  // Notifications
  notificationMethods: NotificationMethod[];
  notifyBefore?: number; // minutes before the event
  
  // Recurrence
  isRecurring: boolean;
  recurrenceType?: RecurrenceType;
  recurrenceInterval?: number; // e.g., every 2 weeks
  recurrenceEnd?: string; // end date for recurrence
  
  // Related entities
  relatedTaskId?: string;
  relatedContactId?: string;
  relatedDealId?: string;
  
  // Permissions
  createdBy: string;
  assignedTo?: string; // if different from createdBy
  isPrivate: boolean;
  canBeEditedByAssigned: boolean;
  
  // Tracking
  lastNotifiedAt?: string;
  completedAt?: string;
  snoozeUntil?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface ScheduledNotification {
  id: string;
  scheduledEventId: string;
  userId: string;
  method: NotificationMethod;
  title: string;
  message: string;
  
  // Timing
  scheduledFor: string;
  sentAt?: string;
  
  // Status
  isSent: boolean;
  isDelivered: boolean;
  deliveredAt?: string;
  
  // Retry logic
  retryCount: number;
  maxRetries: number;
  lastRetryAt?: string;
  
  // Metadata
  metadata?: Record<string, unknown>;
  
  createdAt: string;
}

// ==================== Location Tracking ====================

export interface UserLocation {
  id: string;
  userId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  speed?: number;
  heading?: number;
  timestamp: string;
  platform?: string;
  isBackground?: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==================== Insurance Products ====================

export enum InsuranceProductStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DISCONTINUED = 'DISCONTINUED',
}

export enum InsuranceProductType {
  MOTOR = 'MOTOR',
  HEALTH = 'HEALTH',
  LIFE = 'LIFE',
  PROPERTY = 'PROPERTY',
  MARINE = 'MARINE',
  TRAVEL = 'TRAVEL',
  GENERAL = 'GENERAL',
  ENGINEERING = 'ENGINEERING',
  WORKMEN_COMPENSATION = 'WORKMEN_COMPENSATION',
  PROFESSIONAL_INDEMNITY = 'PROFESSIONAL_INDEMNITY',
  PUBLIC_LIABILITY = 'PUBLIC_LIABILITY',
  CYBER = 'CYBER',
  OTHER = 'OTHER',
}

export enum InsuranceProductCategory {
  INDIVIDUAL = 'INDIVIDUAL',
  CORPORATE = 'CORPORATE',
  SME = 'SME',
  GOVERNMENT = 'GOVERNMENT',
}

// ==================== Insurance Company Management ====================

export enum InsuranceCompanyStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export interface InsuranceCompany {
  id: string;
  
  // Basic Information
  nameEn: string;
  nameAr?: string;
  brandName?: string; // Brand name (e.g., "Liva" for NLGIC)
  code: string; // Unique company code (e.g., "IC-001")
  licenseNumber?: string; // Company license/registration number
  
  // Contact Information
  email?: string;
  phone?: string; // Office/landline phone number
  mobile?: string; // Mobile phone number
  whatsapp?: string; // WhatsApp number
  website?: string;
  addressEn?: string;
  addressAr?: string;
  
  // Company Details
  descriptionEn?: string;
  descriptionAr?: string;
  logoUrl?: string;
  
  // Status
  status: InsuranceCompanyStatus;
  
  // Metadata
  metadata?: Record<string, unknown>;
  
  // Audit Fields
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  isDeleted?: boolean;
}

// Many-to-many relationship between products and companies
export interface ProductCompanyRelation {
  id: string;
  productId: string;
  companyId: string;
  
  // Company-specific financial details
  commissionRate?: number; // Commission percentage for this company
  commissionType?: 'PERCENTAGE' | 'FIXED';
  fixedCommission?: number;
  
  // Company-specific coverage limits
  minCoverage?: number;
  maxCoverage?: number;
  basePremium?: number;
  
  // Company-specific limitations and requirements
  limitationsEn?: string; // Special limitations for this company
  limitationsAr?: string;
  requirementsEn?: string; // Special requirements for this company
  requirementsAr?: string;
  documentsRequired?: string[]; // Company-specific required documents
  
  // Pricing and terms
  pricingFactorsOverride?: Record<string, unknown>; // Company-specific pricing factors
  minDuration?: number; // Company-specific minimum duration
  maxDuration?: number; // Company-specific maximum duration
  
  // Availability
  isActive: boolean;
  isPreferred?: boolean; // Mark as preferred company for this product
  priority?: number; // Display priority for this company
  
  // Processing details
  processingTimeInDays?: number;
  claimProcessDetailsEn?: string;
  claimProcessDetailsAr?: string;
  
  // Metadata
  notes?: string; // Internal notes about this product-company relationship
  metadata?: Record<string, unknown>;
  
  // Audit Fields
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InsuranceProduct {
  id: string;
  
  // Basic Information
  nameEn: string;
  nameAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  code: string; // Unique product code (e.g., "MOT-001")
  
  // Product Classification
  type: InsuranceProductType;
  category: InsuranceProductCategory;
  
  // Provider Information
  providerId?: string; // Insurance company/provider
  providerNameEn?: string;
  providerNameAr?: string;
  
  // Coverage Details
  coverageDetailsEn?: string;
  coverageDetailsAr?: string;
  exclusionsEn?: string;
  exclusionsAr?: string;
  
  // Financial Information
  basePremium?: number; // Base premium amount
  currency?: string; // Default: OMR
  minCoverage?: number; // Minimum coverage amount
  maxCoverage?: number; // Maximum coverage amount
  
  // Commission Structure
  commissionRate?: number; // Commission percentage
  commissionType?: 'PERCENTAGE' | 'FIXED'; // Commission calculation type
  fixedCommission?: number; // Fixed commission amount if applicable
  
  // Policy Duration
  minDuration?: number; // Minimum policy duration in months
  maxDuration?: number; // Maximum policy duration in months
  defaultDuration?: number; // Default policy duration in months
  
  // Terms & Conditions
  termsConditionsEn?: string;
  termsConditionsAr?: string;
  documentsRequired?: string[]; // Array of required document types
  
  // Product Features
  features?: string[]; // Array of feature keys/descriptions
  benefits?: string[]; // Array of benefit descriptions
  
  // Pricing Configuration
  pricingFactors?: Record<string, unknown>; // Dynamic pricing factors (JSON)
  
  // Additional Information
  targetAudience?: string; // Who is this product for?
  keywords?: string[]; // Search keywords
  iconUrl?: string; // Product icon/image
  brochureUrl?: string; // Product brochure PDF
  
  // Status & Availability
  status: InsuranceProductStatus;
  isAvailableOnline?: boolean; // Can be purchased online
  isPopular?: boolean; // Featured/popular product
  priority?: number; // Display priority (higher = show first)
  
  // Metadata
  metadata?: Record<string, unknown>; // Additional custom fields
  tags?: string[]; // Tags for categorization
  
  // Audit Fields
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  isDeleted?: boolean;
}

// ==================== Email Types ====================

export enum EmailFolderType {
  INBOX = 'INBOX',
  SENT = 'SENT',
  DRAFTS = 'DRAFTS',
  SPAM = 'SPAM',
  TRASH = 'TRASH',
  CUSTOM = 'CUSTOM'
}

export enum EmailPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export interface EmailAccount {
  id: string;
  userId: string;
  displayName?: string;
  email: string;
  
  // IMAP Settings (Receiving)
  imapHost: string;
  imapPort: number;
  imapUseSsl: boolean; // SSL/TLS
  imapUsername: string;
  imapPassword: string; // Encrypted
  
  // SMTP Settings (Sending)
  smtpHost: string;
  smtpPort: number;
  smtpUseSsl: boolean;
  smtpUsername: string;
  smtpPassword: string; // Encrypted
  
  // Settings
  isDefault: boolean;
  syncEnabled?: boolean;
  lastSyncAt?: string;
  signature?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface EmailFolder {
  id: string;
  accountId: string;
  name: string;
  type: EmailFolderType;
  parentId?: string;
  unreadCount: number;
  totalCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface EmailAttachment {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  url?: string;
  content?: string; // Base64 for inline attachments
}

export interface Email {
  id: string;
  accountId: string;
  folderId: string;
  
  // Email Headers
  messageId?: string; // Original message ID from server
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
  subject: string;
  
  // Content
  body: string;
  bodyHtml?: string;
  bodyText?: string;
  
  // Metadata
  priority: EmailPriority;
  isRead: boolean;
  isStarred: boolean;
  isFlagged: boolean;
  isDraft: boolean;
  
  // Attachments
  hasAttachments: boolean;
  attachments?: EmailAttachment[];
  
  // Threading
  inReplyTo?: string;
  references?: string[];
  threadId?: string;
  
  // Dates
  sentAt?: string;
  receivedAt: string;
  createdAt: string;
  updatedAt: string;
  
  // Soft Delete
  isDeleted?: boolean;
  deletedAt?: string;
}

export interface EmailDraft {
  id: string;
  accountId: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  bodyHtml?: string;
  attachments?: EmailAttachment[];
  inReplyTo?: string;
  createdAt: string;
  updatedAt: string;
}
