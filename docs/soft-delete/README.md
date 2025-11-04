# Soft Delete System Documentation

## Overview

The **Soft Delete** system ensures that **no data is physically deleted**. All data can be recovered.

### Benefits
- 🔄 **Recoverability**: All deleted data can be restored
- 🔒 **Security**: Prevents accidental or malicious data loss
- 📊 **Audit Trail**: Complete history of changes
- 📈 **Data Analysis**: Ability to analyze deleted data
- ⚖️ **Compliance**: Meets data retention regulations (GDPR, etc.)

---

## Architecture

### 1. Schema Changes

Added fields to models:

```typescript
interface Contact {
  // ... existing fields
  
  // Soft Delete Fields
  isDeleted?: boolean;
  deletedAt?: string | null;
  deletedBy?: string | null;
}
```

### 2. Core Functions

```typescript
// In /src/lib/soft-delete.ts

// Soft delete
softDelete<T>(entity: T, options: { userId: string }): T

// Restore
restore<T>(entity: T, options: { userId: string }): T

// Filter
filterDeleted<T>(entities: T[], includeDeleted?: boolean): T[]

// Get only deleted
getDeletedOnly<T>(entities: T[]): T[]

// Permanent delete (Admin only)
permanentDelete<T>(entity: T): null
```

---

## API Endpoints

### 1. Soft Delete
```http
DELETE /api/crm/contacts/[id]
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "Contact moved to trash. Can be restored from trash."
}
```

### 2. Restore
```http
POST /api/crm/contacts/[id]/restore
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": { ...contact },
  "message": "Contact restored successfully"
}
```

### 3. Get Trash
```http
GET /api/crm/contacts/trash
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": [ ...deletedContacts ],
  "count": 5
}
```

### 4. Permanent Delete (Admin Only)
```http
DELETE /api/crm/contacts/[id]/permanent
Authorization: Bearer {token}
X-Admin-Action: true
```

---

## Usage Examples

### In Component

```typescript
'use client';

import { apiClient, getErrorMessage } from '@/lib/api-client';
import { useI18n } from '@/lib/i18n/i18n-context';
import { toast } from 'sonner';

export function ContactActions({ contactId }: { contactId: string }) {
  const { t } = useI18n();

  // Soft delete
  const handleSoftDelete = async () => {
    try {
      const response = await apiClient.delete(`/api/crm/contacts/${contactId}`);
      
      if (response.success) {
        toast.success(t('crm.movedToTrash'));
        // Refresh list
      }
    } catch (error) {
      toast.error(getErrorMessage(error, t('crm.failedToDelete')));
    }
  };

  // Restore
  const handleRestore = async () => {
    try {
      const response = await apiClient.post(`/api/crm/contacts/${contactId}/restore`);
      
      if (response.success) {
        toast.success(t('crm.restoredFromTrash'));
        // Refresh list
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to restore'));
    }
  };

  return (
    <>
      <Button onClick={handleSoftDelete}>
        {t('crm.deleteContactAction')}
      </Button>
      
      <Button onClick={handleRestore}>
        {t('crm.restore')}
      </Button>
    </>
  );
}
```

### In Service Layer

```typescript
import { ContactService } from '@/lib/db/crm-service';

const contactService = new ContactService();

// ✅ Soft Delete (recommended)
await contactService.softDeleteContact(contactId, userId);

// ✅ Restore
await contactService.restoreContact(contactId, userId);

// ✅ Get Deleted
const deletedContacts = await contactService.getDeletedContacts();

// ❌ Permanent Delete (special cases only)
// Requires special permission
await contactService.permanentDeleteContact(contactId);
```

---

## Database Queries

### Get Only Active Items (Exclude Deleted)
```typescript
async getAllContacts(): Promise<Contact[]> {
  const allContacts = await lmdb.getAll<Contact>(this.dbName);
  return filterDeleted(allContacts); // Only non-deleted items
}
```

### Get All (Including Deleted)
```typescript
async getAllContactsIncludingDeleted(): Promise<Contact[]> {
  const allContacts = await lmdb.getAll<Contact>(this.dbName);
  return filterDeleted(allContacts, true); // includeDeleted = true
}
```

### Get Only Deleted Items
```typescript
async getDeletedContacts(): Promise<Contact[]> {
  const allContacts = await lmdb.getAll<Contact>(this.dbName);
  return getDeletedOnly(allContacts);
}
```

---

## UI Components

### Trash Page

