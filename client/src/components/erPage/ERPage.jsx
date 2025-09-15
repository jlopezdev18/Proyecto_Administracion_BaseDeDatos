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
} from "../customShapes/customShapes";

const ERPage = () => {
  const navigate = useNavigate();
  const [databases, setDatabases] = useState([]);
  const [selectedDb, setSelectedDb] = useState("");
  const [tableNames, setTableNames] = useState([]);
  const [columnNames, setColumnNames] = useState([]);
  const [relations, setRelations] = useState([]);
  const [diagramLoading, setDiagramLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        console.error("Database fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDatabases();
  }, []);

  useEffect(() => {
    if (!selectedDb) return;

    const fetchTableAndColumnData = async () => {
      setDiagramLoading(true);
      try {
        // Fetch table names
        const tablesResponse = await fetch(
          `http://localhost:3000/api/database/databases/${selectedDb}/tables/names`
        );
        const tablesResult = await tablesResponse.json();

        // Fetch column names
        const columnsResponse = await fetch(
          `http://localhost:3000/api/database/databases/${selectedDb}/columns`
        );
        const columnsResult = await columnsResponse.json();

        // Fetch relations
        const relationsResponse = await fetch(
          `http://localhost:3000/api/database/databases/${selectedDb}/relations`
        );
        const relationsResult = await relationsResponse.json();

        if (
          tablesResult.success &&
          columnsResult.success &&
          relationsResult.success
        ) {
          setTableNames(tablesResult.data);
          setColumnNames(columnsResult.data);
          setRelations(relationsResult.data);
        } else {
          setError("Failed to fetch table, column, or relations data");
        }
      } catch (err) {
        console.error("Error fetching table/column/relations data:", err);
        setError("Error loading database schema");
      } finally {
        setDiagramLoading(false);
      }
    };

    fetchTableAndColumnData();
  }, [selectedDb]);

  useEffect(() => {
    if (!selectedDb || tableNames.length === 0 || columnNames.length === 0)
      return;

    const diagramContainer = document.getElementById("diagram-container");
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
   
    const tablePositions = {};
    const tableElements = {};
    let currentX = 100,
      currentY = 100;

    tableNames.forEach((table, index) => {
      const tableName = table.name;

      const tableRect = new customShapes.erd.Entity();
      tableRect.position(currentX, currentY);
      tableRect.resize(150, 60);
      tableRect.addTo(graph);
      tableRect.attr("text", { text: tableName });

      tablePositions[tableName] = { x: currentX, y: currentY };
      tableElements[tableName] = tableRect;

      const columns = tableColumns[tableName] || [];
      const tableCenter = { x: currentX + 75, y: currentY + 30 };

      columns.forEach((column, colIndex) => {
      
        const columnName = column.column;
        const isPrimaryKey = column.isPrimaryKey || false;

        const angle = (colIndex / columns.length) * 2 * Math.PI;
        const distance = 150;
        const columnX = tableCenter.x + distance * Math.cos(angle) - 50;
        const columnY = tableCenter.y + distance * Math.sin(angle) - 20;

        const columnShape = isPrimaryKey
          ? new customShapes.erd.Key()
          : new customShapes.erd.Attribute();

        columnShape.position(columnX, columnY);
        columnShape.resize(120, 40);
        columnShape.addTo(graph);
        columnShape.attr("text", { text: columnName });

        const link = new shapes.standard.Link({
          source: { id: tableRect.id },
          target: { id: columnShape.id },
          attrs: { line: { stroke: "#6b7280", strokeWidth: 1 } },
          connector: { name: "straight" },
        });
        graph.addCell(link);
      });

      currentX += 650;
      if ((index + 1) % 2 === 0) {
        currentX = 100;
        currentY += 450;
      }
    });

    relations.forEach((relation) => {
      const table1Name = relation.referencing_table;
      const table2Name = relation.referenced_table;
      const table1Pos = tablePositions[table1Name];
      const table2Pos = tablePositions[table2Name];
      const table1Element = tableElements[table1Name];
      const table2Element = tableElements[table2Name];

      if (table1Pos && table2Pos && table1Element && table2Element) {
        const table1Center = { x: table1Pos.x + 75, y: table1Pos.y + 30 };
        const table2Center = { x: table2Pos.x + 75, y: table2Pos.y + 30 };

        const relationShapeX = (table1Center.x + table2Center.x) / 2 - 40;
        const relationShapeY = (table1Center.y + table2Center.y) / 2 - 20;

        const diamond = new customShapes.erd.Relationship();
        diamond.position(relationShapeX, relationShapeY);
        diamond.resize(120, 90);
        diamond.addTo(graph);
        diamond.attr("text", { text: "Relation" });

        const link1 = new shapes.standard.Link({
          source: { id: diamond.id },
          target: { id: table1Element.id },
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

        const link2 = new shapes.standard.Link({
          source: { id: diamond.id },
          target: { id: table2Element.id },
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

        graph.addCell(link1);
        graph.addCell(link2);
      }
    });

    paper.transformToFitContent({ padding: 20, maxScale: 1, minScale: 0.2 });
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
            DB → Modelo Entidad-Relación
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
                <CircularProgress size={24} sx={{ color: "#3b82f6" }} />
              ) : error ? (
                <Typography sx={{ color: "#ef4444" }}>{error}</Typography>
              ) : (
                <FormControl sx={{ minWidth: 200 }}>
                  <InputLabel
                    sx={{
                      color: "rgba(255, 255, 255, 0.7)",
                      "&.Mui-focused": { color: "#3b82f6" },
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
                        borderColor: "#3b82f6",
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
                            background: "rgba(59, 130, 246, 0.1)",
                          },
                          "&.Mui-selected": {
                            background: "rgba(59, 130, 246, 0.2)",
                            "&:hover": {
                              background: "rgba(59, 130, 246, 0.3)",
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
              id="diagram-container"
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
                  <CircularProgress sx={{ color: "#3b82f6" }} />
                  <Typography sx={{ color: "rgba(255, 255, 255, 0.7)" }}>
                    Cargando diagrama ER...
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
              Selecciona una base de datos para ver el diagrama ER
            </Typography>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default ERPage;
