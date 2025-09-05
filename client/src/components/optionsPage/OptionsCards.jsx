import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  IconButton,
  Container,
  Avatar,
  Fade,
  AppBar,
  Toolbar,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import HomeIcon from "@mui/icons-material/Home";
import { useNavigate } from "react-router-dom";

const converters = [
  {
    id: "db-to-er",
    title: "DB → Modelo Entidad-Relación",
    description: "Convierte esquemas de bases de datos a diagramas E-R básicos",
    icon: "🗂️",
    color: "#e11d48",
    gradient: "linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)",
  },
  {
    id: "db-to-eer",
    title: "DB → Modelo E-R Extendido",
    description: "Genera modelos E-R extendidos con herencia y especialización",
    icon: "📊",
    color: "#7c3aed",
    gradient: "linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)",
  },
  {
    id: "db-to-relational",
    title: "DB → Modelo Relacional",
    description:
      "Transforma bases de datos a esquemas relacionales normalizados",
    icon: "💾",
    color: "#059669",
    gradient: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
  },
  {
    id: "sql-to-algebra",
    title: "SQL → Álgebra Relacional",
    description: "Convierte consultas SQL a expresiones de álgebra relacional",
    icon: "∑",
    color: "#dc2626",
    gradient: "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)",
  },
  {
    id: "algebra-to-sql",
    title: "Álgebra Relacional → SQL",
    description: "Traduce expresiones de álgebra relacional a consultas SQL",
    icon: "💻",
    color: "#2563eb",
    gradient: "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)",
  },
];

const OptionsCards = () => {
  const navigate = useNavigate();

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
            sx={{ mr: 2 }}
          >
            <HomeIcon />
          </IconButton>
          <Typography
            variant="h6"
            component="h2"
            sx={{ flexGrow: 1, fontWeight: 600 }}
          >
            Convertidor de Bases de Datos
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 6 }}>
        {/* Page Title Section */}
        <Box textAlign="center" mb={6}>
          <Typography
            variant="h2"
            component="h1"
            sx={{
              background:
                "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #e11d48 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              color: "transparent",
              fontWeight: 700,
              mb: 2,
            }}
          >
            Elige tu Conversión
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: "rgba(255, 255, 255, 0.8)",
              maxWidth: 600,
              mx: "auto",
            }}
          >
            Selecciona el tipo de conversión que necesitas realizar
          </Typography>
        </Box>

        {/* Converters Grid */}
        <Grid container spacing={4} justifyContent="center">
          {converters.map((converter, index) => (
            <Grid item xs={12} sm={6} lg={4} key={converter.id}>
              <Fade in timeout={600 + index * 200}>
                <Card
                  sx={{
                    height: "100%",
                    position: "relative",
                    overflow: "hidden",
                    borderRadius: 4,
                    background: "rgba(255, 255, 255, 0.05)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-8px)",
                      boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                    },
                  }}
                  onClick={() =>
                    console.log("Selected converter:", converter.id)
                  }
                >
                  {/* Gradient Border Effect */}
                  <Box
                    sx={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 4,
                      background: converter.gradient,
                    }}
                  />

                  <CardContent sx={{ p: 3 }}>
                    {/* Card Header with Avatar */}
                    <Box display="flex" alignItems="center" mb={2}>
                      <Avatar
                        sx={{
                          background: converter.gradient,
                          width: 56,
                          height: 56,
                          fontSize: "1.5rem",
                          mr: 2,
                        }}
                      >
                        {converter.icon}
                      </Avatar>
                      <Typography
                        variant="h6"
                        component="h3"
                        sx={{
                          color: "#fff",
                          fontWeight: 600,
                          lineHeight: 1.2,
                        }}
                      >
                        {converter.title}
                      </Typography>
                    </Box>

                    {/* Description */}
                    <Typography
                      variant="body2"
                      sx={{
                        color: "rgba(255, 255, 255, 0.7)",
                        lineHeight: 1.6,
                        mb: 3,
                      }}
                    >
                      {converter.description}
                    </Typography>
                  </CardContent>

                  <CardActions sx={{ p: 3, pt: 0 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      endIcon={<PlayArrowIcon />}
                      sx={{
                        background: converter.gradient,
                        borderRadius: 2,
                        py: 1.5,
                        fontWeight: 600,
                        textTransform: "none",
                        fontSize: "1rem",
                        "&:hover": {
                          background: converter.gradient,
                          opacity: 0.9,
                        },
                      }}
                    >
                      Usar Conversor
                    </Button>
                  </CardActions>
                </Card>
              </Fade>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default OptionsCards;
