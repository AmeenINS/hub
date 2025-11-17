/**
 * Import Insurance Companies from JSON
 * This script clears existing insurance companies and imports new ones from insurance-companies.json
 * 
 * Usage: npx tsx scripts/import-insurance-companies.ts
 */

import { lmdb } from '../src/core/data/lmdb';
import { InsuranceCompany, InsuranceCompanyStatus } from '../src/shared/types/database';
import { nanoid } from 'nanoid';
import * as fs from 'fs';
import * as path from 'path';

const DB_NAME = 'insuranceCompanies';

interface CompanyImportData {
  id: number;
  name: string;
  category: string;
  crNumber: string;
  licenseNumber: string;
  address: string;
  email: string;
  phone: string;
  website: string;
}

async function clearInsuranceCompanies() {
  console.log('🗑️  Clearing existing insurance companies...');
  
  try {
    const companies = await lmdb.getAll<InsuranceCompany>(DB_NAME);
    
    for (const company of companies) {
      await lmdb.delete(DB_NAME, company.id);
    }
    
    console.log(`✅ Cleared ${companies.length} existing insurance companies`);
  } catch (error) {
    console.error('❌ Error clearing insurance companies:', error);
    throw error;
  }
}

async function importInsuranceCompanies() {
  console.log('📥 Importing insurance companies from JSON...');
  
  try {
    // Read JSON file
    const jsonPath = path.join(process.cwd(), 'insurance-companies.json');
    const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
    const data = JSON.parse(jsonContent);
    
    const companies: CompanyImportData[] = data.insuranceCompanies;
    
    console.log(`📊 Found ${companies.length} companies to import`);
    
    let imported = 0;
    let failed = 0;
    
    // Super admin user ID for created/updated by
    const systemUserId = 'system';
    
    for (const companyData of companies) {
      try {
        // Generate unique code from license number or name
        const code = companyData.licenseNumber.replace(/\//g, '-');
        
        // Create insurance company object
        const company: InsuranceCompany = {
          id: `ic_${nanoid()}`,
          
          // Basic Information
          nameEn: companyData.name,
          nameAr: undefined,
          brandName: undefined,
          code: code,
          licenseNumber: companyData.licenseNumber,
          
          // Contact Information
          email: companyData.email || undefined,
          phone: companyData.phone || undefined,
          mobile: undefined,
          whatsapp: undefined,
          website: companyData.website || undefined,
          addressEn: companyData.address || undefined,
          addressAr: undefined,
          
          // Company Details
          descriptionEn: undefined,
          descriptionAr: undefined,
          logoUrl: undefined,
          
          // Status - Set all companies as ACTIVE
          status: InsuranceCompanyStatus.ACTIVE,
          
          // Metadata
          metadata: {
            crNumber: companyData.crNumber,
            category: companyData.category,
            importedFrom: 'insurance-companies.json',
            importedAt: new Date().toISOString()
          },
          
          // Audit Fields
          createdBy: systemUserId,
          updatedBy: systemUserId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isDeleted: false,
        };
        
        // Save to database
        await lmdb.create(DB_NAME, company.id, company);
        
        imported++;
        console.log(`✅ [${imported}/${companies.length}] Imported: ${company.nameEn}`);
      } catch (error) {
        failed++;
        console.error(`❌ Failed to import company #${companyData.id}:`, error);
      }
    }
    
    console.log('\n📊 Import Summary:');
    console.log(`   ✅ Successfully imported: ${imported}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📈 Total: ${companies.length}`);
    
    return { imported, failed, total: companies.length };
  } catch (error) {
    console.error('❌ Error importing insurance companies:', error);
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting Insurance Companies Import Process\n');
  
  try {
    // Step 1: Clear existing data
    await clearInsuranceCompanies();
    console.log('');
    
    // Step 2: Import new data
    const result = await importInsuranceCompanies();
    
    console.log('\n✨ Import process completed successfully!');
    
    if (result.failed > 0) {
      console.log('\n⚠️  Some companies failed to import. Please check the errors above.');
      process.exit(1);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Import process failed:', error);
    process.exit(1);
  }
}

main();
