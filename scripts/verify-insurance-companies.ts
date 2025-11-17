/**
 * Verify Insurance Companies Import
 * This script verifies the imported insurance companies
 * 
 * Usage: npx tsx scripts/verify-insurance-companies.ts
 */

import { lmdb } from '../src/core/data/lmdb';
import { InsuranceCompany } from '../src/shared/types/database';

const DB_NAME = 'insuranceCompanies';

async function verifyImport() {
  console.log('🔍 Verifying insurance companies import...\n');
  
  try {
    const companies = await lmdb.getAll<InsuranceCompany>(DB_NAME);
    const activeCompanies = companies.filter(c => !c.isDeleted);
    
    console.log(`📊 Total companies: ${activeCompanies.length}\n`);
    
    console.log('📋 List of imported companies:\n');
    console.log('┌────┬──────────────────────────────────────────────────┬──────────────┬───────────────┐');
    console.log('│ #  │ Company Name                                     │ License      │ Status        │');
    console.log('├────┼──────────────────────────────────────────────────┼──────────────┼───────────────┤');
    
    activeCompanies.forEach((company, index) => {
      const name = company.nameEn.padEnd(48).substring(0, 48);
      const license = (company.licenseNumber || 'N/A').padEnd(12);
      const status = company.status.padEnd(13);
      console.log(`│ ${String(index + 1).padStart(2)} │ ${name} │ ${license} │ ${status} │`);
    });
    
    console.log('└────┴──────────────────────────────────────────────────┴──────────────┴───────────────┘');
    
    // Show detailed info for first company
    if (activeCompanies.length > 0) {
      console.log('\n📝 Sample company details (first company):\n');
      const sample = activeCompanies[0];
      console.log(`   ID: ${sample.id}`);
      console.log(`   Name: ${sample.nameEn}`);
      console.log(`   Code: ${sample.code}`);
      console.log(`   License: ${sample.licenseNumber}`);
      console.log(`   Email: ${sample.email}`);
      console.log(`   Phone: ${sample.phone}`);
      console.log(`   Website: ${sample.website}`);
      console.log(`   Address: ${sample.addressEn?.substring(0, 60)}...`);
      console.log(`   Status: ${sample.status}`);
      console.log(`   CR Number: ${sample.metadata?.crNumber}`);
      console.log(`   Created: ${sample.createdAt}`);
    }
    
    console.log('\n✅ Verification completed successfully!');
  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  }
}

verifyImport()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
