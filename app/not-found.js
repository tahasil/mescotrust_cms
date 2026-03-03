import Link from "next/link";

export default function NotFound() {
  return (
    <main style={{ padding: "2rem", textAlign: "center" }}>
      <h2>404 — Page not found</h2>
      <p style={{ marginBottom: "1.5rem", color: "#666" }}>The page you are looking for does not exist or is not published.</p>
      <Link href="/" style={{ color: "#1890ff" }}>
        Go home
      </Link>
    </main>
  );
}
