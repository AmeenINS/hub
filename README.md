# Ameen Hub - Enterprise Platform

> **Modern, bilingual (Arabic/English), permission-based enterprise platform built with Next.js 16**

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

## 📚 Documentation

- **[Complete Documentation](docs/README.md)** - Technical documentation index
- **[Soft Delete System](docs/soft-delete/README.md)** - Logical deletion with recovery
- **[Development Guide](DEVELOPMENT_GUIDE.md)** - Development guidelines
- **[Copilot Instructions](.github/copilot-instructions.md)** - AI development rules
- **[Mobile Setup](docs/MOBILE_SETUP.md)** - Build Capacitor Android and iOS shells

---

## 🌟 Overview

Ameen Hub is a comprehensive enterprise platform featuring advanced permission management, bilingual support (Arabic & English), and a modular architecture designed for scalability and security.

## ✨ Key Features

### 🔐 Advanced Permission System
- **Granular Access Control**: Module-Action based permissions (e.g., `contacts.view`, `contacts.create`)
- **Role-Based Access**: Flexible role management with custom permission sets
- **UI-Level Security**: Permission checks before rendering (optimal UX)
- **API-Level Security**: Every endpoint protected with authentication and authorization
- **Dynamic Permissions**: Easy to add new features with automatic permission integration

### 🗑️ Soft Delete System
- **No Physical Deletion**: All data can be recovered
- **Audit Trail**: Complete history of who deleted what and when
- **Trash View**: View and restore deleted items
- **Auto-Cleanup**: Optional permanent deletion after 30 days
- **GDPR Compliant**: Meets data retention requirements

### 🌍 Full Internationalization (i18n)
- **Bilingual Support**: Complete Arabic and English translations
- **RTL Support**: Automatic right-to-left layout for Arabic
- **Centralized Translations**: All text in structured translation files
- **Type-Safe**: TypeScript support for translation keys

### 🎨 Modern UI/UX
- **shadcn/ui Components**: Beautiful, accessible component library
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Dark/Light Mode**: Theme switching support
- **Loading States**: Skeleton loaders and progress indicators
- **Error Handling**: User-friendly error messages and recovery options

### 👥 User Management
- User CRUD operations with permissions
- Role assignment and management
- Profile management with avatar upload
- Activity tracking and audit logs
- Password management and security

### 📊 CRM System
- **Contacts**: Lead, Customer, Supplier, Partner management
- **Companies**: Organization management with relationships
- **Deals**: Sales pipeline and opportunity tracking
- **Tasks**: Task assignment and tracking
- **Reports**: Analytics and reporting tools

### 📅 Scheduler System
- Event creation and management
- Recurring events support
- Notifications and reminders
- Calendar views (day, week, month)
- Time zone support

### 🔒 Security
- JWT-based authentication with httpOnly cookies
- Argon2 password hashing
- CSRF protection
- Rate limiting
- Input validation (client & server)
- XSS prevention
- SQL injection prevention (Prisma ORM)

## 🛠️ Tech Stack

### Core
- **Framework**: Next.js 16.0 with App Router
- **Language**: TypeScript 5.0
- **React**: React 19
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT + Argon2

### UI & Styling
- **UI Library**: shadcn/ui (Radix UI)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod validation
- **Toast**: Sonner

### State & Data
- **Global State**: Zustand
- **API Client**: Custom centralized client with automatic auth
- **Data Fetching**: Server Components + Client Components

### Development
- **Package Manager**: npm
- **Linting**: ESLint
- **Type Checking**: TypeScript
- **Build Tool**: Next.js with Turbopack

## 📦 Installation

