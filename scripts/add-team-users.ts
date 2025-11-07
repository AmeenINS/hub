/**
 * Script to add team users to the database
 * Keeps existing users and adds new ones with their positions
 */

import { UserService, PositionService } from '@/core/data/user-service';

interface TeamMember {
  fullNameEn: string;
  fullNameAr: string;
  positionTitleEn: string;
  positionTitleAr: string;
  email: string;
}

const TEAM_MEMBERS: TeamMember[] = [
  {
    fullNameEn: 'Al Muatasim Al Hashmi',
    fullNameAr: 'المعتصم الهاشمي',
    positionTitleEn: 'Chief Executive Officer',
    positionTitleAr: 'الرئيس التنفيذي',
    email: 'a.alhashmi@ameen.me'
  },
  {
    fullNameEn: 'Basma Al Rashdi',
    fullNameAr: 'بسمة الراشدية',
    positionTitleEn: 'Chief Commercial Officer',
    positionTitleAr: 'الرئيس التنفيذي التجاري',
    email: 'basma.alrashdi@ameen.me'
  },
  {
    fullNameEn: 'Yehthisham Ahmed',
    fullNameAr: 'يهتشام أحمد',
    positionTitleEn: 'Chief Operating Officer',
    positionTitleAr: 'الرئيس التنفيذي للعمليات',
    email: 'yehthisham@ameen.me'
  },
  {
    fullNameEn: 'Hussain Al Habsi',
    fullNameAr: 'حسين الحبسي',
    positionTitleEn: 'Administrative Manager',
    positionTitleAr: 'المدير الإداري',
    email: 'hussain.alhabsi@ameen.me'
  },
  {
    fullNameEn: 'Bimal Das',
    fullNameAr: 'بيمال داس',
    positionTitleEn: 'Head of Finance',
    positionTitleAr: 'مدير المالية',
    email: 'bimaldas@ameen.me'
  },
  {
    fullNameEn: 'Maryam Al Khanjari',
    fullNameAr: 'مريم الخنجرية',
    positionTitleEn: 'Placement & Policy Issuance Team Leader',
    positionTitleAr: 'رئيسة فريق استراتيجيات إصدار الوثائق التأمينية',
    email: 'maryam.alkhanjari@ameen.me'
  },
  {
    fullNameEn: 'Amal Younis',
    fullNameAr: 'أمل علي',
    positionTitleEn: 'CEOs office Manager',
    positionTitleAr: 'مدیر مکتب الرئيس التنفيذي',
    email: 'amal.ali@ameen.me'
  },
  {
    fullNameEn: 'Mohammed Naseef Ismail',
    fullNameAr: 'محمد ناصيف إسماعيل',
    positionTitleEn: 'Corporate Affairs Manager',
    positionTitleAr: 'مدير الشؤون المؤسسية',
    email: 'naseef.ismail@ameen.me'
  },
  {
    fullNameEn: 'Mohammed Al Hashmi',
    fullNameAr: 'محمد الهاشمي',
    positionTitleEn: 'Public Relations Officer Manager',
    positionTitleAr: 'مدير العلاقات الحكومية',
    email: 'm.alhashmi@ameen.me'
  },
  {
    fullNameEn: 'Maram Al Saaduni',
    fullNameAr: 'مرام السعدونية',
    positionTitleEn: 'Human Resources Manager',
    positionTitleAr: 'مدير الموارد البشرية',
    email: 'hr@ameen.me'
  },
  {
    fullNameEn: 'Mahendran Gunasekaran',
    fullNameAr: 'ماهندران غوناسيكران',
    positionTitleEn: 'Senior Technical Manager',
    positionTitleAr: 'مدير فني أول',
    email: 'mahendran@ameen.me'
  },
  {
    fullNameEn: 'Samiya Al Habsi',
    fullNameAr: 'سامية الحبسية',
    positionTitleEn: 'Finance & Operations Assistant',
    positionTitleAr: 'مساعد المالية والعمليات',
    email: 'samiya.alhabsi@ameen.me'
  },
  {
    fullNameEn: 'Ashjan Al Mamari',
    fullNameAr: 'أشجان المعمرية',
    positionTitleEn: 'Placement & Policy Issuance Officer',
    positionTitleAr: 'مسؤولة استراتيجيات إصدار الوثائق التأمينية',
    email: 'ashjan.almamari@ameen.me'
  },
  {
    fullNameEn: 'Mohammed Al Zadjali',
    fullNameAr: 'محمد الزدجالي',
    positionTitleEn: 'Placement & Policy Issuance Officer',
    positionTitleAr: 'مسؤول استراتيجيات إصدار الوثائق التأمينية',
    email: 'mohamed.alzadjali@ameen.me'
  },
  {
    fullNameEn: 'Miad Al Balaushi',
    fullNameAr: 'ميعاد البلوشية',
    positionTitleEn: 'Placement & Policy Issuance Officer',
    positionTitleAr: 'مسؤولة استراتيجيات إصدار الوثائق التأمينية',
    email: 'miaad.albalushi@ameen.me'
  },
  {
    fullNameEn: 'Ausaf Ismail',
    fullNameAr: 'أوسف إسماعيل',
    positionTitleEn: 'Digital Development Officer',
    positionTitleAr: 'مسؤول التطوير الرقمي',
    email: 'ausaf.ismail@ameen.me'
  },
  {
    fullNameEn: 'Narjes AlRuzaiqi',
    fullNameAr: 'نرجس الرزيقية',
    positionTitleEn: 'Business Development Officer',
    positionTitleAr: 'مسؤولة تطوير الأعمال',
    email: 'narjes.alruzaiqi@ameen.me'
  },
  {
    fullNameEn: 'Hasina Al Yarabi',
    fullNameAr: 'حسينة اليعربية',
    positionTitleEn: 'Business Development Officer',
    positionTitleAr: 'مسؤولة تطوير الأعمال',
    email: 'hasina.alyarabi@ameen.me'
  },
  {
    fullNameEn: 'Salman Al Hasany',
    fullNameAr: 'سلمان الحسني',
    positionTitleEn: 'Business Development Officer',
    positionTitleAr: 'مسؤول تطوير الأعمال',
    email: 'salman.alhasani@ameen.me'
  },
  {
    fullNameEn: 'Juhaina Alhabsi',
    fullNameAr: 'جهينة الحبسية',
    positionTitleEn: 'Business Development Officer',
    positionTitleAr: 'مسؤولة تطوير الأعمال',
    email: 'juhaina.alhabsi@ameen.me'
  },
  {
    fullNameEn: 'Zainab Al Dhouyani',
    fullNameAr: 'زينب الضويانية',
    positionTitleEn: 'Senior Insurance Operations Coordinator',
    positionTitleAr: 'منسقة أولى عمليات التأمين',
    email: 'zainab.aldhouyani@ameen.me'
  },
  {
    fullNameEn: 'Ramya Venugopal',
    fullNameAr: 'راميا فينوجوبال',
    positionTitleEn: 'Senior Technical Officer',
    positionTitleAr: 'فني أول',
    email: 'ramya.venugopal@ameen.me'
  },
  {
    fullNameEn: 'Brabin Raj Xavier',
    fullNameAr: 'برابين راج زافير',
    positionTitleEn: 'Senior Technical Officer',
    positionTitleAr: 'فني أول',
    email: 'brabin.raj@ameen.me'
  },
  {
    fullNameEn: 'Rishabh',
    fullNameAr: 'ريشبا',
    positionTitleEn: 'Partnerships and Affinities Senior Manager',
    positionTitleAr: 'المدير أول لإدارة الشراكات والعلاقات الاستراتيجي',
    email: 'partnerships@ameen.me'
  },
  {
    fullNameEn: 'Maryam Daraei Fard',
    fullNameAr: 'مريم دارایی فرد',
    positionTitleEn: 'Consultant',
    positionTitleAr: 'مستشار',
    email: 'maryam.daraeifard@ameen.me'
  },
  {
    fullNameEn: 'Milad Raeisi',
    fullNameAr: 'ميلاد رئیسي',
    positionTitleEn: 'Consultant',
    positionTitleAr: 'مستشار',
    email: 'milad.raeisi@ameen.me'
  }
];

