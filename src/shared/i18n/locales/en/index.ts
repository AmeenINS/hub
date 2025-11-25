/**
 * English translations index
 * Combines all English translation modules
 */

import { commonEn } from './common';
import { authEn } from './auth';
import { navEn } from './nav';
import { modulesEn } from './modules';
import { dashboardEn } from './dashboard';
import { TasksEn } from './tasks';
import { NotesEn } from './notes';
import { PermissionsEn } from './permissions';
import { UsersEn } from './users';
import { RolesEn } from './roles';
import { ReportsEn } from './reports';
import { NotificationsEn } from './notifications';
import { SettingsEn } from './settings';
import { InsuranceproductsEn } from './insuranceProducts';
import { CalculatorEn } from './calculator';
import { TrackingEn } from './tracking';
import { SupportEn } from './support';
import { EmailEn } from './email';
import { MessagesEn } from './messages';
import { ValidationEn } from './validation';
import { accessDeniedEn } from './access-denied';
import { crmContactsEn } from './crm-contacts';
import { crmLeadsEn } from './crm-leads';
import { crmDealsEn } from './crm-deals';
import { crmActivitiesEn } from './crm-activities';
import { crmCampaignsEn } from './crm-campaigns';

export const en = {
  common: commonEn,
  auth: authEn,
  nav: navEn,
  modules: modulesEn,
  dashboard: dashboardEn,
  tasks: TasksEn,
  notes: NotesEn,
  permissions: PermissionsEn,
  users: UsersEn,
  roles: RolesEn,
  reports: ReportsEn,
  notifications: NotificationsEn,
  settings: SettingsEn,
  insuranceProducts: InsuranceproductsEn,
  calculator: CalculatorEn,
  tracking: TrackingEn,
  support: SupportEn,
  email: EmailEn,
  messages: MessagesEn,
  validation: ValidationEn,
  accessDenied: accessDeniedEn,
  crm: {
    ...crmContactsEn,
    ...crmLeadsEn,
    ...crmDealsEn,
    ...crmActivitiesEn,
    ...crmCampaignsEn,
  },
};