```bash
# Clone repository
git clone https://github.com/AmeenINS/hub.git
cd hub

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Set up database
npx prisma generate
npx prisma db push

# Run initial setup (creates admin user and permissions)
npx tsx scripts/init-db.ts

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and login with:
- **Email**: `admin@ameen.com`
- **Password**: `Admin@123456`
- ⚠️ **Change this password immediately!**

## 📁 Project Structure

```
hub/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   │   ├── auth/         # Authentication endpoints
│   │   │   ├── crm/          # CRM endpoints
│   │   │   ├── permissions/  # Permission management
│   │   │   └── users/        # User management
│   │   ├── dashboard/        # Protected dashboard pages
│   │   │   ├── crm/         # CRM pages
│   │   │   ├── users/       # User management pages
│   │   │   └── roles/       # Role management pages
│   │   └── login/           # Login page
│   │
│   ├── components/            # React components
│   │   ├── ui/              # shadcn/ui components
│   │   ├── dashboard/       # Dashboard-specific components
│   │   └── crm/            # CRM-specific components
│   │
│   ├── hooks/                # Custom React hooks
│   │   ├── use-permissions.ts  # Permission hooks
│   │   └── use-translation.ts  # Translation hook
│   │
│   ├── lib/                  # Utility libraries
│   │   ├── api-client.ts    # Centralized API client
│   │   ├── auth/           # Authentication utilities
│   │   │   ├── jwt.ts      # JWT token management
│   │   │   └── permissions.ts # Permission checking
│   │   ├── db/             # Database utilities
│   │   │   └── prisma.ts   # Prisma client
│   │   └── i18n/           # Internationalization
│   │       └── translations.ts # EN/AR translations
│   │
│   ├── store/               # Zustand global state
│   │   └── auth-store.ts   # Authentication state
│   │
│   └── types/              # TypeScript type definitions
│       └── database.ts     # Database types
│
├── scripts/                # Database and setup scripts
│   ├── init-db.ts         # Initialize database
│   ├── add-crm-permissions.ts
│   └── create-super-admin.ts
│
├── docs/                   # Documentation
│   └── EXAMPLE_NEW_FEATURE.md # Complete feature example
│
├── .github/
│   └── copilot-instructions.md # GitHub Copilot rules
│
├── DEVELOPMENT_GUIDE.md   # Comprehensive development guide
├── QUICK_REFERENCE.md     # Quick reference for common tasks
└── README.md             # This file
```

## 🎯 Core Development Principles

### 1. **Every UI Element Must Be Bilingual**
```typescript
// ❌ Wrong
<Button>Save</Button>

// ✅ Correct
import { useTranslation } from '@/hooks/use-translation';
const { t } = useTranslation();
<Button>{t('common.save')}</Button>
```

### 2. **Every Feature Must Have Permissions**
```typescript
// ❌ Wrong - No permission check
<Button onClick={handleDelete}>Delete</Button>

// ✅ Correct - Permission check
const { permissions } = useModulePermissions('contacts');
{permissions.canDelete && (
  <Button onClick={handleDelete}>Delete</Button>
)}
```

### 3. **Always Use apiClient**
```typescript
// ❌ Wrong
const response = await fetch('/api/contacts');

// ✅ Correct
import { apiClient } from '@/lib/api-client';
const response = await apiClient.get('/api/contacts');
```

### 4. **Check Permissions Before Rendering**
```typescript
// ✅ Optimal UX - Check before mount
useEffect(() => {
  if (!permLoading && !permissions.canView) {
    router.push('/dashboard/access-denied');
  }
}, [permissions, permLoading]);
```

## 🚀 Quick Start - Adding a New Feature

### Step 1: Add Translations
```typescript
// src/lib/i18n/translations.ts
export const translations = {
  en: {
    myFeature: {
      title: 'My Feature',
      create: 'Create New'
    }
  },
  ar: {
    myFeature: {
      title: 'ميزتي',
      create: 'إنشاء جديد'
    }
  }
};
```

### Step 2: Create Permissions
```bash
# Create script: scripts/add-my-feature-permissions.ts
npx tsx scripts/add-my-feature-permissions.ts
```

### Step 3: Create API Route
```typescript
// app/api/my-feature/route.ts
import { verifyToken } from '@/lib/auth/jwt';
import { checkUserPermission } from '@/lib/auth/permissions';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  const decoded = verifyToken(token);
  
  const hasPermission = await checkUserPermission(
    decoded.userId,
    'myFeature',
    'view'
  );
  
  if (!hasPermission) {
    return NextResponse.json({ success: false }, { status: 403 });
  }
  
  // Your logic here
}
```

### Step 4: Create Component
```typescript
// app/dashboard/my-feature/page.tsx
'use client';

import { useModulePermissions } from '@/hooks/use-permissions';
import { useTranslation } from '@/hooks/use-translation';

