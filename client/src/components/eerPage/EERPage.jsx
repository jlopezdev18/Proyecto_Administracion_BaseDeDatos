/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Container,
  IconButton,
  AppBar,
  Toolbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  CircularProgress,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import HomeIcon from "@mui/icons-material/Home";
import { dia, shapes } from "@joint/core";
import { useNavigate } from "react-router-dom";
import {
  Entity,
  Attribute,
  Relationship,
  Key,
  MultivaluedAttribute,
  GeneralizationTriangle,
  GeneralizationCircle,
  ExclusivityArc,
} from "../customShapes/customShapes";

const EERPage = () => {
  const navigate = useNavigate();
  const [databases, setDatabases] = useState([]);
  const [selectedDb, setSelectedDb] = useState("");
  const [tableNames, setTableNames] = useState([]);
  const [columnNames, setColumnNames] = useState([]);
  const [relations, setRelations] = useState([]);
  const [diagramLoading, setDiagramLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generalizations, setGeneralizations] = useState([]);

  // Obtener bases de datos
  useEffect(() => {
    const fetchDatabases = async () => {
      try {
        const response = await fetch(
          "http://localhost:3000/api/database/databases"
        );
        const result = await response.json();
        if (result.success) {
          setDatabases(result.data || []);
          if (result.data && result.data.length > 0) {
            setSelectedDb(result.data[0]);
          }
        } else {
          setError("Failed to fetch databases");
        }
      } catch (err) {
        setError("Error connecting to server");
      } finally {
        setLoading(false);
      }
    };
    fetchDatabases();
  }, []);

  // Cargar tablas, columnas y relaciones
  useEffect(() => {
    if (!selectedDb) return;

    const fetchTableAndColumnData = async () => {
      setDiagramLoading(true);
      setError("");

      try {
        const [tablesResponse, columnsResponse, relationsResponse] =
          await Promise.all([
            fetch(
              `http://localhost:3000/api/database/databases/${selectedDb}/tables/names`
            ),
            fetch(
              `http://localhost:3000/api/database/databases/${selectedDb}/columns`
            ),
            fetch(
              `http://localhost:3000/api/database/databases/${selectedDb}/relations`
            ),
          ]);

        const [tablesResult, columnsResult, relationsResult] =
          await Promise.all([
            tablesResponse.json(),
            columnsResponse.json(),
            relationsResponse.json(),
          ]);

        if (
          tablesResult.success &&
          columnsResult.success &&
          relationsResult.success
        ) {
          setTableNames(tablesResult.data);
          setColumnNames(columnsResult.data);
          setRelations(relationsResult.data);
        } else {
          setTableNames([]);
          setColumnNames([]);
          setRelations([]);
          setError(`La base ${selectedDb} no tiene esquema válido`);
        }
      } catch (err) {
        setTableNames([]);
        setColumnNames([]);
        setRelations([]);
        setError(`Error al cargar ${selectedDb}: ${err.message}`);
      } finally {
        setDiagramLoading(false);
      }
    };

    fetchTableAndColumnData();
  }, [selectedDb]);

  // Cargar generalizaciones
  useEffect(() => {
    if (!selectedDb) return;
    const fetchGeneralizations = async () => {
      try {
        const response = await fetch(
          `http://localhost:3000/api/database/databases/${selectedDb}/generalizations`
        );
        const result = await response.json();
        if (result.success) {
          setGeneralizations(result.data);
        } else {
          setGeneralizations([]);
        }
      } catch (err) {
        setGeneralizations([]);
      }
    };
    fetchGeneralizations();
  }, [selectedDb]);

  // Dibujar diagrama
  useEffect(() => {
    if (!selectedDb || tableNames.length === 0 || columnNames.length === 0)
      return;

    const diagramContainer = document.getElementById("eer-diagram-container");
    if (!diagramContainer) return;

    diagramContainer.innerHTML = "";

    const customShapes = { erd: { Entity, Attribute, Relationship, Key } };
    const graph = new dia.Graph({}, { cellNamespace: customShapes });
    const paper = new dia.Paper({
      el: diagramContainer,
      model: graph,
      width: "100%",
      height: "100%",
      background: { color: "#1a1a1a" },
      gridSize: 10,
      drawGrid: true,
      cellViewNamespace: customShapes,
    });

    const tableColumns = {};
    columnNames.forEach((col) => {
      if (!tableColumns[col.table]) {
        tableColumns[col.table] = [];
      }
      tableColumns[col.table].push(col);
    });

    let currentX = 100,
      currentY = 100;

    // Separar entidades principales y subtipos
    const mainEntities = tableNames.filter(
      (t) =>
        !generalizations.some((g) => g.subtypes.includes(t.name)) ||
        t.name === "Proyecto"
    );
    const subEntities = tableNames.filter((t) =>
      generalizations.some(
        (g) => g.subtypes.includes(t.name) && t.name !== "Proyecto"
      )
    ); // Excluir "Proyecto"

    console.log(
      "All table names:",
      tableNames.map((t) => t.name)
    );
    console.log("Generalizations:", generalizations);
    console.log(
      "Main entities:",
      mainEntities.map((t) => t.name)
    );
    console.log(
      "Sub entities:",
      subEntities.map((t) => t.name)
    );

    const tablePositions = {};
    const tableElements = {};
    // Mapear atributos por entidad para poder reubicarlos si la entidad cambia de posición (p. ej., en generalización)
    const entityAttributes = {}; // { [entityName]: Array<dia.Element> }

    // Fila superior: entidades principales - Mayor separación entre Proyecto y Empleado
    const entitySpacingX = 500; // Aumentado de 350 a 500
    const entityStartX = 150;
    const entityY = 120;

    mainEntities.forEach((table, idx) => {
      const x = entityStartX + idx * entitySpacingX;
      const y = entityY;
      const tableRect = new Entity();
      tableRect.position(x, y);
      tableRect.resize(150, 60);
      tableRect.addTo(graph);
      tableRect.attr("text", { text: table.name });
      tablePositions[table.name] = { x, y };
      tableElements[table.name] = tableRect;

      // Atributos en círculo alrededor de la entidad
      const columns = tableColumns[table.name] || [];
      const center = { x: x + 75, y: y + 30 };
      // Inicializar contenedor de atributos de esta entidad
      entityAttributes[table.name] = [];
      columns.forEach((column, colIndex) => {
        const columnName = column.column;
        const isPrimaryKey = column.isPrimaryKey || false;

        let radius = 120; // Radio base aumentado
        let angle;

        if (table.name === "Empleado") {
          // Para Empleado, usar un radio mayor y distribución completa
          angle = (2 * Math.PI * colIndex) / columns.length;
          radius = 180;
        } else if (table.name === "Proyecto") {
          // Para Proyecto, distribuir en círculo completo
          angle = (2 * Math.PI * colIndex) / columns.length;
          radius = 130;
        } else {
          // Para otras entidades principales
          angle = (2 * Math.PI * colIndex) / columns.length;
          radius = 120;
        }

        const attrX = center.x + radius * Math.cos(angle) - 60;
        const attrY = center.y + radius * Math.sin(angle) - 20;

        const columnShape = column.isMultivalued
          ? new MultivaluedAttribute()
          : isPrimaryKey
          ? new Key()
          : new Attribute();

        columnShape.position(attrX, attrY);
        columnShape.resize(120, 40);
        columnShape.addTo(graph);
        columnShape.attr("text", { text: columnName });
        // Guardar referencia del atributo para posibles reubicaciones
        entityAttributes[table.name].push(columnShape);

        const link = new shapes.standard.Link({
          source: { id: tableRect.id },
          target: { id: columnShape.id },
          attrs: { line: { stroke: "#7c3aed", strokeWidth: 1 } },
          connector: { name: "straight" },
        });
        graph.addCell(link);
      });
    });

    const subtypeY = 450; // Aumentado para dar más espacio
    subEntities.forEach((table, idx) => {
      const x = entityStartX + idx * entitySpacingX; // Usar el mismo espaciado que las entidades principales
      const y = subtypeY;
      const tableRect = new Entity();
      tableRect.position(x, y);
      tableRect.resize(150, 60);
      tableRect.addTo(graph);
      tableRect.attr("text", { text: table.name });
      tablePositions[table.name] = { x, y };
      tableElements[table.name] = tableRect;

      // Atributos en círculo alrededor de los subtipos
      const columns = tableColumns[table.name] || [];
      const center = { x: x + 75, y: y + 30 };
      // Inicializar contenedor de atributos de esta entidad
      entityAttributes[table.name] = [];
      columns.forEach((column, colIndex) => {
        // Usar la misma distribución circular para todos los subtipos
        const angle = (2 * Math.PI * colIndex) / columns.length;
        let radius = 100; // Radio base para subtipos

        // Ajustar radio ligeramente para cada subtipo
        if (table.name === "Arquitecto") {
          radius = 100;
        } else if (table.name === "Administrativo") {
          radius = 100;
        } else if (table.name === "Ingeniero") {
          radius = 100;
        }

        const attrX = center.x + radius * Math.cos(angle) - 60;
        const attrY = center.y + radius * Math.sin(angle) - 20;
        const columnShape = column.isMultivalued
          ? new MultivaluedAttribute()
          : column.isPrimaryKey
          ? new Key()
          : new Attribute();
        columnShape.position(attrX, attrY);
        columnShape.resize(120, 40);
        columnShape.addTo(graph);
        columnShape.attr("text", { text: column.column });
        // Guardar referencia del atributo para posibles reubicaciones
        entityAttributes[table.name].push(columnShape);
        const link = new shapes.standard.Link({
          source: { id: tableRect.id },
          target: { id: columnShape.id },
          attrs: { line: { stroke: "#7c3aed", strokeWidth: 1 } },
          connector: { name: "straight" },
        });
        graph.addCell(link);
      });
    });

    try {
      if (generalizations && Array.isArray(generalizations)) {
        generalizations.forEach((gen) => {
          // Solo procesar generalizaciones que NO tengan "Proyecto" como supertype
          // pero permitir que "Proyecto" esté en subtypes (y lo filtraremos después)
          if (gen.supertype === "Proyecto") {
            
            return;
          }

          const superEntity = tableElements[gen.supertype];
          const superPos = tablePositions[gen.supertype];
          if (!superEntity || !superPos) {
            console.warn(
              "Entidad o posición no encontrada para:",
              gen.supertype
            );
            return;
          }

          const baseX = superPos.x + 75;
          const superY = superPos.y;
          const circleY = superY + 120; // Más espacio debajo del supertype
          const triangleY = circleY + 60; // Más espacio debajo del círculo
          const subtypesY = triangleY + 80; // Más espacio debajo del triángulo

          // Círculo debajo del supertype
          const circle = new GeneralizationCircle();
          circle.position(baseX - 15, circleY);
          circle.resize(30, 30);
          circle.addTo(graph);

          // Triángulo debajo del círculo
          const triangle = new GeneralizationTriangle();
          triangle.position(baseX - 30, triangleY);
          triangle.resize(60, 40);
          triangle.addTo(graph);

          if (gen.exclusive) {
            const arc = new ExclusivityArc();
            arc.position(baseX - 30, circleY - 35);
            arc.resize(60, 30);
            arc.addTo(graph);
          }

          const linkSuper = new shapes.standard.Link({
            source: { id: superEntity.id },
            target: { id: circle.id },
            attrs: { line: { stroke: "#6366f1", strokeWidth: 2 } },
            connector: { name: "straight" },
          });
          graph.addCell(linkSuper);

          const linkCircleTriangle = new shapes.standard.Link({
            source: { id: circle.id },
            target: { id: triangle.id },
            attrs: { line: { stroke: "#6366f1", strokeWidth: 2 } },
            connector: { name: "straight" },
          });
          graph.addCell(linkCircleTriangle);

          superEntity.position(baseX - 75, superY);
          superEntity.attr("text/text", gen.supertype);

          if (Array.isArray(gen.subtypes)) {
            // Filtrar "Proyecto" de los subtypes
            const filteredSubtypes = gen.subtypes.filter(
              (subtype) => subtype !== "Proyecto"
            );
            const total = filteredSubtypes.length;
            const spacing = 220;
            const startX = baseX - ((total - 1) * spacing) / 2;
            filteredSubtypes.forEach((subtype, idx) => {
              const subEntity = tableElements[subtype];
              if (!subEntity) {
                console.warn("Subentidad no encontrada para:", subtype);
                return;
              }

              subEntity.position(startX + idx * spacing - 75, subtypesY);
              subEntity.attr("text/text", subtype);

              // Reubicar atributos del subtipo para que sigan a la entidad
              const attrs = entityAttributes[subtype] || [];
              const cols = tableColumns[subtype] || [];
              const newCenter = {
                x: startX + idx * spacing,
                y: subtypesY + 30,
              };
              const radius = 100;
              attrs.forEach((attrShape, colIndex) => {
                const angle =
                  cols.length > 0 ? (2 * Math.PI * colIndex) / cols.length : 0;
                const ax = newCenter.x + radius * Math.cos(angle) - 60;
                const ay = newCenter.y + radius * Math.sin(angle) - 20;
                attrShape.position(ax, ay);
              });

              const linkSub = new shapes.standard.Link({
                source: { id: triangle.id },
                target: { id: subEntity.id },
                attrs: { line: { stroke: "#6366f1", strokeWidth: 2 } },
                connector: { name: "straight" },
              });
              graph.addCell(linkSub);
            });
          }
        });
      }
    } catch (err) {
      console.error("Error al renderizar generalizaciones:", err);
    }

    // Agregar relación entre Proyecto y Empleado con rombo
    const proyectoElement = tableElements["Proyecto"];
    const empleadoElement = tableElements["Empleado"];
    const proyectoPos = tablePositions["Proyecto"];
    const empleadoPos = tablePositions["Empleado"];

    if (proyectoElement && empleadoElement && proyectoPos && empleadoPos) {
      const proyectoCenter = { x: proyectoPos.x + 75, y: proyectoPos.y + 30 };
      const empleadoCenter = { x: empleadoPos.x + 75, y: empleadoPos.y + 30 };

      const relationShapeX = (proyectoCenter.x + empleadoCenter.x) / 2 - 40;
      const relationShapeY = (proyectoCenter.y + empleadoCenter.y) / 2 - 20;

      const diamond = new Relationship();
      diamond.position(relationShapeX, relationShapeY);
      diamond.resize(120, 90);
      diamond.addTo(graph);
      diamond.attr("text", { text: "Trabaja En" });

      const link1 = new shapes.standard.Link({
        source: { id: diamond.id },
        target: { id: proyectoElement.id },
        attrs: { line: { stroke: "#f59e0b", strokeWidth: 2 } },
        labels: [
          {
            position: 0.85,
            attrs: {
              text: {
                text: "(1,N)",
                fill: "#f59e0b",
                fontSize: 16,
                fontWeight: "bold",
                fontFamily: "Arial, sans-serif",
              },
            },
          },
          {
            position: 0.1,
            attrs: {
              text: {
                text: "N",
                fill: "#f59e0b",
                fontSize: 16,
                fontWeight: "bold",
                fontFamily: "Arial, sans-serif",
              },
            },
          },
        ],
        connector: { name: "straight" },
      });

      const link2 = new shapes.standard.Link({
        source: { id: diamond.id },
        target: { id: empleadoElement.id },
        attrs: { line: { stroke: "#f59e0b", strokeWidth: 2 } },
        labels: [
          {
            position: 0.85,
            attrs: {
              text: {
                text: "(1,1)",
                fill: "#f59e0b",
                fontSize: 16,
                fontWeight: "bold",
                fontFamily: "Arial, sans-serif",
              },
            },
          },
          {
            position: 0.1,
            attrs: {
              text: {
                text: "1",
                fill: "#f59e0b",
                fontSize: 16,
                fontWeight: "bold",
                fontFamily: "Arial, sans-serif",
              },
            },
          },
        ],
        connector: { name: "straight" },
      });

      graph.addCell(link1);
      graph.addCell(link2);
    }

    paper.transformToFitContent({ padding: 20, maxScale: 1, minScale: 0.2 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDb, tableNames, columnNames, relations]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)",
      }}
    >
      {/* Header */}
      <AppBar
        position="static"
        sx={{
          background: "rgba(30, 41, 59, 0.95)",
          backdropFilter: "blur(10px)",
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate("/")}
            sx={{ mr: 1 }}
          >
            <HomeIcon />
          </IconButton>
          <IconButton
            color="inherit"
            onClick={() => navigate("/options")}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography
            variant="h6"
            component="h2"
            sx={{ flexGrow: 1, fontWeight: 600 }}
          >
            DB → Modelo E-R Extendido
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 3, height: "calc(100vh - 64px)" }}>
        {/* Control Panel */}
        <Box mb={3}>
          <Paper
            sx={{
              p: 3,
              background: "rgba(255, 255, 255, 0.05)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: 2,
            }}
          >
            <Box display="flex" alignItems="center" gap={3} flexWrap="wrap">
              <Typography variant="h6" sx={{ color: "#fff", fontWeight: 600 }}>
                Seleccionar Base de Datos:
              </Typography>
              {loading ? (
                <CircularProgress size={24} sx={{ color: "#7c3aed" }} />
              ) : error ? (
                <Typography sx={{ color: "#ef4444" }}>{error}</Typography>
              ) : (
                <FormControl sx={{ minWidth: 200 }}>
                  <InputLabel
                    sx={{
                      color: "rgba(255, 255, 255, 0.7)",
                      "&.Mui-focused": { color: "#7c3aed" },
                    }}
                  >
                    Base de Datos
                  </InputLabel>
                  <Select
                    value={selectedDb}
                    onChange={(e) => setSelectedDb(e.target.value)}
                    label="Base de Datos"
                    sx={{
                      color: "#fff",
                      ".MuiOutlinedInput-notchedOutline": {
                        borderColor: "rgba(255, 255, 255, 0.3)",
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "rgba(255, 255, 255, 0.5)",
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#7c3aed",
                      },
                      ".MuiSvgIcon-root": {
                        color: "rgba(255, 255, 255, 0.7)",
                      },
                    }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          background: "rgba(30, 41, 59, 0.95)",
                          backdropFilter: "blur(10px)",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                        },
                      },
                    }}
                  >
                    {databases.map((db) => (
                      <MenuItem
                        key={db}
                        value={db}
                        sx={{
                          color: "#fff",
                          "&:hover": {
                            background: "rgba(124, 58, 237, 0.1)",
                          },
                          "&.Mui-selected": {
                            background: "rgba(124, 58, 237, 0.2)",
                            "&:hover": {
                              background: "rgba(124, 58, 237, 0.3)",
                            },
                          },
                        }}
                      >
                        {db}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Box>
          </Paper>
        </Box>

        {/* Diagram Container */}
        <Paper
          sx={{
            height: "calc(100% - 120px)",
            background: "rgba(255, 255, 255, 0.03)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: 2,
            p: 2,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {selectedDb ? (
            <Box
              id="eer-diagram-container"
              sx={{
                width: "100%",
                height: "100%",
                background: "#1a1a1a",
                borderRadius: 1,
                border: "2px solid rgba(255, 255, 255, 0.1)",
                position: "relative",
                display: diagramLoading ? "flex" : "block",
                alignItems: diagramLoading ? "center" : "initial",
                justifyContent: diagramLoading ? "center" : "initial",
              }}
            >
              {diagramLoading && (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  <CircularProgress sx={{ color: "#7c3aed" }} />
                  <Typography sx={{ color: "rgba(255, 255, 255, 0.7)" }}>
                    Cargando diagrama EER...
                  </Typography>
                </Box>
              )}
            </Box>
          ) : (
            <Typography
              sx={{
                color: "rgba(255, 255, 255, 0.6)",
                fontSize: "1.1rem",
                textAlign: "center",
              }}
            >
              Selecciona una base de datos para ver el diagrama EER
            </Typography>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default EERPage;
