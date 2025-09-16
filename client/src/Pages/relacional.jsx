import { useEffect, useState } from "react";

function App() {
  const [databases, setDatabases] = useState([]);
  const [selectedDb, setSelectedDb] = useState("");
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);

  // Cargar bases de datos
  useEffect(() => {
    fetch("http://localhost:4000/list-databases")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setDatabases(data.data);
      })
      .catch((err) => console.error("Error cargando bases:", err));
  }, []);

  // Cargar tablas de la DB seleccionada
  const loadTables = (db) => {
    setSelectedDb(db);
    setLoading(true);
    fetch(`http://localhost:4000/tables/${db}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setTables(data.data);
      })
      .catch((err) => console.error("Error cargando tablas:", err))
      .finally(() => setLoading(false));
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Explorador ER 🚀</h1>

      <h2 className="mt-4 font-semibold">Bases de datos:</h2>
      <ul className="list-disc pl-6">
        {databases.map((db) => (
          <li key={db}>
            <button
              className="text-blue-600 underline"
              onClick={() => loadTables(db)}
            >
              {db}
            </button>
          </li>
        ))}
      </ul>

      {selectedDb && (
        <div className="mt-6">
          <h2 className="font-semibold">
            Tablas en <span className="text-green-600">{selectedDb}</span>:
          </h2>
          {loading ? (
            <p>Cargando tablas...</p>
          ) : (
            <ul className="list-square pl-6">
              {tables.map((t) => (
                <li key={t.name}>
                  {t.schema}.{t.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
