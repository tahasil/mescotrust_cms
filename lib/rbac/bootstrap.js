import { connectDB } from "@/lib/db";
import {
  buildPermissionDefinitions,
  getDefaultPermissionKeysForRole,
  getSystemRoleSeedDefinitions,
} from "@/lib/rbac/catalog";
import { ROLE_KEYS, resolveRoleIdentity } from "@/lib/rbac/constants";
import { USER_TYPES, deriveUserTypeFromRole } from "@/lib/rbac/userType";

let bootPromise = null;
let bootCompleted = false;
const EDITOR_ENFORCED_BLOCKED_PERMISSION_KEYS = Object.freeze([
  "components.create",
  "forms.create",
  "sliders.create",
  "popups.create",
]);

function toBulkOps(items, keyField, valueMapper) {
  return items.map((item) => ({
    updateOne: {
      filter: { [keyField]: item[keyField] },
      update: { $set: valueMapper(item) },
      upsert: true,
    },
  }));
}

export async function ensureRbacBootstrap() {
  if (bootCompleted) return;
  if (bootPromise) return bootPromise;

  bootPromise = (async () => {
    await connectDB();

    const [AdminRole, Permission, RolePermission, User] = await Promise.all([
      import("@/models/AdminRole").then((mod) => mod.default || mod),
      import("@/models/Permission").then((mod) => mod.default || mod),
      import("@/models/RolePermission").then((mod) => mod.default || mod),
      import("@/models/User").then((mod) => mod.default || mod),
    ]);

    const roleSeeds = getSystemRoleSeedDefinitions();
    if (roleSeeds.length > 0) {
      await AdminRole.bulkWrite(
        toBulkOps(roleSeeds, "key", (role) => ({
          key: role.key,
          name: role.name,
          description: role.description || "",
          priority: role.priority,
          isSystem: Boolean(role.isSystem),
          isActive: role.isActive !== false,
        })),
        { ordered: false },
      );
    }

    const permissionDefs = buildPermissionDefinitions();
    if (permissionDefs.length > 0) {
      await Permission.bulkWrite(
        toBulkOps(permissionDefs, "key", (permission) => ({
          key: permission.key,
          module: permission.module,
          action: permission.action,
          label: permission.label,
          description: permission.description || "",
          isProtected: Boolean(permission.isProtected),
          isActive: true,
        })),
        { ordered: false },
      );
    }

    const protectedPermissionRows = await Permission.find({ isProtected: true, isActive: true })
      .select("key")
      .lean();
    const protectedPermissionKeys = protectedPermissionRows.map((item) => item.key).filter(Boolean);
    if (protectedPermissionKeys.length > 0) {
      const protectedMappings = await RolePermission.find({
        roleKey: { $ne: ROLE_KEYS.SUPER_ADMIN },
        permissionKey: { $in: protectedPermissionKeys },
        isDeleted: { $ne: true },
      })
        .select("roleKey")
        .lean();
      const affectedRoleKeys = Array.from(new Set(protectedMappings.map((item) => String(item.roleKey || "").trim()).filter(Boolean)));

      if (affectedRoleKeys.length > 0) {
        await RolePermission.updateMany(
          {
            roleKey: { $in: affectedRoleKeys },
            permissionKey: { $in: protectedPermissionKeys },
            isDeleted: { $ne: true },
          },
          {
            $set: {
              isDeleted: true,
              deletedAt: new Date(),
              deletedBy: "system_bootstrap_protected_guard",
            },
          },
        );

        await User.updateMany(
          { roleKey: { $in: affectedRoleKeys } },
          { $inc: { permissionVersion: 1, sessionVersion: 1 } },
        );
      }
    }

    const systemRoleKeys = [ROLE_KEYS.SUPER_ADMIN, ROLE_KEYS.ADMIN, ROLE_KEYS.EDITOR];
    const existingRoleMappingCounts = await RolePermission.aggregate([
      { $match: { roleKey: { $in: systemRoleKeys }, isDeleted: { $ne: true } } },
      { $group: { _id: "$roleKey", count: { $sum: 1 } } },
    ]);
    const mappingCountByRole = new Map(
      existingRoleMappingCounts.map((row) => [String(row._id), Number(row.count || 0)]),
    );

    // Seed system-role permissions only on first bootstrap for each role.
    // Do not reinsert removed permissions on every request, otherwise role edits cannot persist.
    const rolePermissionPairs = [];
    for (const roleKey of systemRoleKeys) {
      const existingCount = mappingCountByRole.get(roleKey) || 0;
      if (existingCount > 0) continue;
      const permissionKeys = Array.from(getDefaultPermissionKeysForRole(roleKey));
      for (const permissionKey of permissionKeys) {
        rolePermissionPairs.push({ roleKey, permissionKey });
      }
    }
    if (rolePermissionPairs.length > 0) {
      await RolePermission.bulkWrite(
        rolePermissionPairs.map((pair) => ({
          updateOne: {
            filter: { roleKey: pair.roleKey, permissionKey: pair.permissionKey },
            update: {
              $set: { isDeleted: false, deletedAt: null, deletedBy: "" },
              $setOnInsert: { roleKey: pair.roleKey, permissionKey: pair.permissionKey },
            },
            upsert: true,
          },
        })),
        { ordered: false },
      );
    }

    // Keep the built-in Editor role restricted from module create actions.
    const editorPruneResult = await RolePermission.updateMany({
      roleKey: ROLE_KEYS.EDITOR,
      permissionKey: { $in: EDITOR_ENFORCED_BLOCKED_PERMISSION_KEYS },
      isDeleted: { $ne: true },
    }, {
      $set: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: "system_bootstrap",
      },
    });
    if (Number(editorPruneResult?.modifiedCount || 0) > 0) {
      await User.updateMany(
        { roleKey: ROLE_KEYS.EDITOR },
        { $inc: { permissionVersion: 1, sessionVersion: 1 } },
      );
    }

    await User.updateMany(
      { roleKey: { $exists: false }, role: "Super Admin" },
      { $set: { roleKey: ROLE_KEYS.SUPER_ADMIN } },
    );
    await User.updateMany(
      { roleKey: { $exists: false }, role: "Admin" },
      { $set: { roleKey: ROLE_KEYS.ADMIN } },
    );
    await User.updateMany(
      { roleKey: { $exists: false }, role: "Editor" },
      { $set: { roleKey: ROLE_KEYS.EDITOR } },
    );
    await User.updateMany(
      { roleKey: { $exists: false } },
      { $set: { roleKey: ROLE_KEYS.EDITOR } },
    );

    await User.updateMany(
      { userType: { $exists: false }, roleKey: ROLE_KEYS.SUPER_ADMIN },
      { $set: { userType: USER_TYPES.SUPERADMIN } },
    );
    await User.updateMany(
      { userType: { $exists: false }, roleKey: ROLE_KEYS.ADMIN },
      { $set: { userType: USER_TYPES.ADMIN } },
    );
    await User.updateMany(
      { userType: { $exists: false } },
      { $set: { userType: USER_TYPES.EDITOR } },
    );

    await User.updateMany({ permissionVersion: { $exists: false } }, { $set: { permissionVersion: 1 } });
    await User.updateMany({ sessionVersion: { $exists: false } }, { $set: { sessionVersion: 1 } });

    const staleUsers = await User.find({ role: { $exists: true }, roleKey: { $exists: true } })
      .select("_id role roleKey userType")
      .lean();
    const roleLabelBulk = [];
    for (const row of staleUsers) {
      const resolved = resolveRoleIdentity({ role: row.role, roleKey: row.roleKey });
      const nextUserType = deriveUserTypeFromRole({ roleKey: resolved.roleKey });
      if (
        resolved.role !== row.role ||
        resolved.roleKey !== row.roleKey ||
        String(row.userType || "") !== String(nextUserType || "")
      ) {
        roleLabelBulk.push({
          updateOne: {
            filter: { _id: row._id },
            update: { $set: { role: resolved.role, roleKey: resolved.roleKey, userType: nextUserType } },
          },
        });
      }
    }
    if (roleLabelBulk.length > 0) {
      await User.bulkWrite(roleLabelBulk, { ordered: false });
    }

    bootCompleted = true;
  })();

  try {
    await bootPromise;
  } finally {
    bootPromise = null;
  }
}
