import { connectDB } from "@/lib/db";
import {
  PERMISSION_CATALOG_VERSION,
  buildPermissionDefinitions,
  getDefaultPermissionKeysForRole,
  getSystemRoleSeedDefinitions,
} from "@/lib/rbac/catalog";
import {
  ROLE_KEYS,
  isConfiguredSuperAdminEmail,
  resolveRoleIdentity,
} from "@/lib/rbac/constants";

let bootstrapPromise = null;
let bootstrapComplete = false;

function activeMappingUpdate(roleKey, permissionKey) {
  return {
    updateOne: {
      filter: { roleKey, permissionKey },
      update: {
        $set: { isDeleted: false, deletedAt: null, deletedBy: "" },
        $setOnInsert: { roleKey, permissionKey },
      },
      upsert: true,
    },
  };
}

export async function ensureRbacBootstrap() {
  if (bootstrapComplete) return;
  if (bootstrapPromise) return bootstrapPromise;

  bootstrapPromise = (async () => {
    await connectDB();
    const [AdminRole, Permission, RolePermission, User] = await Promise.all([
      import("@/models/AdminRole").then((module) => module.default || module),
      import("@/models/Permission").then((module) => module.default || module),
      import("@/models/RolePermission").then((module) => module.default || module),
      import("@/models/User").then((module) => module.default || module),
    ]);

    const permissionDefinitions = buildPermissionDefinitions();
    const activePermissionKeys = permissionDefinitions.map((permission) => permission.key);
    if (permissionDefinitions.length > 0) {
      await Permission.bulkWrite(
        permissionDefinitions.map((permission) => ({
          updateOne: {
            filter: { key: permission.key },
            update: {
              $set: {
                ...permission,
                isActive: true,
              },
            },
            upsert: true,
          },
        })),
        { ordered: false },
      );
    }

    await Permission.updateMany(
      { key: { $nin: activePermissionKeys }, isActive: { $ne: false } },
      { $set: { isActive: false } },
    );
    await RolePermission.updateMany(
      { permissionKey: { $nin: activePermissionKeys }, isDeleted: { $ne: true } },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: "permission_catalog_sync",
        },
      },
    );

    const roleSeeds = getSystemRoleSeedDefinitions();
    await AdminRole.bulkWrite(
      roleSeeds.map((role) => ({
        updateOne: {
          filter: { key: role.key },
          update: {
            $set: {
              name: role.name,
              description: role.description,
              priority: role.priority,
              isSystem: true,
              isActive: true,
              isDeleted: false,
              deletedAt: null,
              deletedBy: "",
            },
            $setOnInsert: { key: role.key, catalogVersion: "" },
          },
          upsert: true,
        },
      })),
      { ordered: false },
    );

    const systemRoles = await AdminRole.find({ key: { $in: roleSeeds.map((role) => role.key) } })
      .select("key catalogVersion")
      .lean();
    for (const role of systemRoles) {
      if (role.catalogVersion === PERMISSION_CATALOG_VERSION) continue;
      const defaultKeys = Array.from(getDefaultPermissionKeysForRole(role.key));
      await RolePermission.updateMany(
        { roleKey: role.key, isDeleted: { $ne: true } },
        {
          $set: {
            isDeleted: true,
            deletedAt: new Date(),
            deletedBy: "permission_catalog_sync",
          },
        },
      );
      if (defaultKeys.length > 0) {
        await RolePermission.bulkWrite(
          defaultKeys.map((permissionKey) => activeMappingUpdate(role.key, permissionKey)),
          { ordered: false },
        );
      }
      await AdminRole.updateOne(
        { key: role.key },
        { $set: { catalogVersion: PERMISSION_CATALOG_VERSION } },
      );
      await User.updateMany(
        { roleKey: role.key },
        { $inc: { permissionVersion: 1, sessionVersion: 1 } },
      );
    }

    const users = await User.find({}).select("_id email role roleKey permissionVersion sessionVersion").lean();
    const userUpdates = [];
    for (const user of users) {
      const roleIdentity = resolveRoleIdentity({
        role: user.role,
        roleKey: isConfiguredSuperAdminEmail(user.email)
          ? ROLE_KEYS.SUPER_ADMIN
          : user.roleKey || user.role,
      });
      const update = {};
      if (user.roleKey !== roleIdentity.roleKey) update.roleKey = roleIdentity.roleKey;
      if (user.role !== roleIdentity.role) update.role = roleIdentity.role;
      if (!Number.isFinite(Number(user.permissionVersion)) || Number(user.permissionVersion) < 1) update.permissionVersion = 1;
      if (!Number.isFinite(Number(user.sessionVersion)) || Number(user.sessionVersion) < 1) update.sessionVersion = 1;
      if (Object.keys(update).length > 0) {
        userUpdates.push({ updateOne: { filter: { _id: user._id }, update: { $set: update } } });
      }
    }
    if (userUpdates.length > 0) {
      await User.bulkWrite(userUpdates, { ordered: false });
    }

    bootstrapComplete = true;
  })();

  try {
    await bootstrapPromise;
  } finally {
    bootstrapPromise = null;
  }
}
