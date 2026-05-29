import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { getAdminLoginRedirectUrl, getAuthRedirectBaseUrl } from "@/lib/env";
import { resolveRoleIdentity } from "@/lib/rbac/constants";
import { resolveAccessFromSession } from "@/lib/rbac/resolver";
import { deriveUserTypeFromRole, normalizeUserType } from "@/lib/rbac/userType";

const getUser = async () => {
  const mongoose = await import("mongoose");
  const User = (await import("@/models/User")).default;
  return { User, mongoose };
};

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
        const { User } = await getUser();
        const user = await User.findOne({ email: credentials.email, status: "active" }).select("+password");
        if (!user) return null;
        const ok = await bcrypt.compare(credentials.password, user.password);
        if (!ok) return null;
        const roleIdentity = resolveRoleIdentity({ role: user.role, roleKey: user.roleKey });
        const access = await resolveAccessFromSession(
          {
            id: user._id.toString(),
            role: roleIdentity.role,
            roleKey: roleIdentity.roleKey,
            permissionVersion: user.permissionVersion || 1,
            sessionVersion: user.sessionVersion || 1,
          },
          { bypassDb: false },
        );
        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: roleIdentity.role,
          roleKey: roleIdentity.roleKey,
          userType: normalizeUserType(user.userType, deriveUserTypeFromRole({ roleKey: roleIdentity.roleKey })),
          permissionVersion: user.permissionVersion || 1,
          sessionVersion: user.sessionVersion || 1,
          permissionKeys: access.permissionKeys || [],
        };
      },
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      const appBaseUrl = getAuthRedirectBaseUrl(baseUrl);
      const loginUrl = getAdminLoginRedirectUrl(baseUrl);

      if (url && url.startsWith("/")) {
        return `${appBaseUrl}${url}`;
      }

      try {
        const target = new URL(url);
        if (target.origin === appBaseUrl) {
          return target.toString();
        }
      } catch {
        return loginUrl;
      }

      return loginUrl;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.roleKey = user.roleKey;
        token.userType = user.userType || deriveUserTypeFromRole({ roleKey: user.roleKey || user.role });
        token.permissionVersion = user.permissionVersion || 1;
        token.sessionVersion = user.sessionVersion || 1;
        token.permissionKeys = Array.isArray(user.permissionKeys) ? user.permissionKeys : [];
        token.forceReauth = false;
        token.forceReauthReason = "";
      }
      if (token?.id) {
        try {
          await connectDB();
          const { User } = await getUser();
          const dbUser = await User.findById(token.id)
            .select("status role roleKey userType permissionVersion sessionVersion")
            .lean();

          if (!dbUser || dbUser.status !== "active") {
            token.forceReauth = true;
            token.forceReauthReason = "account-deactivated";
            token.permissionKeys = [];
            return token;
          }

          const roleIdentity = resolveRoleIdentity({ role: dbUser.role, roleKey: dbUser.roleKey });
          const dbPermissionVersion = Number(dbUser.permissionVersion || token.permissionVersion || 1);
          const currentPermissionVersion = Number(token.permissionVersion || 1);
          const dbSessionVersion = Number(dbUser.sessionVersion || token.sessionVersion || 1);
          const currentSessionVersion = Number(token.sessionVersion || 1);
          const roleChanged =
            roleIdentity.role !== token.role || roleIdentity.roleKey !== (token.roleKey || token.role);
          const permissionVersionChanged = dbPermissionVersion !== currentPermissionVersion;
          const sessionVersionChanged = dbSessionVersion !== currentSessionVersion;
          const missingPermissionPayload = !Array.isArray(token.permissionKeys);

          token.role = roleIdentity.role;
          token.roleKey = roleIdentity.roleKey;
          token.userType = normalizeUserType(
            dbUser.userType,
            deriveUserTypeFromRole({ roleKey: roleIdentity.roleKey }),
          );
          token.permissionVersion = dbPermissionVersion;
          token.sessionVersion = dbSessionVersion;

          if (sessionVersionChanged) {
            token.forceReauth = true;
            token.forceReauthReason = "role-updated";
            token.permissionKeys = [];
            return token;
          }

          token.forceReauth = false;
          token.forceReauthReason = "";

          if (roleChanged || permissionVersionChanged || missingPermissionPayload) {
            const access = await resolveAccessFromSession(
              {
                id: token.id,
                role: roleIdentity.role,
                roleKey: roleIdentity.roleKey,
                permissionVersion: dbPermissionVersion,
                sessionVersion: dbSessionVersion,
              },
              { bypassDb: false },
            );
            token.permissionKeys = Array.isArray(access?.permissionKeys) ? access.permissionKeys : [];
          }
        } catch {
          // Keep existing token snapshot if refresh fails.
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.roleKey = token.roleKey;
        session.user.userType = token.userType;
        session.user.permissionVersion = token.permissionVersion || 1;
        session.user.sessionVersion = token.sessionVersion || 1;
        session.user.permissionKeys = Array.isArray(token.permissionKeys) ? token.permissionKeys : [];
      }
      session.forceReauth = Boolean(token.forceReauth);
      session.forceReauthReason = String(token.forceReauthReason || "");
      return session;
    },
  },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: "/admin/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
