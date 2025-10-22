# LMDB Database Setup Guide

## Overview

This project uses **LMDB (Lightning Memory-Mapped Database)** as its primary database engine. LMDB is a high-performance, ACID-compliant key-value store that provides excellent read performance and data consistency.

## Why LMDB?

- **Lightning Fast**: Memory-mapped architecture for optimal performance
- **ACID Compliant**: Ensures data consistency and reliability
- **Zero-Copy**: Efficient data access without unnecessary copying
- **Crash-Proof**: Robust against system failures
- **Simple**: No separate database server required
- **Lightweight**: Minimal resource footprint

## Database Structure

The system uses multiple database stores within LMDB:

### User Management
- `users` - User accounts
- `roles` - Role definitions
- `permissions` - Permission definitions
- `userRoles` - User-role relationships
- `rolePermissions` - Role-permission relationships

### Task Management
- `tasks` - Task records
- `taskAssignments` - Task-user assignments
- `taskComments` - Task comments
- `taskAttachments` - Task file attachments

### Security & Audit
- `auditLogs` - System audit trail
- `sessions` - User sessions
- `twoFactorAuth` - 2FA configurations

### Notifications
- `notifications` - User notifications

## Configuration

Environment variables in `.env`:

```env
# LMDB Configuration
LMDB_PATH="./data/lmdb"          # Database directory path
LMDB_MAX_DBS=10                  # Maximum number of database stores
LMDB_MAP_SIZE=10485760           # Map size in bytes (10MB default)
```

### Adjusting Map Size

The `LMDB_MAP_SIZE` defines the maximum database size. Adjust based on your needs:

- **10MB**: `10485760` (Development)
- **100MB**: `104857600` (Small projects)
- **1GB**: `1073741824` (Medium projects)
- **10GB**: `10737418240` (Large projects)

## Installation

```bash
npm install
```

This will install all required dependencies including:
- `lmdb` - LMDB Node.js bindings
- `argon2` - Password hashing
- `jsonwebtoken` - JWT authentication
- `nanoid` - ID generation
- `winston` - Logging

## Database Initialization

The database will be automatically initialized when the application starts for the first time.

### Initial Super Admin

On first run, a super admin account is created:

- **Email**: `admin@ameen.com`
- **Password**: `Admin@123456`
- ⚠️ **IMPORTANT**: Change this password immediately in production!

### Manual Initialization

You can manually initialize the database:

```typescript
import { dbInitializer } from '@/lib/db/initializer';
import { lmdb } from '@/lib/db/lmdb';

async function init() {
  await dbInitializer.initialize();
}

init();
```

## Usage Examples

### User Management

```typescript
import { UserService } from '@/lib/db/user-service';

const userService = new UserService();

// Create user
const user = await userService.createUser({
  email: 'user@example.com',
  password: 'SecurePassword123',
  firstName: 'John',
  lastName: 'Doe',
  isActive: true,
  emailVerified: false,
  twoFactorEnabled: false,
});

// Get user by email
const user = await userService.getUserByEmail('user@example.com');

// Verify password
const user = await userService.verifyPassword('user@example.com', 'password');
```

### Task Management

```typescript
import { TaskService, TaskAssignmentService } from '@/lib/db/task-service';
import { TaskStatus, TaskPriority } from '@/types/database';

const taskService = new TaskService();
const assignmentService = new TaskAssignmentService();

// Create task
const task = await taskService.createTask({
  title: 'Complete project documentation',
  description: 'Write comprehensive documentation',
  status: TaskStatus.TODO,
  priority: TaskPriority.HIGH,
  dueDate: '2024-12-31T23:59:59Z',
  createdBy: userId,
});

// Assign task to user
await assignmentService.assignTask(task.id, employeeId, managerId);

// Get user's tasks
const userTasks = await assignmentService.getTasksForUser(employeeId);
```

### Role & Permission Management

```typescript
import { RoleService, PermissionService, RolePermissionService } from '@/lib/db/user-service';

const roleService = new RoleService();
const permissionService = new PermissionService();
const rolePermissionService = new RolePermissionService();

// Create custom role
const role = await roleService.createRole({
  name: 'team_lead',
  description: 'Team lead with extended permissions',
  isSystemRole: false,
});

// Create permission
const permission = await permissionService.createPermission({
  module: 'tasks',
  action: 'assign',
  description: 'Assign tasks to team members',
});

// Assign permission to role
await rolePermissionService.assignPermissionToRole(role.id, permission.id);

// Get user's permissions
const userPermissions = await rolePermissionService.getUserPermissions(userId);
```

### Audit Logging

```typescript
import { AuditService } from '@/lib/db/audit-service';
import { AuditAction } from '@/types/database';

const auditService = new AuditService();

// Log an action
await auditService.log({
  userId: 'user123',
  action: AuditAction.UPDATE,
  resource: 'task',
  resourceId: 'task456',
  changes: { status: 'done' },
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0...',
});

// Get user's audit logs
const logs = await auditService.getLogsByUser(userId);
```

## API Endpoints

### Authentication

```bash
# Login
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@ameen.com",
  "password": "Admin@123456"
}
```

### User Management

```bash
# Get all users (requires authentication)
GET /api/users
Authorization: Bearer <token>

# Create user
POST /api/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "SecurePassword123",
  "firstName": "Jane",
  "lastName": "Smith",
  "roleId": "role_id_here"
}
```

## Database Maintenance

### Backup

LMDB data is stored in the directory specified by `LMDB_PATH`. To backup:

```bash
# Copy the entire database directory
cp -r ./data/lmdb ./backups/lmdb-$(date +%Y%m%d)
```

### Restore

```bash
# Restore from backup
rm -rf ./data/lmdb
cp -r ./backups/lmdb-20241022 ./data/lmdb
```

### Clear Database

```bash
# Remove all data
rm -rf ./data/lmdb
```

The database will be reinitialized on next application start.

## Performance Tips

1. **Map Size**: Set appropriate `LMDB_MAP_SIZE` based on expected data volume
2. **Batch Operations**: Use `lmdb.batch()` for multiple operations
3. **Indexing**: Create secondary indexes for frequently queried fields
4. **Compression**: Enabled by default in our configuration
5. **Read-Only Transactions**: Use for better concurrency

## Security

- Passwords are hashed using **Argon2** (OWASP recommended)
- JWT tokens for authentication
- Full audit logging for compliance
- Environment-based configuration
- No exposed database ports (embedded database)

## Troubleshooting

### Database Locked

If you get a "database locked" error:

```bash
# Check for running processes
ps aux | grep node

# Remove lock file (only if no process is using it)
rm -f ./data/lmdb/lock.mdb
```

### Out of Disk Space

Increase `LMDB_MAP_SIZE` in `.env`:

```env
LMDB_MAP_SIZE=1073741824  # 1GB
```

### Migration from PostgreSQL

LMDB is being used instead of PostgreSQL for better performance and simpler deployment. No migration is needed as this is a fresh setup.

## Resources

- [LMDB Official Documentation](http://www.lmdb.tech/doc/)
- [LMDB Node.js Package](https://github.com/kriszyp/lmdb-js)
- [Database Schema Types](../types/database.ts)

## Support

For issues or questions, please refer to the project documentation or contact the development team.
