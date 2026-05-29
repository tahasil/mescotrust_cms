export async function readJson(res) {
  return res.json().catch(() => ({}));
}
