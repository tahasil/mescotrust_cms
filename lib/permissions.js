export function isAdmin(session) {
  return session?.role === "Admin";
}

export function isEditor(session) {
  return session?.role === "Editor";
}