```typescript
// app/dashboard/crm/contacts/trash/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { useI18n } from '@/lib/i18n/i18n-context';
import { Contact } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function ContactsTrashPage() {
  const { t } = useI18n();
  const [deletedContacts, setDeletedContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDeletedContacts();
  }, []);

  const fetchDeletedContacts = async () => {
    try {
      const response = await apiClient.get<Contact[]>('/api/crm/contacts/trash');
      if (response.success && response.data) {
        setDeletedContacts(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch deleted contacts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async (contactId: string) => {
    try {
      const response = await apiClient.post(`/api/crm/contacts/${contactId}/restore`);
      if (response.success) {
        toast.success(t('crm.restoredFromTrash'));
        fetchDeletedContacts(); // Refresh
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to restore'));
    }
  };

  if (isLoading) {
    return <div>{t('common.loading')}</div>;
  }

  if (deletedContacts.length === 0) {
    return (
      <Card>
        <div className="text-center p-8">
          <Trash2 className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">
            {t('crm.trashEmpty')}
          </h3>
        </div>
      </Card>
    );
  }

  return (
    <div>
      <h1>{t('crm.trash')}</h1>
      <p>{t('crm.trashDescription')}</p>

      <div className="grid gap-4">
        {deletedContacts.map(contact => (
          <Card key={contact.id}>
            <div className="flex items-center justify-between p-4">
              <div>
                <h3>{contact.fullNameEn}</h3>
                <p className="text-sm text-muted-foreground">
                  Deleted: {new Date(contact.deletedAt!).toLocaleDateString()}
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleRestore(contact.id)}
                >
                  {t('crm.restore')}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

---

## Permissions

### Permission Requirements

```typescript
// Soft delete and restore
{
  module: 'crm_contacts',
  action: 'delete'  // Required for both operations
}

// Permanent delete (Admin only)
{
  module: 'system',
  action: 'admin'
}
```

---

## Auto-Cleanup

### After 30 Days in Trash

```typescript
import { autoCleanup } from '@/lib/soft-delete';

// In a cron job
async function cleanupOldTrash() {
  const allContacts = await contactService.getAllContactsIncludingDeleted();
  const { toKeep, toDelete } = autoCleanup(allContacts, 30); // 30 days
  
  // Permanently delete old items
  for (const contact of toDelete) {
    await contactService.permanentDeleteContact(contact.id);
    console.log(`Permanently deleted: ${contact.fullNameEn}`);
  }
}
```

---

## Best Practices

### ✅ Do's

1. **Always use Soft Delete**
   ```typescript
   // ✅ Correct
   await contactService.softDeleteContact(id, userId);
   
   // ❌ Wrong
   await contactService.permanentDeleteContact(id);
   ```

2. **Always record userId**
   ```typescript
   // ✅ For audit trail
   await contactService.softDeleteContact(id, currentUser.id);
   ```

3. **Clear message to user**
   ```typescript
   // ✅ Tell user it can be restored
   toast.success('Contact moved to trash. Can be restored.');
   ```

4. **Filter in Queries**
   ```typescript
   // ✅ Don't show deleted items by default
   const contacts = filterDeleted(allContacts);
   ```

### ❌ Don'ts

1. **Permanent delete without confirmation**
   ```typescript
   // ❌ Never without Admin approval
   await contactService.permanentDeleteContact(id);
   ```

2. **Ignore deleted items**
   ```typescript
   // ❌ May show deleted items
   const contacts = await lmdb.getAll<Contact>('contacts');
   
   // ✅ Always filter
   const contacts = filterDeleted(await lmdb.getAll<Contact>('contacts'));
   ```

---

## Testing

```typescript
import { softDelete, restore, isDeleted } from '@/lib/soft-delete';

describe('Soft Delete System', () => {
  it('should mark entity as deleted', () => {
    const contact = { id: '1', name: 'John' };
    const deleted = softDelete(contact, { userId: 'user-1' });
    
    expect(deleted.isDeleted).toBe(true);
    expect(deleted.deletedAt).toBeDefined();
    expect(deleted.deletedBy).toBe('user-1');
  });

  it('should restore deleted entity', () => {
    const deleted = { id: '1', name: 'John', isDeleted: true, deletedAt: '2024-01-01' };
    const restored = restore(deleted, { userId: 'user-1' });
    
    expect(restored.isDeleted).toBe(false);
    expect(restored.deletedAt).toBeNull();
  });

  it('should filter deleted entities', () => {
    const entities = [
      { id: '1', name: 'A', isDeleted: false },
      { id: '2', name: 'B', isDeleted: true },
      { id: '3', name: 'C', isDeleted: false },
    ];
    
    const active = filterDeleted(entities);
    expect(active).toHaveLength(2);
  });
});
```

---

## Monitoring & Audit

### Logging

```typescript
// On every soft delete operation
console.log({
  action: 'SOFT_DELETE',
  entityType: 'Contact',
  entityId: contactId,
  deletedBy: userId,
  timestamp: new Date().toISOString()
});

// On every restore operation
console.log({
  action: 'RESTORE',
  entityType: 'Contact',
  entityId: contactId,
  restoredBy: userId,
  timestamp: new Date().toISOString()
});
```

---

## Summary

### Usage Pattern

```typescript
// 1. Soft Delete (default)
DELETE /api/crm/contacts/[id]
→ isDeleted = true, deletedAt = now

// 2. Restore
POST /api/crm/contacts/[id]/restore
→ isDeleted = false, deletedAt = null

// 3. View Trash
GET /api/crm/contacts/trash

// 4. Permanent Delete (Admin only, after 30 days)
DELETE /api/crm/contacts/[id]/permanent
→ PERMANENTLY REMOVED
```

### Key Points

✅ **No data is physically deleted**  
✅ **Everything is recoverable**  
✅ **Complete Audit Trail**  
✅ **Secure and reliable**  
✅ **GDPR compliant**

---

**Created**: November 2024  
**Version**: 1.0.0  
**Maintained by**: Ameen INS Development Team
