export function isAdmin(session) {
  return session?.role === "Admin";
}

export function isEditor(session) {
  return session?.role === "Editor";
}

export function isAuthor(session) {
  return session?.role === "Author";
}
