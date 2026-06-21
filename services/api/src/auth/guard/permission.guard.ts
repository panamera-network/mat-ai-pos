import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const PERMISSION_KEY = 'permission';

export const RequirePermission = (permission: string) => {
  return (target: any, key?: string, descriptor?: PropertyDescriptor) => {
    if (descriptor) {
      Reflect.defineMetadata(PERMISSION_KEY, permission, descriptor.value);
    }
    return descriptor;
  };
};

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermission = this.reflector.getAllAndOverride<string>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermission) return true;

    const { user } = context.switchToHttp().getRequest();

    if (user.isSuperAdmin) return true;
    if (user.permissions?.[requiredPermission]) return true;

    throw new ForbiddenException(`Permission denied: ${requiredPermission}`);
  }
}