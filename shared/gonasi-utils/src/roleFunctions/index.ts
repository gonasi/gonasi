// avoid due to cyclic dependencies
// import type { UserRole } from '@gonasi/database/client';

type UserRole = string | null;

const hasRole = (role: UserRole, roles: UserRole[]): boolean => roles.includes(role);

export const isGoSu = (role: UserRole): boolean => hasRole(role, ['go_su']);
export const isGoAdmin = (role: UserRole): boolean => hasRole(role, ['go_admin']);
export const isGoStaff = (role: UserRole): boolean => hasRole(role, ['go_staff']);
export const isUser = (role: UserRole): boolean => hasRole(role, ['user']);

export const isGoSuOrGoAdmin = (role: UserRole): boolean => hasRole(role, ['go_su', 'go_admin']);

export const isGoSuOrGoAdminOrGoStaff = (role: UserRole): boolean =>
  hasRole(role, ['go_su', 'go_admin', 'go_staff']);
