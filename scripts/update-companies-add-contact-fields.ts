/**
 * Update Insurance Companies - Add Mobile and WhatsApp Fields
 * This script updates the database structure to include mobile and WhatsApp fields
 * 
 * Run: npx tsx scripts/update-companies-add-contact-fields.ts
 */

import { InsuranceCompanyService } from '../src/core/data/insurance-companies-service';

async function updateCompaniesStructure() {
  console.log('🚀 Starting insurance companies structure update...\n');

  try {
    const companyService = new InsuranceCompanyService();
    
    // Get all existing companies
    const companies = await companyService.getAllCompanies();
    
    console.log(`📊 Found ${companies.length} companies in database\n`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    // Update each company to ensure it has the new fields (even if empty)
    for (const company of companies) {
      try {
        // Check if company already has the new fields
        const hasNewFields = 'mobile' in company && 'whatsapp' in company;
        
        if (hasNewFields) {
          console.log(`⏭️  Skipped: ${company.nameEn} (already has new fields)`);
          skipped++;
          continue;
        }

        // Update the company to add new fields
        await companyService.updateCompany(
          company.id,
          {
            mobile: company.mobile || undefined,
            whatsapp: company.whatsapp || undefined,
          },
          'system'
        );

        console.log(`✅ Updated: ${company.nameEn}`);
        updated++;

      } catch (error) {
        console.error(`❌ Error updating ${company.nameEn}:`, error);
        errors++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Update Summary:');
    console.log('='.repeat(60));
    console.log(`✅ Successfully updated: ${updated} companies`);
    console.log(`⏭️  Skipped: ${skipped} companies`);
    console.log(`❌ Errors: ${errors} companies`);
    console.log(`📋 Total companies in database: ${companies.length}`);
    console.log('='.repeat(60));

    console.log('\n✨ Structure update completed successfully!');
    console.log('\nℹ️  Note: Companies now have mobile and whatsapp fields.');
    console.log('   You can edit each company to add these contact details.');

  } catch (error) {
    console.error('\n❌ Fatal error during update:', error);
    throw error;
  }
}

// Run the script
updateCompaniesStructure()
  .then(() => {
    console.log('\n👍 Script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
