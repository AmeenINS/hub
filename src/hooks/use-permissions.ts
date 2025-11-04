/**
 * Permission Hooks
 * Reusable hooks for checking user permissions in components
 */

import { useEffect, useState } from 'react';
import { checkUserPermission } from '@/lib/auth/permissions';
import { useAuthStore } from '@/store/auth-store';

/**
 * Hook to check a single permission
 * @param module - The module name (e.g., 'contacts', 'users')
 * @param action - The action name (e.g., 'view', 'create', 'edit', 'delete')
 * @returns Object with hasPermission and isLoading states
 * 
 * @example
 * const { hasPermission, isLoading } = usePermission('contacts', 'create');
 * 
 * if (hasPermission) {
 *   return <button>Create Contact</button>;
 * }
 */
export function usePermission(module: string, action: string) {
  const { user } = useAuthStore();
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function check() {
      if (!user) {
        setHasPermission(false);
        setIsLoading(false);
        return;
      }

      try {
        const result = await checkUserPermission(user.id, module, action);
        setHasPermission(result);
      } catch (error) {
        console.error('Permission check failed:', error);
        setHasPermission(false);
      } finally {
        setIsLoading(false);
      }
    }

    check();
  }, [user, module, action]);

  return { hasPermission, isLoading };
}

/**
 * Hook to check all standard permissions for a module
 * @param module - The module name (e.g., 'contacts', 'users')
 * @returns Object with permissions (canView, canCreate, canEdit, canDelete) and isLoading state
 * 
 * @example
 * const { permissions, isLoading } = useModulePermissions('contacts');
 * 
 * return (
 *   <div>
 *     {permissions.canCreate && <button>Create</button>}
 *     {permissions.canEdit && <button>Edit</button>}
 *     {permissions.canDelete && <button>Delete</button>}
 *   </div>
 * );
 */
export function useModulePermissions(module: string) {
  const { user } = useAuthStore();
  const [permissions, setPermissions] = useState({
    canView: false,
    canCreate: false,
    canEdit: false,
    canDelete: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function check() {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const [canView, canCreate, canEdit, canDelete] = await Promise.all([
          checkUserPermission(user.id, module, 'view'),
          checkUserPermission(user.id, module, 'create'),
          checkUserPermission(user.id, module, 'edit'),
          checkUserPermission(user.id, module, 'delete'),
        ]);

        setPermissions({ canView, canCreate, canEdit, canDelete });
      } catch (error) {
        console.error('Permission check failed:', error);
        setPermissions({
          canView: false,
          canCreate: false,
          canEdit: false,
          canDelete: false,
        });
      } finally {
        setIsLoading(false);
      }
    }

    check();
  }, [user, module]);

  return { permissions, isLoading };
}

/**
 * Hook to check custom permissions for a module
 * @param module - The module name
 * @param actions - Array of action names to check
 * @returns Object with permissions mapped by action name and isLoading state
 * 
 * @example
 * const { permissions, isLoading } = useCustomPermissions('reports', ['view', 'export', 'approve']);
 * 
 * return (
 *   <div>
 *     {permissions.view && <div>Report Content</div>}
 *     {permissions.export && <button>Export</button>}
 *     {permissions.approve && <button>Approve</button>}
 *   </div>
 * );
 */
export function useCustomPermissions(module: string, actions: string[]) {
  const { user } = useAuthStore();
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function check() {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const results = await Promise.all(
          actions.map((action) => checkUserPermission(user.id, module, action))
        );

        const permissionMap: Record<string, boolean> = {};
        actions.forEach((action, index) => {
          permissionMap[action] = results[index];
        });

        setPermissions(permissionMap);
      } catch (error) {
        console.error('Permission check failed:', error);
        const permissionMap: Record<string, boolean> = {};
        actions.forEach((action) => {
          permissionMap[action] = false;
        });
        setPermissions(permissionMap);
      } finally {
        setIsLoading(false);
      }
    }

    check();
  }, [user, module, actions]);

  return { permissions, isLoading };
}