async function addTeamUsers() {
  const userService = new UserService();
  const positionService = new PositionService();

  console.log('🔍 Checking existing users...');
  const existingUsers = await userService.getAllUsers();
  console.log(`Found ${existingUsers.length} existing user(s)`);

  console.log('\n📋 Getting all positions...');
  const positions = await positionService.getAllPositions();
  console.log(`Found ${positions.length} positions`);

  // Create a map of position titles to position IDs
  const positionMap = new Map<string, string>();
  positions.forEach(pos => {
    positionMap.set(pos.name.toLowerCase().trim(), pos.id);
    if (pos.nameAr) {
      positionMap.set(pos.nameAr.toLowerCase().trim(), pos.id);
    }
  });

  // Default password for all users
  const defaultPassword = '12332120@110';
  console.log(`\n🔐 Using default password: ${defaultPassword}`);

  let addedCount = 0;
  let skippedCount = 0;

  console.log('\n👥 Processing team members...\n');

  for (const member of TEAM_MEMBERS) {
    // Check if user already exists
    const existingUser = existingUsers.find(u => 
      u.email.toLowerCase() === member.email.toLowerCase()
    );

    if (existingUser) {
      console.log(`⏭️  Skipping ${member.fullNameEn} (${member.email}) - already exists`);
      skippedCount++;
      continue;
    }

    // Find matching position
    let positionId: string | undefined;
    const posEnKey = member.positionTitleEn.toLowerCase().trim();
    const posArKey = member.positionTitleAr.toLowerCase().trim();
    
    positionId = positionMap.get(posEnKey) || positionMap.get(posArKey);

    // If no exact match, try to find a close match
    if (!positionId) {
      // Try partial match for common positions
      for (const [key, id] of positionMap.entries()) {
        if (
          (posEnKey.includes('manager') && key.includes('manager')) ||
          (posEnKey.includes('officer') && key.includes('officer')) ||
          (posEnKey.includes('consultant') && key.includes('consultant')) ||
          (posEnKey.includes('assistant') && key.includes('assistant')) ||
          (posArKey.includes('مدير') && key.includes('مدير')) ||
          (posArKey.includes('مسؤول') && key.includes('مسؤول')) ||
          (posArKey.includes('مستشار') && key.includes('مستشار'))
        ) {
          positionId = id;
          break;
        }
      }
    }

    try {
      // Create user
      await userService.createUser({
        email: member.email,
        password: defaultPassword,
        fullNameEn: member.fullNameEn,
        fullNameAr: member.fullNameAr,
        isActive: true,
        emailVerified: true,
        position: positionId,
        twoFactorEnabled: false,
      });

      console.log(`✅ Added ${member.fullNameEn} (${member.email})`);
      if (positionId) {
        const position = positions.find(p => p.id === positionId);
        console.log(`   Position: ${position?.name} / ${position?.nameAr}`);
      } else {
        console.log(`   ⚠️  No matching position found for: ${member.positionTitleEn}`);
      }
      addedCount++;
    } catch (error) {
      console.error(`❌ Error adding ${member.fullNameEn}:`, error);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Successfully added: ${addedCount} users`);
  console.log(`⏭️  Skipped (already exists): ${skippedCount} users`);
  console.log(`📊 Total users in database: ${existingUsers.length + addedCount}`);
  console.log('='.repeat(60));
}

// Run the script
addTeamUsers()
  .then(() => {
    console.log('\n✨ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
