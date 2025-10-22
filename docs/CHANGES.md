# تغییرات انجام شده - Migration به LMDB

## خلاصه

پروژه به طور کامل برای استفاده از **LMDB** به جای PostgreSQL پیکربندی شده است.

## 🔄 تغییرات اصلی

### 1. پیکربندی دیتابیس (Database Configuration)

#### فایل‌های جدید:
- ✅ `src/lib/db/lmdb.ts` - مدیریت اصلی LMDB
- ✅ `src/lib/db/user-service.ts` - سرویس مدیریت کاربران
- ✅ `src/lib/db/task-service.ts` - سرویس مدیریت تسک‌ها
- ✅ `src/lib/db/audit-service.ts` - سرویس لاگ ممیزی
- ✅ `src/lib/db/notification-service.ts` - سرویس اعلان‌ها
- ✅ `src/lib/db/initializer.ts` - راه‌اندازی اولیه دیتابیس
- ✅ `src/types/database.ts` - تعریف تایپ‌های دیتابیس

### 2. احراز هویت و امنیت (Authentication & Security)

#### فایل‌های جدید:
- ✅ `src/lib/auth/jwt.ts` - مدیریت JWT
- ✅ `src/lib/auth/middleware.ts` - Middleware احراز هویت و مجوزها
- ✅ `src/lib/logger.ts` - سیستم لاگینگ با Winston

### 3. API Routes

#### فایل‌های جدید:
- ✅ `src/app/api/auth/login/route.ts` - ورود کاربر
- ✅ `src/app/api/users/route.ts` - مدیریت کاربران (GET, POST)

### 4. مستندات

#### فایل‌های جدید:
- ✅ `docs/DATABASE.md` - راهنمای کامل LMDB
- ✅ `README.md` - به‌روزرسانی شده با اطلاعات LMDB

### 5. تنظیمات پروژه

#### تغییرات در `package.json`:
```json
{
  "dependencies": {
    "lmdb": "^3.2.2",           // دیتابیس LMDB
    "argon2": "^0.41.1",        // هش کردن رمز عبور
    "jsonwebtoken": "^9.0.2",   // JWT
    "nanoid": "^5.0.9",         // تولید ID
    "winston": "^3.17.0"        // لاگینگ
  },
  "devDependencies": {
    "tsx": "^4.19.2",           // اجرای TypeScript
    "@types/jsonwebtoken": "^9.0.7"
  },
  "scripts": {
    "db:init": "tsx scripts/init-db.ts"  // راه‌اندازی دیتابیس
  }
}
```

#### تغییرات در `.env`:
```env
# حذف PostgreSQL
# DATABASE_URL="postgresql://..." ❌

# اضافه شدن LMDB
LMDB_PATH="./data/lmdb"
LMDB_MAX_DBS=10
LMDB_MAP_SIZE=10485760
```

#### تغییرات در `.gitignore`:
```ignore
# LMDB Database
/data/
/logs/
*.mdb
*.lck
```

### 6. اسکریپت‌ها

#### فایل‌های جدید:
- ✅ `scripts/init-db.ts` - اسکریپت راه‌اندازی دیتابیس

## 📊 ساختار دیتابیس LMDB

### Database Stores:

1. **User Management**
   - `users` - کاربران
   - `roles` - نقش‌ها
   - `permissions` - مجوزها
   - `userRoles` - ارتباط کاربر-نقش
   - `rolePermissions` - ارتباط نقش-مجوز

2. **Task Management**
   - `tasks` - تسک‌ها
   - `taskAssignments` - اختصاص تسک‌ها
   - `taskComments` - نظرات
   - `taskAttachments` - فایل‌های پیوست

3. **Security & Audit**
   - `auditLogs` - لاگ ممیزی
   - `sessions` - نشست‌های کاربری
   - `twoFactorAuth` - تنظیمات 2FA

4. **Notifications**
   - `notifications` - اعلان‌ها

## 🚀 نحوه استفاده

### 1. نصب Dependencies
```bash
npm install
```

### 2. راه‌اندازی دیتابیس
```bash
npm run db:init
```

این دستور:
- LMDB را initialize می‌کند
- نقش‌های پیش‌فرض را ایجاد می‌کند (Super Admin, Manager, Employee)
- مجوزها را تنظیم می‌کند
- یک Super Admin ایجاد می‌کند:
  - Email: `admin@ameen.com`
  - Password: `Admin@123456`

### 3. اجرای برنامه
```bash
npm run dev
```

### 4. ورود
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ameen.com","password":"Admin@123456"}'
```

## ✨ ویژگی‌های کلیدی

### امنیت
- ✅ رمزعبور با Argon2 هش می‌شود (OWASP recommended)
- ✅ احراز هویت با JWT
- ✅ پشتیبانی از 2FA
- ✅ لاگ کامل تمام عملیات (Audit Trail)
- ✅ مدیریت دسترسی سطح دقیق (Fine-grained RBAC)

### عملکرد
- ✅ LMDB بسیار سریع است (Memory-mapped)
- ✅ عملیات Read بسیار سریع
- ✅ فشرده‌سازی خودکار داده‌ها
- ✅ مقاوم در برابر Crash

### معماری
- ✅ Clean Architecture
- ✅ Service Layer Pattern
- ✅ Type-Safe با TypeScript
- ✅ Modular و قابل گسترش

## 📝 نقش‌های پیش‌فرض

### Super Admin
- دسترسی کامل به سیستم
- تمام مجوزها

### Manager
- ایجاد و اختصاص تسک
- مشاهده تیم
- تولید گزارش

### Employee
- مشاهده تسک‌های اختصاص‌یافته
- به‌روزرسانی وضعیت تسک
- اضافه کردن نظرات

## 🛠️ API های موجود

### Authentication
- `POST /api/auth/login` - ورود کاربر

### User Management
- `GET /api/users` - دریافت لیست کاربران (نیاز به احراز هویت)
- `POST /api/users` - ایجاد کاربر جدید (نیاز به مجوز)

### در حال توسعه
- Task Management APIs
- Role Management APIs
- Permission Management APIs
- Notification APIs
- Report APIs

## ⚠️ نکات مهم

1. **رمز عبور Super Admin را فوراً تغییر دهید!**
2. `JWT_SECRET` را در production تغییر دهید
3. `LMDB_MAP_SIZE` را بر اساس نیاز تنظیم کنید
4. فولدر `data/` و `logs/` را backup بگیرید

## 📚 مستندات بیشتر

- [راهنمای کامل LMDB](./DATABASE.md)
- [API Documentation](./API.md)

## 🎯 مراحل بعدی

1. ✅ راه‌اندازی پایگاه داده LMDB
2. ✅ پیاده‌سازی Authentication
3. ✅ پیاده‌سازی User Management
4. 🔄 پیاده‌سازی Task Management UI
5. 🔄 پیاده‌سازی Dashboard‌ها
6. 🔄 پیاده‌سازی Notifications
7. 🔄 پیاده‌سازی Reports

---

تمام تغییرات با موفقیت اعمال شد! ✅
