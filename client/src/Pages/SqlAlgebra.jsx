import React, { useState } from "react";
import { Box, Typography, TextField, Button, Container, IconButton } from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import { useNavigate } from "react-router-dom";
import { sqlAlgebra } from "../utils/sqlAlgebra";

const SqlAlgebra = () => {
  const navigate = useNavigate();
  const [sqlQuery, setSqlQuery] = useState("");
  const [algebraResult, setAlgebraResult] = useState("");

  const handleConvert = () => {
    const result = sqlAlgebra(sqlQuery);
    setAlgebraResult(result);
  };

  return (
    <Box sx={{ minHeight: "100vh", background: "linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)", py: 4 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={4} px={2}>
        <IconButton edge="start" color="inherit" onClick={() => navigate("/")} sx={{ mr: 2 }}>
          <HomeIcon sx={{ color: "#fff" }} />
        </IconButton>
        <Typography variant="h4" sx={{ color: "#fff", fontWeight: 600 }}>
          Conversor SQL → Álgebra Relacional
        </Typography>
      </Box>

      <Container maxWidth="md">
        {/* Input SQL */}
        <Box mb={3}>
          <Typography variant="h6" sx={{ color: "#fff", mb: 1 }}>
            Ingresa tu consulta SQL:
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={sqlQuery}
            onChange={(e) => setSqlQuery(e.target.value)}
            placeholder="Ej: SELECT nombre, edad FROM empleados WHERE edad > 30"
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
            background: "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)",
          }}
        >
          Convertir
        </Button>

        {/* Resultado */}
        {algebraResult && (
          <Box
            sx={{
              backgroundColor: "rgba(255,255,255,0.1)",
              borderRadius: 2,
              p: 3,
              color: "#fff",
              fontFamily: "monospace",
            }}
          >
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Resultado:
            </Typography>
            <Typography variant="body1">{algebraResult}</Typography>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default SqlAlgebra;