export default function MyFeaturePage() {
  const { t } = useTranslation();
  const { permissions, isLoading } = useModulePermissions('myFeature');
  
  if (isLoading) return <div>Loading...</div>;
  if (!permissions.canView) return null;
  
  return <div>{t('myFeature.title')}</div>;
}
```

See [docs/EXAMPLE_NEW_FEATURE.md](docs/EXAMPLE_NEW_FEATURE.md) for complete example.

## 📚 Documentation

- **[DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md)** - Comprehensive development guide
- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Quick reference for common tasks
- **[.github/copilot-instructions.md](.github/copilot-instructions.md)** - GitHub Copilot rules
- **[docs/EXAMPLE_NEW_FEATURE.md](docs/EXAMPLE_NEW_FEATURE.md)** - Complete feature example

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 🏗️ Building for Production

```bash
# Build the application
npm run build

# Start production server
npm run start
```

## 🌐 Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ameen_hub"

# JWT Authentication
JWT_SECRET="your-secret-key-change-this-in-production"
JWT_EXPIRES_IN="7d"

# NextAuth
NEXTAUTH_SECRET="your-nextauth-secret-change-this"
NEXTAUTH_URL="http://localhost:3000"

# App
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

## 🤝 Contributing

1. Read [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md)
2. Create a feature branch
3. Follow the coding standards
4. Add translations (EN + AR)
5. Add permissions
6. Write tests
7. Submit pull request

### Coding Standards

- ✅ Use TypeScript (no `any` types)
- ✅ Use `apiClient` for all API calls
- ✅ Add all text to translation files
- ✅ Add permissions for all features
- ✅ Use shadcn/ui components
- ✅ Write responsive code (mobile-first)
- ✅ Add error handling
- ✅ Write tests

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## � Team

**Maintained by**: Ameen INS Development Team

## 🐛 Issues & Support

For issues and support, please open an issue on GitHub or contact the development team.

## 🚀 Roadmap

- [ ] Multi-tenancy support
- [ ] Advanced reporting and analytics
- [ ] Email notifications
- [ ] Mobile app (React Native)
- [ ] API documentation (Swagger)
- [ ] Automated testing
- [ ] CI/CD pipeline
- [ ] Docker support

---

**Built with ❤️ using Next.js, TypeScript, and modern web technologies**

### 3. Access the application

Open [http://localhost:3000](http://localhost:3000)

### 4. Login with super admin

Use the credentials above to access the admin panel.

## 📚 Documentation

- [Database Setup & Usage](./docs/DATABASE.md)
- [API Documentation](./docs/API.md)

## 🏗️ Project Structure

```
hub/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── api/               # API routes
│   │   │   ├── auth/         # Authentication endpoints
│   │   │   └── users/        # User management
│   │   ├── layout.tsx        # Root layout
│   │   └── page.tsx          # Home page
│   ├── components/           # React components
│   │   └── ui/              # UI components (shadcn)
│   ├── lib/                  # Library code
│   │   ├── db/              # Database services
│   │   │   ├── lmdb.ts      # LMDB manager
│   │   │   ├── user-service.ts
│   │   │   ├── task-service.ts
│   │   │   ├── audit-service.ts
│   │   │   ├── notification-service.ts
│   │   │   └── initializer.ts
│   │   ├── auth/            # Authentication
│   │   │   ├── jwt.ts
│   │   │   └── middleware.ts
│   │   ├── logger.ts        # Winston logger
│   │   └── utils.ts         # Utilities
│   └── types/               # TypeScript types
│       └── database.ts      # Database schema types
├── data/                    # LMDB database storage
├── logs/                    # Application logs
├── docs/                    # Documentation
└── public/                  # Static assets
```

## 🔐 Security Features

- **Argon2 Password Hashing**: OWASP recommended
- **JWT Authentication**: Secure token-based auth
- **2FA Support**: Time-based OTP for admins
- **Audit Logging**: Full activity trail
- **Role-Based Access Control**: Fine-grained permissions
- **XSS Protection**: React built-in
- **CSRF Protection**: Token-based

## 📊 Default Roles

### Super Admin
- Full system access
- All permissions
- User management
- Role management

### Manager
- Task creation and assignment
- Team monitoring
- Report generation
- User viewing

### Employee
- View assigned tasks
- Update task status
- Add comments
- Upload attachments

## 🧪 Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## 📝 API Examples

### Authentication

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ameen.com","password":"Admin@123456"}'
```

### Create User

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email":"user@example.com",
    "password":"SecurePass123",
    "firstName":"John",
    "lastName":"Doe"
  }'
```

---

Built with ❤️ by the Ameen Team

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
