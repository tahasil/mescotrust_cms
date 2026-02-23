export default function Spacer({ height = 40, showDivider = false }) {
  if (showDivider) {
    return (
      <div style={{ paddingBlock: Number(height) / 2 || 20 }} aria-hidden="true">
        <hr style={{ border: "none", borderTop: "1px solid #e0e0e0", margin: 0 }} />
      </div>
    );
  }
  return <div style={{ height: Number(height) || 40 }} aria-hidden="true" />;
}
