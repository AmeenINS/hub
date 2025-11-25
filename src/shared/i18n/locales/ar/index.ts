/**
 * Arabic translations index
 * Combines all Arabic translation modules
 */

import { commonAr } from './common';
import { authAr } from './auth';
import { navAr } from './nav';
import { modulesAr } from './modules';
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
  crm: {
    ...crmContactsAr,
    ...crmLeadsAr,
    ...crmDealsAr,
    ...crmActivitiesAr,
    ...crmCampaignsAr,
  },
};
