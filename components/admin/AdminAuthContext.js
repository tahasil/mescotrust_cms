"use client";

import { createContext, useContext } from "react";

const AdminAuthContext = createContext({
  role: "",
  roleKey: "",
  userType: "",
  permissionKeys: [],
});

export function AdminAuthProvider({ value, children }) {
  return <AdminAuthContext.Provider value={value || {}}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}
