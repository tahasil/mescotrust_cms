import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import {
  ROLE_KEYS,
  isConfiguredSuperAdminEmail,
  resolveRoleIdentity,
} from "@/lib/rbac/constants";
import {
  isPermissionSnapshotStale,
  readTokenPermissionKeys,
  writeTokenPermissionKeys,
} from "@/lib/rbac/permissionCodec";
import { resolveAccessFromSession } from "@/lib/rbac/resolver";

const getUserModel = async () => (await import("@/models/User")).default;

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        await connectDB();
        const User = await getUserModel();
        const user = await User.findOne({
          email: String(credentials.email).trim().toLowerCase(),
          status: "active",
        }).select("+password");
        if (!user || !(await bcrypt.compare(credentials.password, user.password))) return null;

        const roleKey = isConfiguredSuperAdminEmail(user.email)
          ? ROLE_KEYS.SUPER_ADMIN
          : user.roleKey || user.role;
        const identity = resolveRoleIdentity({ role: user.role, roleKey });
        const access = await resolveAccessFromSession({
          id: user._id.toString(),
          email: user.email,
          ...identity,
          permissionVersion: user.permissionVersion || 1,
          sessionVersion: user.sessionVersion || 1,
        });
        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          ...identity,
          permissionVersion: user.permissionVersion || 1,
          sessionVersion: user.sessionVersion || 1,
          permissionKeys: access.permissionKeys || [],
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.roleKey = user.roleKey;
        token.permissionVersion = user.permissionVersion || 1;
        token.sessionVersion = user.sessionVersion || 1;
        writeTokenPermissionKeys(token, user.permissionKeys);
        token.forceReauth = false;
        token.forceReauthReason = "";
      }

      if (token?.id) {
        try {
          await connectDB();
          const User = await getUserModel();
          const dbUser = await User.findById(token.id)
            .select("email status role roleKey permissionVersion sessionVersion")
            .lean();
          if (!dbUser || dbUser.status !== "active") {
            token.forceReauth = true;
            token.forceReauthReason = "account-deactivated";
            writeTokenPermissionKeys(token, []);
            return token;
          }

          const roleKey = isConfiguredSuperAdminEmail(dbUser.email)
            ? ROLE_KEYS.SUPER_ADMIN
            : dbUser.roleKey || dbUser.role;
          const identity = resolveRoleIdentity({ role: dbUser.role, roleKey });
          const dbPermissionVersion = Number(dbUser.permissionVersion || 1);
          const dbSessionVersion = Number(dbUser.sessionVersion || 1);
          const sessionChanged = dbSessionVersion !== Number(token.sessionVersion || 1);
          const permissionsChanged = dbPermissionVersion !== Number(token.permissionVersion || 1);
          const roleChanged = identity.roleKey !== token.roleKey || identity.role !== token.role;

          token.role = identity.role;
          token.roleKey = identity.roleKey;
          token.permissionVersion = dbPermissionVersion;
          token.sessionVersion = dbSessionVersion;

          if (sessionChanged) {
            token.forceReauth = true;
            token.forceReauthReason = "role-updated";
            writeTokenPermissionKeys(token, []);
            return token;
          }

          token.forceReauth = false;
          token.forceReauthReason = "";
          if (roleChanged || permissionsChanged || isPermissionSnapshotStale(token)) {
            const access = await resolveAccessFromSession({
              id: token.id,
              email: dbUser.email,
              ...identity,
              permissionVersion: dbPermissionVersion,
              sessionVersion: dbSessionVersion,
            });
            writeTokenPermissionKeys(token, access.permissionKeys || []);
          }
        } catch {
          // Retain the last signed permission snapshot during transient DB failures.
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.roleKey = token.roleKey;
        session.user.permissionVersion = token.permissionVersion || 1;
        session.user.sessionVersion = token.sessionVersion || 1;
        session.user.permissionKeys = readTokenPermissionKeys(token) || [];
      }
      session.forceReauth = Boolean(token.forceReauth);
      session.forceReauthReason = String(token.forceReauthReason || "");
      return session;
    },
  },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/admin/login" },
  secret: process.env.NEXTAUTH_SECRET,
};
