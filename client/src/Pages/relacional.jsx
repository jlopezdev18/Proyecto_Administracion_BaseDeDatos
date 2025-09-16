import { useEffect, useState } from "react";

function Relacional() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("http://localhost:3000/my-er-model")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setTables(data.data);
        } else {
          setError(data.error);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Cargando modelo ER...</p>;
  if (error) return <p style={{ color: "red" }}>Error: {error}</p>;

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ textAlign: "center" }}>Modelo Relacional</h1>

      {tables.length === 0 ? (
        <p>No se encontraron tablas.</p>
      ) : (
        tables.map((table) => (
          <div
            key={table.tableName}
            style={{
              marginBottom: "30px",
              border: "1px solid #ccc",
              borderRadius: "8px",
              padding: "15px",
              background: "#f9f9f9",
            }}
          >
            <h2 style={{ marginBottom: "10px" }}>{table.tableName}</h2>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginBottom: "10px",
              }}
            >
              <thead>
                <tr style={{ background: "#ddd" }}>
                  <th style={{ border: "1px solid #ccc", padding: "8px" }}>Columna</th>
                  <th style={{ border: "1px solid #ccc", padding: "8px" }}>Tipo</th>
                  <th style={{ border: "1px solid #ccc", padding: "8px" }}>¿Nulo?</th>
                  <th style={{ border: "1px solid #ccc", padding: "8px" }}>PK</th>
                </tr>
              </thead>
              <tbody>
                {table.columns.map((col) => (
                  <tr key={col.columnName}>
                    <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                      {col.columnName}
                    </td>
                    <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                      {col.dataType}
                    </td>
                    <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                      {col.isNullable}
                    </td>
                    <td
                      style={{
                        border: "1px solid #ccc",
                        padding: "8px",
                        textAlign: "center",
                        fontWeight: "bold",
                        color: col.isPrimaryKey ? "green" : "black",
                      }}
                    >
                      {col.isPrimaryKey ? "✔" : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  );
}

export default Relacional;
