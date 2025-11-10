/**
 * Example Usage of Confirm Dialog Component
 * 
 * This file demonstrates different ways to use the ConfirmDialog component
 * throughout your application.
 */

// ============================================================
// Example 1: Basic Usage with Component
// ============================================================

import { useState } from 'react';
import { ConfirmDialog } from '@/shared/components/ui/confirm-dialog';
import { Button } from '@/shared/components/ui/button';
import { useI18n } from '@/shared/i18n/i18n-context';

export function Example1() {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();

  const handleDelete = async () => {
    // Your delete logic here
    await fetch('/api/delete-something', { method: 'DELETE' });
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>Delete Item</Button>
      
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        onConfirm={handleDelete}
        title={t('crm.deleteContactTitle')}
        description={t('crm.deleteContactDescription')}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        variant="danger"
      />
    </>
  );
}

// ============================================================
// Example 2: With Loading State
// ============================================================

export function Example2() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useI18n();

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await fetch('/api/delete-something', { method: 'DELETE' });
      // Success - dialog will close automatically
    } catch (error) {
      console.error(error);
      // Handle error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>Delete Item</Button>
      
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        onConfirm={handleDelete}
        title="Delete Item"
        description="This action cannot be undone. Are you sure?"
        confirmText={isLoading ? 'Deleting...' : 'Delete'}
        cancelText="Cancel"
        variant="danger"
        isLoading={isLoading}
      />
    </>
  );
}

// ============================================================
// Example 3: Using Hook (Advanced)
// ============================================================

import { useConfirmDialog } from '@/shared/components/ui/confirm-dialog';

export function Example3() {
  const {
    isOpen,
    isLoading,
    setIsLoading,
    confirm,
    handleConfirm,
    handleCancel,
  } = useConfirmDialog();

  const handleDelete = async () => {
    // Show confirmation dialog and wait for user response
    const confirmed = await confirm();
    
    if (confirmed) {
      setIsLoading(true);
      try {
        await fetch('/api/delete-something', { method: 'DELETE' });
        handleConfirm(); // Close dialog
      } catch (error) {
        console.error(error);
        handleCancel(); // Close dialog on error
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <>
      <Button onClick={handleDelete}>Delete Item</Button>
      
      <ConfirmDialog
        open={isOpen}
        onOpenChange={(open) => !open && handleCancel()}
        onConfirm={handleConfirm}
        title="Delete Item"
        description="This action cannot be undone."
        isLoading={isLoading}
      />
    </>
  );
}

// ============================================================
// Example 4: Warning Variant
// ============================================================

export function Example4() {
  const [open, setOpen] = useState(false);

  const handleAction = async () => {
    await fetch('/api/some-action', { method: 'POST' });
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>Important Action</Button>
      
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        onConfirm={handleAction}
        title="Important Action"
        description="This will affect multiple users. Please confirm."
        confirmText="Continue"
        cancelText="Cancel"
        variant="warning"
      />
    </>
  );
}

// ============================================================
// Example 5: Info Variant
// ============================================================

export function Example5() {
  const [open, setOpen] = useState(false);

  const handleAction = async () => {
    await fetch('/api/some-action', { method: 'POST' });
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>Proceed</Button>
      
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        onConfirm={handleAction}
        title="Proceed with Action?"
        description="This will send notifications to all team members."
        confirmText="Send Notifications"
        cancelText="Cancel"
        variant="info"
      />
    </>
  );
}

// ============================================================
// Example 6: In Data Table (Like contacts-client.tsx)
// ============================================================

interface Contact {
  id: string;
  fullNameEn: string;
  fullNameAr?: string;
}

export function Example6({ contacts }: { contacts: Contact[] }) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { t } = useI18n();

  const openDeleteDialog = (contact: Contact) => {
    setContactToDelete(contact);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!contactToDelete) return;
    
    setIsDeleting(true);
    try {
      await fetch(`/api/contacts/${contactToDelete.id}`, { method: 'DELETE' });
      // Remove from list, show success toast, etc.
    } catch (error) {
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      {/* Your table/list UI */}
      {contacts.map(contact => (
        <div key={contact.id}>
          {contact.fullNameEn}
          {contact.fullNameAr ? ` / ${contact.fullNameAr}` : ""}
          <Button onClick={() => openDeleteDialog(contact)}>Delete</Button>
        </div>
      ))}

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title={t('crm.deleteContactTitle')}
        description={
          contactToDelete
            ? `${t('crm.deleteContactDescription')}\n\n${contactToDelete.fullNameEn}${
                contactToDelete.fullNameAr ? `\n${contactToDelete.fullNameAr}` : ''
              }`
            : t('crm.deleteContactDescription')
        }
        confirmText={isDeleting ? t('common.deleting') : t('common.delete')}
        cancelText={t('common.cancel')}
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  );
}
