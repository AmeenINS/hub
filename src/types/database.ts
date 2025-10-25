/**
 * Database Type Definitions
 * LMDB Schema Types for User Management and Task Management System
 */

// ==================== User Management ====================

export interface User {
  id: string;
  email: string;
  password: string; // Hashed with Argon2
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  avatar?: string;
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
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  mobile?: string;
  jobTitle?: string;
  department?: string;
  companyId?: string;
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
  tags?: string[];
  assignedTo?: string; // User ID
  createdBy: string;
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
  value?: number;
  probability?: number; // 0-100
  expectedCloseDate?: string;
  actualCloseDate?: string;
  assignedTo?: string; // User ID
  tags?: string[];
  notes?: string;
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
  value: number;
  probability: number; // 0-100
  expectedCloseDate?: string;
  actualCloseDate?: string;
  assignedTo?: string; // User ID
  tags?: string[];
  notes?: string;
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
  attendees?: string[]; // User IDs
  contactId?: string;
  companyId?: string;
  leadId?: string;
  dealId?: string;
  assignedTo?: string; // User ID
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

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  type: string; // Email, Social, Ad, etc.
  status: string; // Draft, Active, Paused, Completed
  startDate?: string;
  endDate?: string;
  budget?: number;
  targetAudience?: string;
  goals?: string;
  metrics?: Record<string, number>;
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
