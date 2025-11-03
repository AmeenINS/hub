export interface DefaultPositionSeed {
  name: string;
  nameAr: string;
  description?: string;
  level?: number;
  isActive?: boolean;
}

export const DEFAULT_POSITIONS: DefaultPositionSeed[] = [
  { name: 'Chief Executive Officer', nameAr: 'الرئيس التنفيذي' },
  { name: 'Chief Commercial Officer', nameAr: 'الرئيس التنفيذي التجاري' },
  { name: 'Chief Operating Officer', nameAr: 'الرئيس التنفيذي للعمليات' },
  { name: 'Administrative Manager', nameAr: 'المدير الإداري' },
  { name: 'Head of Finance', nameAr: 'مدير المالية' },
  {
    name: 'Placement & Policy Issuance Team Leader',
    nameAr: 'رئيسة فريق استراتيجيات إصدار الوثائق التأمينية',
  },
  { name: "CEO's Office Manager", nameAr: 'مدير مكتب الرئيس التنفيذي' },
  { name: 'Corporate Affairs Manager', nameAr: 'مدير الشؤون المؤسسية' },
  { name: 'Public Relations Officer Manager', nameAr: 'مدير العلاقات الحكومية' },
  { name: 'Human Resources Manager', nameAr: 'مدير الموارد البشرية' },
  { name: 'Senior Technical Manager', nameAr: 'مدير فني أول' },
  { name: 'Finance & Operations Assistant', nameAr: 'مساعد المالية والعمليات' },
  {
    name: 'Placement & Policy Issuance Officer',
    nameAr: 'مسؤول/مسؤولة استراتيجيات إصدار الوثائق التأمينية',
  },
  { name: 'Digital Development Officer', nameAr: 'مسؤول التطوير الرقمي' },
  { name: 'Business Development Officer', nameAr: 'مسؤول/مسؤولة تطوير الأعمال' },
  { name: 'Senior Insurance Operations Coordinator', nameAr: 'منسقة أولى عمليات التأمين' },
  { name: 'Senior Technical Officer', nameAr: 'فني أول' },
  {
    name: 'Partnerships and Affinities Senior Manager',
    nameAr: 'المدير الأول لإدارة الشراكات والعلاقات الاستراتيجية',
  },
  { name: 'Consultant', nameAr: 'مستشار' },
].map((position, index) => ({
  ...position,
  level: index + 1,
  isActive: true,
  description: position.description ?? '',
}));
