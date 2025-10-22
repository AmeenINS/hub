# پیاده‌سازی سلسله مراتب کاربران و تسک‌ها

## خلاصه تغییرات

این سند تغییراتی که برای پیاده‌سازی سلسله مراتب کاربران و مدیریت تسک‌های زیرمجموعه انجام شده است را توضیح می‌دهد.

## ۱. تغییرات در ساختار دیتابیس

### اضافه شدن `managerId` به User
- **فایل**: `src/types/database.ts`
- **تغییر**: فیلد اختیاری `managerId?: string` به interface `User` اضافه شد
- **هدف**: ایجاد رابطه سلسله مراتبی بین کاربران (مدیر-کارمند)

```typescript
export interface User {
  id: string;
  email: string;
  // ... سایر فیلدها
  managerId?: string;  // ← جدید
  // ...
}
```

## ۲. متدهای جدید در UserService

### فایل: `src/lib/db/user-service.ts`

#### `getSubordinates(userId: string)`
- برمی‌گرداند: لیست کاربران زیرمجموعه مستقیم (direct reports)
- کاربرانی که `managerId` آنها برابر با `userId` است

#### `getAllSubordinates(userId: string)`
- برمی‌گرداند: تمام کاربران زیرمجموعه به صورت بازگشتی (recursive)
- تمام افراد زیر مجموعه در کل ساختار سازمانی

#### `isSubordinate(userId: string, targetUserId: string)`
- بررسی می‌کند: آیا `targetUserId` یک زیرمجموعه (مستقیم یا غیرمستقیم) از `userId` است؟
- از طریق پیمایش زنجیره مدیران (manager chain)

## ۳. تغییرات در API ساخت کاربر

### فایل: `src/app/api/users/route.ts` (POST)

**قابلیت‌های جدید:**
- دریافت `managerId` اختیاری در body درخواست
- اعتبارسنجی وجود مدیر
- تنظیم `managerId` هنگام ساخت کاربر جدید

```javascript
// نمونه درخواست:
POST /api/users
{
  "email": "employee@example.com",
  "password": "password123",
  "firstName": "Ali",
  "lastName": "Ahmadi",
  "roleId": "role-id",
  "managerId": "manager-user-id"  // ← اختیاری
}
```

## ۴. محدودیت دسترسی در مدیریت کاربران

### فایل: `src/app/api/users/route.ts` (GET)

**تغییر رفتار:**
- قبلاً: تمام کاربران را برمی‌گرداند
- حالا: فقط کاربر فعلی + تمام زیرمجموعه‌های او را برمی‌گرداند

```typescript
// هر مدیر فقط می‌تواند افراد زیرمجموعه خود را ببیند
const allSubordinates = await userService.getAllSubordinates(userId);
const managedUsers = [self, ...allSubordinates];
```

### فایل: `src/app/api/users/[id]/route.ts`

**PATCH (ویرایش کاربر):**
- بررسی می‌شود که آیا کاربر می‌تواند این user را ویرایش کند:
  - خودش را می‌تواند
  - یا زیرمجموعه‌های خود را

**DELETE (حذف کاربر):**
- مشابه PATCH
- فقط خود یا زیرمجموعه‌ها قابل حذف هستند

## ۵. مدیریت تسک‌ها با سلسله مراتب

### فایل: `src/app/api/tasks/route.ts`

#### POST (ساخت تسک جدید)

**قابلیت‌های جدید:**
- دریافت آرایه `assignees` (لیست کاربرانی که تسک به آنها assign می‌شود)
- بررسی اعتبار: سازنده تسک فقط می‌تواند به **خودش** یا **زیرمجموعه‌هایش** تسک assign کند
- ساخت رکوردهای `TaskAssignment` برای هر assignee

```javascript
// نمونه درخواست:
POST /api/tasks
{
  "title": "گزارش ماهانه",
  "description": "تهیه گزارش فروش",
  "priority": "HIGH",
  "assignees": ["employee-1-id", "employee-2-id"]  // ← جدید
}
```

**اعتبارسنجی:**
```typescript
for (const aId of assigneeIds) {
  if (aId === userId) continue;
  const isSub = await userService.isSubordinate(userId, aId);
  if (!isSub) {
    return 403; // نمی‌توان به افراد خارج از تیم assign کرد
  }
}
```

#### GET (دریافت تسک‌ها)

**تغییر رفتار - محدودیت دید (Visibility):**

قبلاً: تمام تسک‌ها برگردانده می‌شد

**حالا فقط تسک‌هایی که کاربر مجاز به دیدن آنهاست:**

1. ✅ تسک‌هایی که خودش ساخته
2. ✅ تسک‌هایی که به خودش assign شده
3. ✅ تسک‌هایی که به **زیرمجموعه‌هایش** (recursive) assign شده

```typescript
// محاسبه تسک‌های قابل مشاهده:
const allSubordinates = await userService.getAllSubordinates(userId);

// تسک‌های assign شده به زیرمجموعه‌ها
for (const subId of allSubordinates) {
  const assignments = await taskAssignmentService.getAssignmentsByUser(subId);
  // ...
}

// فیلتر کردن تسک‌ها
const visibleTasks = allTasks.filter(task => {
  return (
    task.createdBy === userId ||           // سازنده
    myAssignedTaskIds.has(task.id) ||     // assign شده به خودم
    subAssignedTaskIds.has(task.id)       // assign شده به زیرمجموعه‌ها
  );
});
```

## ۶. API مدیریت تسک خاص

### فایل: `src/app/api/tasks/[id]/route.ts` (جدید)

