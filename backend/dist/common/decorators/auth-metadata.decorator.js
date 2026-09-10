"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequireService = exports.SERVICE_KEY = exports.Public = exports.IS_PUBLIC_KEY = exports.RequirePermissions = exports.PERMISSIONS_KEY = exports.Roles = exports.ROLES_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.ROLES_KEY = 'roles';
const Roles = (...roles) => (0, common_1.SetMetadata)(exports.ROLES_KEY, roles);
exports.Roles = Roles;
exports.PERMISSIONS_KEY = 'permissions';
const RequirePermissions = (...permissions) => (0, common_1.SetMetadata)(exports.PERMISSIONS_KEY, permissions);
exports.RequirePermissions = RequirePermissions;
exports.IS_PUBLIC_KEY = 'isPublic';
const Public = () => (0, common_1.SetMetadata)(exports.IS_PUBLIC_KEY, true);
exports.Public = Public;
exports.SERVICE_KEY = 'required_service';
const RequireService = (service) => (0, common_1.SetMetadata)(exports.SERVICE_KEY, service);
exports.RequireService = RequireService;
//# sourceMappingURL=auth-metadata.decorator.js.map