"use client";

import { createContext, useContext } from "react";
import { hasPermissionKey } from "@/lib/rbac/permissionUtils";

const AdminAuthContext = createContext({
  role: "",
  roleKey: "",
  permissionKeys: [],
});

export function AdminAuthProvider({ value, children }) {
  return (
    <AdminAuthContext.Provider value={value || {}}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}

export function useAdminPermission(permissionKey) {
  const auth = useAdminAuth();
  return hasPermissionKey(auth?.permissionKeys || [], permissionKey);
}
