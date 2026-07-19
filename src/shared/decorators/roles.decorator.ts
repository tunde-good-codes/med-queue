import { SetMetadata } from '@nestjs/common';
import { UserRole } from 'src/modules/auth/entities/auth.entity';

export const ROLES_KEY = 'ROLES';
export const Roles = (...userRole: UserRole[]) =>
  SetMetadata(ROLES_KEY, userRole);
