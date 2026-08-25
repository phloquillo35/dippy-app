import { User, UserRole, BusinessType } from '@/types';

type Permission =
  | 'cash:open'
  | 'cash:close'
  | 'cash:view_movements'
  | 'cash:add_movement'
  | 'cash:view_reports'
  | 'products:view'
  | 'products:create'
  | 'products:edit'
  | 'products:delete'
  | 'products:view_cost'
  | 'stock:adjust'
  | 'orders:view'
  | 'orders:create'
  | 'orders:cancel'
  | 'orders:change_status'
  | 'orders:view_all'
  | 'users:view'
  | 'users:create'
  | 'users:delete'
  | 'users:edit_roles'
  | 'reports:view'
  | 'reports:export'
  | 'coupons:manage'
  | 'returns:process'
  | 'admin:access'
  | 'backup:export'
  | 'audit:view';

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'cash:open', 'cash:close', 'cash:view_movements', 'cash:add_movement', 'cash:view_reports',
    'products:view', 'products:create', 'products:edit', 'products:delete', 'products:view_cost',
    'stock:adjust',
    'orders:view', 'orders:create', 'orders:cancel', 'orders:change_status', 'orders:view_all',
    'users:view', 'users:create', 'users:delete', 'users:edit_roles',
    'reports:view', 'reports:export',
    'coupons:manage', 'returns:process',
    'admin:access', 'backup:export', 'audit:view',
  ],
  supervisor: [
    'cash:open', 'cash:close', 'cash:view_movements', 'cash:add_movement', 'cash:view_reports',
    'products:view', 'products:create', 'products:edit', 'products:view_cost',
    'stock:adjust',
    'orders:view', 'orders:create', 'orders:cancel', 'orders:change_status', 'orders:view_all',
    'users:view',
    'reports:view', 'reports:export',
    'coupons:manage', 'returns:process',
  ],
  cajero: [
    'cash:open', 'cash:view_movements', 'cash:add_movement',
    'products:view', 'products:create',
    'stock:adjust',
    'orders:view', 'orders:create', 'orders:change_status',
    'users:view',
  ],
  ayudante: [
    'products:view',
    'orders:view', 'orders:create',
    'users:view',
  ],
};

export function hasPermission(user: User | null, permission: Permission): boolean {
  if (!user || !user.isActive) return false;
  return ROLE_PERMISSIONS[user.role]?.includes(permission) ?? false;
}

export function canAccess(user: User | null, business: BusinessType): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return user.businesses.includes(business);
}

export function requirePermission(user: User | null, permission: Permission): boolean {
  return hasPermission(user, permission);
}

export type { Permission };
