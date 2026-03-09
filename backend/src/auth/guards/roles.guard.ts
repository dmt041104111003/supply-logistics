import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "../decorators/roles.decorator";
import type { AuthUser } from "../types/auth-user";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles =
      this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    if (!roles.length) return true;

    const req = context
      .switchToHttp()
      .getRequest<{ user?: AuthUser }>();
    const userRole = (req.user?.role ?? "").trim().toUpperCase();
    const allowed = roles.some((r) => (r ?? "").trim().toUpperCase() === userRole);
    if (!allowed) {
      throw new ForbiddenException("Forbidden for this role.");
    }
    return true;
  }
}