#### GET (دریافت جزئیات یک تسک)
- بررسی دسترسی: سازنده، assignee، یا مدیر assignee‌ها
- برگرداندن تسک همراه با assignments

#### PATCH (ویرایش تسک)
- فقط **سازنده** یا **مدیر assignee‌ها** می‌تواند ویرایش کند

#### DELETE (حذف تسک)
- فقط **سازنده** می‌تواند حذف کند

## ۷. رابط کاربری (UI)

### فایل: `src/app/dashboard/users/new/page.tsx`

**قابلیت‌های جدید:**
- Select Box برای انتخاب مدیر (Manager) هنگام ساخت کاربر جدید
- نمایش لیست تمام کاربران موجود برای انتخاب به عنوان مدیر
- فیلد اختیاری است (می‌توان کاربر بدون مدیر ساخت)

```tsx
<FormField
  name="managerId"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Manager (Optional)</FormLabel>
      <Select onValueChange={field.onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select a manager (optional)" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">No Manager</SelectItem>
          {users.map(user => (
            <SelectItem key={user.id} value={user.id}>
              {user.firstName} {user.lastName} ({user.email})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormItem>
  )}
/>
```

## ۸. سناریوهای استفاده

### سناریو ۱: مدیر فروش و کارمندان فروش

```
مدیر فروش (Sales Manager)
├── کارمند فروش ۱
├── کارمند فروش ۲
└── کارمند فروش ۳
```

**قابلیت‌های مدیر فروش:**
- ✅ می‌تواند تسک برای کارمندان خود ایجاد کند
- ✅ می‌تواند تسک‌های کارمندان را ببیند و مدیریت کند
- ✅ می‌تواند اطلاعات کارمندان را ویرایش کند
- ✅ می‌تواند کارمندان را حذف کند

**محدودیت‌ها:**
- ❌ نمی‌تواند به کاربران خارج از تیم خود تسک assign کند
- ❌ نمی‌تواند تسک‌های بخش‌های دیگر را ببیند

### سناریو ۲: ساختار سلسله مراتبی چندسطحی

```
مدیر کل
└── مدیر فروش
    ├── کارمند فروش ۱
    └── کارمند فروش ۲
```

**قابلیت‌های مدیر کل:**
- ✅ می‌تواند تسک‌های مدیر فروش را ببیند
- ✅ می‌تواند تسک‌های **تمام کارمندان فروش** را ببیند (recursive)
- ✅ می‌تواند به هر یک از آنها تسک assign کند

## ۹. نکات امنیتی

### احراز هویت و مجوزها
- همه endpoint‌ها JWT token را بررسی می‌کنند
- `checkPermission(userId, module, action)` برای تمام عملیات اجرا می‌شود
- بررسی سلسله مراتب (`isSubordinate`) قبل از هر عملیات مدیریتی

### جلوگیری از دسترسی غیرمجاز
```typescript
// مثال: ویرایش کاربر
if (userId !== targetUserId) {
  const isSubordinate = await userService.isSubordinate(userId, targetUserId);
  if (!isSubordinate) {
    return 403; // Forbidden
  }
}
```

## ۱۰. تست دستی

### گام ۱: ساخت کاربران با ساختار سلسله مراتبی

```bash
# ساخت مدیر
POST /api/users
{
  "email": "manager@example.com",
  "password": "password123",
  "firstName": "مدیر",
  "lastName": "فروش",
  "roleId": "manager-role-id"
}

# ساخت کارمند زیرمجموعه
POST /api/users
{
  "email": "employee@example.com",
  "password": "password123",
  "firstName": "کارمند",
  "lastName": "فروش",
  "roleId": "employee-role-id",
  "managerId": "manager-user-id"  // ← ID مدیر
}
```

### گام ۲: ساخت تسک و assign به زیرمجموعه

```bash
# با token مدیر:
POST /api/tasks
Authorization: Bearer <manager-token>
{
  "title": "تهیه گزارش فروش",
  "description": "گزارش هفتگی",
  "priority": "HIGH",
  "assignees": ["employee-user-id"]
}
```

### گام ۳: مشاهده تسک‌ها

```bash
# مدیر می‌تواند تسک کارمند را ببیند:
GET /api/tasks
Authorization: Bearer <manager-token>

# کارمند فقط تسک‌های خودش را می‌بیند:
GET /api/tasks
Authorization: Bearer <employee-token>
```

## ۱۱. نتایج Build

✅ پروژه با موفقیت build شد:
```
✓ Compiled successfully
✓ Finished TypeScript
✓ Generating static pages (15/15)

Routes:
├ ƒ /api/users
├ ƒ /api/users/[id]
├ ƒ /api/tasks
├ ƒ /api/tasks/[id]
└ ○ /dashboard/users/new
```

## ۱۲. نکات توسعه آینده

### پیشنهادات برای بهبود:
1. **UI مدیریت سلسله مراتب:**
   - نمایش organizational chart (نمودار سازمانی)
   - فیلتر کردن تسک‌ها بر اساس بخش/تیم

2. **نوتیفیکیشن:**
   - هشدار به مدیر هنگام تکمیل تسک توسط زیرمجموعه
   - اعلان به کارمند هنگام assign شدن تسک

3. **گزارش‌گیری:**
   - گزارش عملکرد تیم برای مدیران
   - آمار تسک‌های تکمیل شده توسط هر کارمند

4. **دسترسی‌های پیشرفته:**
   - تعریف permission مخصوص "manage_subordinates"
   - Resource-based permissions (دسترسی بر اساس منبع)

---

**تاریخ:** 22 اکتبر 2025  
**نسخه:** 1.0.0  
**وضعیت:** ✅ آماده برای استفاده
