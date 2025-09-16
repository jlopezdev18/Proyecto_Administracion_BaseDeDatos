import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Container,
  IconButton,
  Stack,
  AppBar,
  Toolbar,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";
import { algebraSql } from "../utils/algebraSql";

const AlgebraToSql = () => {
  const navigate = useNavigate();
  const [algebraQuery, setAlgebraQuery] = useState("");
  const [sqlResult, setSqlResult] = useState("");

  const handleConvert = () => {
    const result = algebraSql(algebraQuery);
    setSqlResult(result);
  };

  const insertSymbol = (symbol) => {
    setAlgebraQuery((prev) => prev + symbol);
  };

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
            Conversor Álgebra → SQL
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 3 }}>
        {/* Botones de los símbolos */}
        <Stack direction="row" spacing={2} mb={2} flexWrap="wrap">
          {["π", "σ", "×", "∪", "∩", "-", "ρ"].map((sym) => (
            <Button
              key={sym}
              variant="outlined"
              onClick={() => insertSymbol(sym)}
              sx={{
                color: "#fff",
                borderColor: "#fff",
                fontSize: "1.5rem",
                fontWeight: "bold",
                minWidth: "60px",
                minHeight: "50px",
                textTransform: "none",
              }}
            >
              {sym}
            </Button>
          ))}
        </Stack>

        {/* Input Álgebra */}
        <Box mb={3}>
          <Typography variant="h6" sx={{ color: "#fff", mb: 1 }}>
            Ingresa tu expresión de álgebra relacional:
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={algebraQuery}
            onChange={(e) => setAlgebraQuery(e.target.value)}
            placeholder="Ej: π nombre, edad(σ edad>30(Empleados))"
            sx={{ backgroundColor: "#fff", borderRadius: 2 }}
          />
        </Box>

        {/* Botón Convertir */}
        <Button
          variant="contained"
          fullWidth
          onClick={handleConvert}
          sx={{
            py: 1.5,
            mb: 4,
            fontWeight: 600,
            fontSize: "1rem",
            background: "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)",
          }}
        >
          Convertir
        </Button>

        {/* Resultado */}
        {sqlResult && (
          <Box
            sx={{
              backgroundColor: "rgba(255,255,255,0.1)",
              borderRadius: 2,
              p: 3,
              color: "#fff",
              fontFamily: "monospace",
              whiteSpace: "pre-wrap",
            }}
          >
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Resultado:
            </Typography>
            <Typography variant="body1">{sqlResult}</Typography>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default AlgebraToSql;
