# Project Structure

## 📁 Directory Organization

```
hub/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── api/                      # API Routes
│   │   │   ├── auth/                 # Authentication endpoints
│   │   │   ├── crm/                  # CRM endpoints
│   │   │   ├── dashboard/            # Dashboard endpoints
│   │   │   ├── files/                # File management
│   │   │   ├── notes/                # Notes endpoints
│   │   │   ├── notifications/        # Notifications
│   │   │   ├── permissions/          # Permission system
│   │   │   ├── scheduler/            # Scheduler endpoints
│   │   │   ├── settings/             # Settings endpoints
│   │   │   ├── tasks/                # Task management
│   │   │   └── users/                # User management
│   │   ├── dashboard/                # Dashboard pages
│   │   ├── login/                    # Login page
│   │   ├── layout.tsx                # Root layout
│   │   ├── page.tsx                  # Homepage
│   │   └── globals.css               # Global styles
│   │
│   ├── components/                   # Shared UI components
│   │   ├── ui/                       # shadcn/ui components
│   │   ├── crm/                      # CRM components
│   │   ├── dashboard/                # Dashboard components
│   │   ├── notes/                    # Notes components
│   │   ├── scheduler/                # Scheduler components
│   │   └── tasks/                    # Tasks components
│   │
│   ├── features/                     # Feature-based modules
│   │   ├── crm/                      # CRM feature
│   │   ├── dashboard/                # Dashboard feature
│   │   ├── notes/                    # Notes feature
│   │   ├── scheduler/                # Scheduler feature
│   │   ├── tasks/                    # Tasks feature
│   │   └── tracking/                 # Location tracking
│   │
│   ├── hooks/                        # Custom React hooks
│   │   ├── permissions/              # Permission hooks
│   │   ├── use-mobile.ts
│   │   ├── use-permissions.ts
│   │   └── use-toast.ts
│   │
│   ├── lib/                          # Core utilities
│   │   ├── auth/                     # Authentication
│   │   ├── db/                       # Database (LMDB)
│   │   ├── i18n/                     # Internationalization
│   │   ├── permissions/              # Permission system
│   │   │   ├── levels.ts             # Permission levels
│   │   │   ├── settings-levels.ts    # Settings permissions
│   │   │   ├── advanced-service.ts   # Permission service
│   │   │   └── registry.ts           # Permission registry
│   │   ├── scheduler/                # Scheduler utilities
│   │   ├── api-client.ts             # API client
│   │   ├── file-storage.ts           # File storage
│   │   ├── logger.ts                 # Logging
│   │   └── utils.ts                  # General utilities
│   │
│   ├── modules/                      # Module permissions
│   │   ├── crm/                      # CRM permissions
│   │   ├── location-tracker/         # Location permissions
│   │   ├── notes/                    # Notes permissions
│   │   ├── scheduler/                # Scheduler permissions
│   │   ├── system/                   # System permissions
│   │   ├── tasks/                    # Tasks permissions
│   │   └── users/                    # User permissions
│   │
│   ├── store/                        # State management
│   │   └── auth-store.ts             # Auth state
│   │
│   └── types/                        # TypeScript types
│       └── database.ts               # Database types
│
├── scripts/                          # Utility scripts
│   ├── init-db.ts                    # Initialize database
│   ├── create-super-admin.ts         # Create admin user
│   └── sync-permissions.ts           # Sync permissions
│
├── docs/                             # Documentation
│   ├── architecture/                 # Architecture docs
│   │   └── PERMISSION_SYSTEM.md      # Permission system
│   ├── LANGUAGE_POLICY.md            # Language policy
│   ├── MOBILE_SETUP.md               # Mobile setup
│   ├── PERMISSION_IMPLEMENTATION_COMPLETE.md
│   ├── PERMISSION_SYSTEM.md          # Permission docs
│   ├── QUICK_ADD_PERMISSIONS.md      # Quick reference
│   ├── QUICK_REFERENCE.md            # Quick reference
│   └── README.md                     # Main docs
│
├── data/                             # Application data
│   ├── lmdb/                         # LMDB database
│   ├── backups/                      # Backup files
│   └── uploads/                      # Uploaded files
│
├── public/                           # Static assets
│   ├── backgrounds/                  # Background images
│   └── ameen.avif                    # Logo
│
├── logs/                             # Application logs
│   └── audit.log                     # Audit trail
│
├── .github/                          # GitHub configuration
│   └── copilot-instructions.md       # Copilot instructions
│
├── package.json                      # Dependencies
├── tsconfig.json                     # TypeScript config
├── next.config.ts                    # Next.js config
├── tailwind.config.ts                # Tailwind config
└── README.md                         # Project README
```

## 🎯 Key Principles

### 1. **Feature-Based Organization**
- Each feature has its own folder in `src/features/`
- Contains feature-specific components, hooks, and utilities
- Promotes modularity and maintainability

### 2. **Shared Components**
- Reusable UI components in `src/components/`
- shadcn/ui components in `src/components/ui/`
- Feature-specific components can be shared

### 3. **API Routes**
- Organized by module in `src/app/api/`
- Each module has its own folder
- Follows Next.js App Router conventions

### 4. **Permission System**
- Core system in `src/lib/permissions/`
- Module-specific permissions in `src/modules/`
- Hooks in `src/hooks/permissions/`
- Clean, hierarchical permission levels

### 5. **Type Safety**
- All types in `src/types/`
- TypeScript strict mode enabled
- No `any` types allowed

### 6. **Internationalization**
- English + Arabic support
- Translations in `src/lib/i18n/`
- Using `useTranslation` hook

## 📝 File Naming Conventions

### Components
- `PascalCase` for component files
- Example: `UserCard.tsx`, `TaskList.tsx`

### Hooks
- `kebab-case` with `use-` prefix
- Example: `use-permissions.ts`, `use-auth.ts`

### Utils & Services
- `kebab-case` for utility files
- Example: `api-client.ts`, `file-storage.ts`

### API Routes
- `kebab-case` for folders
- `route.ts` for route handlers
- Example: `api/user-profile/route.ts`

## 🚀 Module Structure Example

```
src/features/tasks/
├── components/
│   ├── task-card.tsx
│   ├── task-list.tsx
│   └── create-task-dialog.tsx
├── hooks/
│   └── use-tasks.ts
└── types.ts
```

## 🔒 Permission Structure

```
src/lib/permissions/
├── levels.ts              # Core permission levels
├── settings-levels.ts     # Settings-specific
├── advanced-service.ts    # Permission service
└── registry.ts            # Central registry

src/modules/
├── tasks/
│   └── permissions.ts     # Task permissions
└── crm/
    └── permissions.ts     # CRM permissions
```

## 📊 Data Flow

```
Component → Hook → API Client → API Route → Service → Database
```

## 🎨 Styling

- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: Component library
- **Dark Mode**: Full support
- **RTL**: Arabic language support

## 🔧 Configuration Files

- `next.config.ts` - Next.js configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration
- `package.json` - Project dependencies
- `.github/copilot-instructions.md` - Development guidelines

## ✅ Clean Code Principles

1. **One responsibility per file**
2. **Clear, descriptive names**
3. **No duplicate code**
4. **Small, focused functions**
5. **Proper error handling**
6. **Comprehensive comments (English only)**
7. **Type safety everywhere**

---

**Last Updated**: November 7, 2025
**Status**: Production-ready structure
