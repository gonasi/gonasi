import type {
  UserActiveCompanyLoaderReturnType,
  UserProfileLoaderReturnType,
  UserRoleLoaderReturnType,
} from '~/root';

// TODO: Move to another file
export interface AppOutletContext {
  user: UserProfileLoaderReturnType;
  role: UserRoleLoaderReturnType;
  activeCompany: UserActiveCompanyLoaderReturnType;
}
