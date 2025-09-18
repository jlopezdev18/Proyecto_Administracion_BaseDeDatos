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

const RelationalModelPage = () => {
  const navigate = useNavigate();
  const [databases, setDatabases] = useState([]);
  const [selectedDb, setSelectedDb] = useState("");
  const [tables, setTables] = useState([]);
  const [relations, setRelations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [diagramLoading, setDiagramLoading] = useState(false);
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
          if (result.data.length > 0) {
            setSelectedDb(result.data[0]);
          }
        }
      } catch (err) {
        setError("Error al obtener bases de datos");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDatabases();
  }, []);

  useEffect(() => {
    if (!selectedDb) return;

    const fetchSchemaData = async () => {
      setDiagramLoading(true);
      try {
        const tablesResponse = await fetch(
          `http://localhost:3000/api/database/databases/${selectedDb}/tables`
        );
        const tablesResult = await tablesResponse.json();

        const relationsResponse = await fetch(
          `http://localhost:3000/api/database/databases/${selectedDb}/relations`
        );
        const relationsResult = await relationsResponse.json();

        if (tablesResult.success && relationsResult.success) {
          setTables(tablesResult.data);
          setRelations(relationsResult.data);
        } else {
          setError("No se pudieron cargar las tablas o relaciones");
        }
      } catch (err) {
        setError("Error cargando esquema de la base de datos");
        console.error(err);
      } finally {
        setDiagramLoading(false);
      }
    };

    fetchSchemaData();
  }, [selectedDb]);

  useEffect(() => {
    if (!selectedDb || tables.length === 0) return;

    const container = document.getElementById("diagram-container");
    if (!container) return;

    container.innerHTML = "";

    const graph = new dia.Graph({}, { cellNamespace: shapes });
    const paper = new dia.Paper({
      el: container,
      model: graph,
      width: "100%",
      height: "100%",
      gridSize: 10,
      drawGrid: true,
      background: { color: "#1e293b" },
      cellViewNamespace: shapes,
    });

    const tableElements = {};
    let x = 100;
    let y = 100;

    // Compute table stats to derive a general ordering: parents at top, then independent children, then subtypes
    const relationStats = tables.reduce((acc, t) => {
      acc[t.tableName] = { referencedBy: 0, referencing: 0 };
      return acc;
    }, {});

    relations.forEach((rel) => {
      if (relationStats[rel.referenced_table])
        relationStats[rel.referenced_table].referencedBy += 1;
      if (relationStats[rel.referencing_table])
        relationStats[rel.referencing_table].referencing += 1;
    });

    const sortedTables = [...tables].sort((a, b) => {
      const aStats = relationStats[a.tableName] || {
        referencedBy: 0,
        referencing: 0,
      };
      const bStats = relationStats[b.tableName] || {
        referencedBy: 0,
        referencing: 0,
      };
      const aRelations = aStats.referencedBy + aStats.referencing;
      const bRelations = bStats.referencedBy + bStats.referencing;

      // Determine if PK is also FK (common in subtype tables) — these go later
      const aPkAlsoFk = (a.columns || []).some(
        (c) => c.isPrimaryKey && c.isForeignKey
      );
      const bPkAlsoFk = (b.columns || []).some(
        (c) => c.isPrimaryKey && c.isForeignKey
      );

      // 1) Parents first: higher referencedBy
      if (aStats.referencedBy !== bStats.referencedBy)
        return bStats.referencedBy - aStats.referencedBy;
      // 2) Independent entities before subtypes: pkAlsoFk false first
      if (aPkAlsoFk !== bPkAlsoFk) return aPkAlsoFk ? 1 : -1;
      // 3) Higher overall degree next
      if (aRelations !== bRelations) return bRelations - aRelations;
      // 4) Stable by name
      return a.tableName.localeCompare(b.tableName);
    });

    sortedTables.forEach((table) => {
      // Build attribute list with primary key attributes first
      const pkCols = (table.columns || []).filter((c) => c.isPrimaryKey);
      const nonPkCols = (table.columns || []).filter((c) => !c.isPrimaryKey);
      const orderedCols = [...pkCols, ...nonPkCols];
      const attributesLine = orderedCols.map((c) => c.columnName).join(", ");

      const rect = new shapes.standard.Rectangle();
      rect.position(x, y);
      // Compact fixed size for cleaner look
      const rectWidth = 520;
      const rectHeight = 80;
      rect.resize(rectWidth, rectHeight);
      rect.attr({
        body: {
          fill: "#f9fafb",
          stroke: "#374151",
          strokeWidth: 1.5,
          rx: 12,
          ry: 12,
        },
        label: {
          text: `${table.tableName} (${attributesLine})`,
          fill: "#111827",
          fontWeight: "bold",
          fontSize: 14,
          fontFamily: "Segoe UI, sans-serif",
          refY: "50%",
          yAlignment: "middle",
          textWrap: {
            width: rectWidth - 28,
            ellipsis: true,
          },
        },
      });

      rect.addTo(graph);

      tableElements[table.tableName] = rect;

      // Single-column vertical stacking with compact gap
      y += rectHeight + 40; // vertical gap between rectangles
    });

    // Relaciones (FKs)
    relations.forEach((rel) => {
      const fromTable = tableElements[rel.referencing_table];
      const toTable = tableElements[rel.referenced_table];

      if (fromTable && toTable) {
        const link = new shapes.standard.Link();
        // Route around elements and add arrowhead
        link.router("manhattan", { padding: 40 });
        link.connector("rounded", { radius: 8 });

        link.source(fromTable);
        link.target(toTable);
        link.attr({
          line: {
            stroke: "#f59e0b",
            strokeWidth: 2,
            strokeDasharray: "6 4", // dashed line to represent relationships
            targetMarker: {
              type: "path",
              d: "M 10 -5 0 0 10 5 Z",
              fill: "#f59e0b",
            },
          },
        });

        // Consolidated label: FK -> PK
        const fkTbl = rel.referencing_table;
        const pkTbl = rel.referenced_table;
        link.appendLabel({
          position: 0.5,
          attrs: {
            text: {
              text: `${fkTbl}.${rel.referencing_column} → ${pkTbl}.${rel.referenced_column}`,
              fill: "#f59e0b",
              fontSize: 11,
              fontFamily: "Segoe UI, sans-serif",
            },
            rect: { fill: "transparent", stroke: "none" },
          },
        });

        graph.addCell(link);
      }
    });

    paper.transformToFitContent({ padding: 30 });
  }, [selectedDb, tables, relations]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)",
      }}
    >
      <AppBar
        position="static"
        sx={{
          background: "rgba(30, 41, 59, 0.95)",
          backdropFilter: "blur(10px)",
        }}
      >
        <Toolbar>
          <IconButton
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
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
            Modelo Relacional
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 3, height: "calc(100vh - 64px)" }}>
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
                          "&:hover": { background: "rgba(59, 130, 246, 0.1)" },
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

        <Paper
          sx={{
            height: "calc(100% - 120px)",
            background: "rgba(255, 255, 255, 0.03)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: 2,
            p: 2,
          }}
        >
          <Box
            id="diagram-container"
            sx={{
              width: "100%",
              height: "100%",
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
                  Generando modelo relacional...
                </Typography>
              </Box>
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default RelationalModelPage;
