/**
 * English translations index
 * Combines all English translation modules
 */

import { commonEn } from './common';
import { authEn } from './auth';
import { navEn } from './nav';
import { modulesEn } from './modules';
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
  crm: {
    ...crmContactsEn,
    ...crmLeadsEn,
    ...crmDealsEn,
    ...crmActivitiesEn,
    ...crmCampaignsEn,
  },
};
