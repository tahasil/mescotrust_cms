import { isAdmin, isEditor } from "@/lib/permissions";

export function canAccessFormBuilder(session) {
  return isAdmin(session) || isEditor(session);
}

export function canDeleteFormBuilderData(session) {
  return isAdmin(session);
}

