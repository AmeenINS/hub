# Ameen Hub - User Management & Task System

Enterprise-grade User Management and Task Management System built with Next.js, LMDB, and modern security standards.

## 🚀 Features

### User Management
- ✅ Dynamic Role-Based Access Control (RBAC)
- ✅ Super Admin initialization
- ✅ Custom role creation
- ✅ Fine-grained permissions (module + action level)
- ✅ User-role relationships
- ✅ Secure authentication (JWT/Argon2)
- ✅ 2FA support for admins
- ✅ Full audit logging

### Task Management
- ✅ Task creation and assignment
- ✅ Employee dashboard with assigned tasks
- ✅ Manager dashboard with team overview
- ✅ Task status tracking (To-Do, In-Progress, Done)
- ✅ Priority levels (Low, Medium, High, Urgent)
- ✅ Due dates and notifications
- ✅ Task comments and attachments
- ✅ Progress tracking
- ✅ Exportable reports

### Security
- 🔒 OWASP best practices
- 🔒 Argon2 password hashing
- 🔒 JWT authentication
- 🔒 2FA support
- 🔒 Audit trail for all actions
- 🔒 Role-based middleware
- 🔒 Centralized error handling

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **UI**: Tailwind CSS, Radix UI, shadcn/ui
- **Database**: LMDB (Lightning Memory-Mapped Database)
- **Authentication**: JWT, Argon2
- **Logging**: Winston
- **Forms**: React Hook Form, Zod

## 📦 Installation

```bash
# Install dependencies
npm install

# Set up environment variables (already configured for LMDB)
# Edit .env if needed

# Run development server
npm run dev
```

## 🗄️ Database Setup

This project uses **LMDB** - a high-performance, embedded key-value database.

### Configuration (.env)

```env
# LMDB Configuration
LMDB_PATH="./data/lmdb"
LMDB_MAX_DBS=10
LMDB_MAP_SIZE=10485760  # 10MB (adjust as needed)

# JWT Configuration
JWT_SECRET="your-secret-key-change-this"
JWT_EXPIRES_IN="7d"

# NextAuth
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"
```

### Initial Super Admin

On first run, a super admin is created:
- **Email**: `admin@ameen.com`
- **Password**: `Admin@123456`
- ⚠️ **Change this password immediately!**

## 🚀 Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Start the development server

```bash
npm run dev
```

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
