import { isAdmin, isEditor } from "@/lib/permissions";

export function canAccessFormBuilder(session) {
  return isAdmin(session) || isEditor(session);
}

