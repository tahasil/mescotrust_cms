export default function TableBlock({
  headers = [],
  rows = [],
  striped = true,
  bordered = true,
}) {
  const headerList = Array.isArray(headers) ? headers : [];
  const rowList = Array.isArray(rows) ? rows : [];

  if (rowList.length === 0 && headerList.length === 0) return null;

  return (
    <div style={{ overflowX: "auto", margin: "1.5rem 0" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "0.95rem",
          border: bordered ? "1px solid #e8e8e8" : "none",
        }}
      >
        {headerList.length > 0 && (
          <thead>
            <tr>
              {headerList.map((h, i) => (
                <th
                  key={i}
                  style={{
                    padding: "0.75rem 1rem",
                    textAlign: "left",
                    background: "#fafafa",
                    borderBottom: "2px solid #e8e8e8",
                    borderRight: bordered && i < headerList.length - 1 ? "1px solid #e8e8e8" : "none",
                    fontWeight: 600,
                    color: "#333",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {rowList.map((row, ri) => {
            const cells = Array.isArray(row) ? row : [];
            return (
              <tr key={ri} style={{ background: striped && ri % 2 === 1 ? "#fafafa" : "#fff" }}>
                {cells.map((cell, ci) => (
                  <td
                    key={ci}
                    style={{
                      padding: "0.65rem 1rem",
                      borderBottom: "1px solid #f0f0f0",
                      borderRight: bordered && ci < cells.length - 1 ? "1px solid #f0f0f0" : "none",
                      color: "#555",
                    }}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
