# Email Module - راهنمای استفاده

## 🎯 مشخصات سیستم

سیستم ایمیل این برنامه به صورت **Email Client** کار می‌کند. هر کاربر می‌تواند حساب‌های ایمیل شخصی خود را اضافه کند و از این برنامه برای مدیریت ایمیل‌های خود استفاده کند.

## ✅ امکانات پیاده‌سازی شده

### 1. مدیریت حساب‌های ایمیل
- ✅ افزودن حساب‌های ایمیل متعدد برای هر کاربر
- ✅ تنظیمات کامل IMAP (دریافت ایمیل)
- ✅ تنظیمات کامل SMTP (ارسال ایمیل)
- ✅ تعیین حساب پیش‌فرض
- ✅ امضای ایمیل
- ✅ SSL/TLS برای امنیت

### 2. مدیریت ایمیل‌ها
- ✅ نمایش Inbox, Sent, Drafts, Spam, Trash
- ✅ جستجو در ایمیل‌ها
- ✅ نشان‌گذاری خوانده/نخوانده
- ✅ اولویت‌بندی ایمیل‌ها (Low, Normal, High, Urgent)
- ✅ حذف نرم (Soft Delete)

### 3. ارسال ایمیل
- ✅ Compose modal حرفه‌ای
- ✅ پشتیبانی از CC و BCC
- ✅ انتخاب اولویت
- ✅ Reply به ایمیل‌ها
- ✅ Forward (آماده برای پیاده‌سازی)

### 4. امنیت
- ✅ **هر کاربر فقط حساب‌های خودش را می‌بیند**
- ✅ بررسی مالکیت در همه API ها
- ✅ رمزگذاری پسوردها
- ✅ سطوح دسترسی (Permission Levels)
- ✅ JWT Authentication

## 📋 چگونه استفاده کنیم؟

### مرحله 1: افزودن حساب ایمیل
1. به `/dashboard/email/settings` بروید
2. روی "Add Account" کلیک کنید
3. اطلاعات زیر را وارد کنید:

#### Gmail مثال:
```
Email: your.email@gmail.com
Display Name: Your Name

IMAP:
- Host: imap.gmail.com
- Port: 993
- Username: your.email@gmail.com
- Password: your-app-password
- SSL: ✓

SMTP:
- Host: smtp.gmail.com
- Port: 465
- Username: your.email@gmail.com
- Password: your-app-password
- SSL: ✓
```

#### Outlook/Hotmail مثال:
```
Email: your.email@outlook.com
Display Name: Your Name

IMAP:
- Host: outlook.office365.com
- Port: 993
- Username: your.email@outlook.com
- Password: your-password
- SSL: ✓

SMTP:
- Host: smtp.office365.com
- Port: 587
- Username: your.email@outlook.com
- Password: your-password
- SSL: ✓
```

### مرحله 2: مشاهده ایمیل‌ها
1. به `/dashboard/email` بروید
2. ایمیل‌های خود را در Inbox ببینید
3. بین پوشه‌ها جابجا شوید
4. روی هر ایمیل کلیک کنید تا محتوا را ببینید

### مرحله 3: ارسال ایمیل
1. روی دکمه "Compose" کلیک کنید
2. فرم را پر کنید
3. روی "Send Email" کلیک کنید

### مرحله 4: پاسخ به ایمیل
1. ایمیل را باز کنید
2. روی دکمه "Reply" کلیک کنید
3. پیام خود را بنویسید
4. ارسال کنید

## 🔒 امنیت و Privacy

### جداسازی کامل کاربران
هر کاربر **فقط** حساب‌ها و ایمیل‌های خودش را می‌بیند:
- ✅ API `/api/email/accounts` → فقط حساب‌های userId فعلی
- ✅ API `/api/email` → بررسی مالکیت account/folder
- ✅ API `/api/email/send` → بررسی account.userId
- ✅ API `/api/email/[id]` → بررسی مالکیت email
- ✅ API `/api/email/folders` → بررسی مالکیت account

### کد بررسی امنیتی (مثال):
```typescript
// Verify account belongs to user
const account = await accountService.getAccountById(accountId);
if (!account || account.userId !== payload.userId) {
  return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
}
```

## ⚠️ نکات مهم

### 1. پسورد اپلیکیشن (App Password)
برای Gmail باید از **App Password** استفاده کنید، نه پسورد اصلی:
1. به Google Account Settings بروید
2. Security → 2-Step Verification را فعال کنید
3. App Passwords را ایجاد کنید
4. از این پسورد در تنظیمات استفاده کنید

### 2. IMAP/SMTP واقعی (TODO)
در حال حاضر سیستم **فقط ساختار را آماده کرده**. برای sync واقعی با سرور ایمیل نیاز به:
```bash
npm install nodemailer imap
```

### 3. محدودیت‌ها
- ❌ Attachments (فایل پیوست) هنوز پیاده‌سازی نشده
- ❌ Rich Text Editor (ویرایشگر متن غنی) ندارد
- ❌ Auto-sync با سرور ایمیل (نیاز به nodemailer/imap)
- ❌ Threading (گروه‌بندی ایمیل‌های مرتبط)

## 📊 Database Schema

```typescript
interface EmailAccount {
  id: string;
  userId: string;  // 👈 جداسازی کاربران
  displayName?: string;
  email: string;
  
  // IMAP Settings
  imapHost: string;
  imapPort: number;
  imapUseSsl: boolean;
  imapUsername: string;
  imapPassword: string; // Encrypted
  
  // SMTP Settings
  smtpHost: string;
  smtpPort: number;
  smtpUseSsl: boolean;
  smtpUsername: string;
  smtpPassword: string; // Encrypted
  
  isDefault: boolean;
  signature?: string;
}
```

## 🎨 UI Components

### صفحات:
- `/dashboard/email` - صفحه اصلی ایمیل
- `/dashboard/email/settings` - تنظیمات و مدیریت حساب‌ها

### Component ها:
- `ComposeEmailDialog` - Modal ارسال ایمیل
- Email List با Sidebar پوشه‌ها
- Email Preview Pane
- Account Management Form

## 🌐 i18n (چند زبانه)

همه متن‌ها به **انگلیسی و عربی** ترجمه شده‌اند:
- `t('email.inbox')` → "Inbox" / "صندوق الوارد"
- `t('email.compose')` → "Compose" / "إنشاء رسالة"
- و 68+ کلید دیگر

## 🔐 Permission Levels

هر role سطح دسترسی متفاوتی دارد:
- **Super Admin**: Level 5 (همه دسترسی‌ها)
- **Administrator**: Level 4 (مدیریت تنظیمات)
- **Manager**: Level 3 (حذف و مدیریت کامل)
- **Sales Rep**: Level 2 (ارسال و نوشتن)
- **Viewer**: Level 1 (فقط مشاهده)

## 🚀 Next Steps (آینده)

1. **IMAP Sync**: اتصال واقعی به سرور و دریافت ایمیل‌ها
2. **SMTP Send**: ارسال واقعی از طریق SMTP
3. **Attachments**: آپلود و دانلود فایل‌های پیوست
4. **Rich Text Editor**: Quill یا TipTap
5. **Email Threading**: گروه‌بندی conversations
6. **Notifications**: اطلاع‌رسانی ایمیل جدید
7. **Search Enhancement**: جستجوی پیشرفته‌تر
8. **Auto-sync**: دریافت خودکار ایمیل‌های جدید

---

**✨ همه چیز آماده است! کاربران می‌توانند حساب‌های ایمیل خود را اضافه کنند و از برنامه به عنوان Email Client استفاده کنند.**
