/**
 * Arabic translations index
 * Combines all Arabic translation modules
 */

import { commonAr } from './common';
import { authAr } from './auth';
import { navAr } from './nav';
import { modulesAr } from './modules';
import { dashboardAr } from './dashboard';
import { TasksAr } from './tasks';
import { NotesAr } from './notes';
import { PermissionsAr } from './permissions';
import { UsersAr } from './users';
import { RolesAr } from './roles';
import { ReportsAr } from './reports';
import { NotificationsAr } from './notifications';
import { SettingsAr } from './settings';
import { InsuranceproductsAr } from './insuranceProducts';
import { CalculatorAr } from './calculator';
import { TrackingAr } from './tracking';
import { SupportAr } from './support';
import { EmailAr } from './email';
import { MessagesAr } from './messages';
import { ValidationAr } from './validation';
import { accessDeniedAr } from './access-denied';
import { crmContactsAr } from './crm-contacts';
import { crmLeadsAr } from './crm-leads';
import { crmDealsAr } from './crm-deals';
import { crmActivitiesAr } from './crm-activities';
import { crmCampaignsAr } from './crm-campaigns';

export const ar = {
  common: commonAr,
  auth: authAr,
  nav: navAr,
  modules: modulesAr,
  dashboard: dashboardAr,
  tasks: TasksAr,
  notes: NotesAr,
  permissions: PermissionsAr,
  users: UsersAr,
  roles: RolesAr,
  reports: ReportsAr,
  notifications: NotificationsAr,
  settings: SettingsAr,
  insuranceProducts: InsuranceproductsAr,
  calculator: CalculatorAr,
  tracking: TrackingAr,
  support: SupportAr,
  email: EmailAr,
  messages: MessagesAr,
  validation: ValidationAr,
  accessDenied: accessDeniedAr,
  crm: {
    ...crmContactsAr,
    ...crmLeadsAr,
    ...crmDealsAr,
    ...crmActivitiesAr,
    ...crmCampaignsAr,
  },
};
