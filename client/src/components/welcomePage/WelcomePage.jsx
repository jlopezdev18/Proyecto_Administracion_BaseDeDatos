import { Box, Typography, Button, Container, Chip } from "@mui/material";
import { useNavigate } from "react-router-dom";
import DBTransformLogo from "../../assets/LogoDBTransform.png";
import Prism from "../../blocks/Backgrounds/Prism/Prism";

const WelcomePage = () => {
  const navigate = useNavigate();

  const handleStartTransforming = () => {
    navigate("/options");
  };

  return (
    <Box
      sx={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          background: "#222",
        }}
      >
        <Prism
          animationType="rotate"
          timeScale={0.5}
          height={3.5}
          baseWidth={5.5}
          offset={{ x: 0, y: -120 }}
          scale={3}
          hueShift={0}
          colorFrequency={1}
          noise={0}
          glow={0.7}
          bloom={1}
          transparent={false}
        />
      </Box>
      <Container
        sx={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          position: "relative",
          zIndex: 1,
          background: "transparent",
        }}
      >
        <Box>
          <img
            src={DBTransformLogo}
            alt="Logo"
            style={{ width: 220, height: 120, marginBottom: 5 }}
          />
          <Typography
            align="center"
            sx={{
              fontSize: "5rem",
              fontFamily: "fantasy",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "#8B4513",
              backgroundImage: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #e11d48 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
            gutterBottom
          >
            DB Transformer
          </Typography>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              gap: 1,
              marginBottom: 3,
            }}
          >
            <Chip
              label="Convert"
              sx={{
                width: 150,
                margin: "10px",
                padding: "15px",
                fontFamily: "fantasy",
                letterSpacing: "0.1em",
                textAlign: "center",
                textTransform: "uppercase",
                transition: "0.5s",
                backgroundImage:
                  "linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)",
                backgroundSize: "200% auto",
                color: "white",
                borderRadius: "10px",
                "&:hover": {
                  backgroundPosition: "right center",
                  color: "#fff",
                  textDecoration: "none",
                },
              }}
            />
            <Chip
              label="Map"
              sx={{
                width: 150,
                margin: "10px",
                padding: "15px",
                textAlign: "center",
                fontFamily: "fantasy",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                transition: "0.5s",
                backgroundImage:
                  "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                backgroundSize: "200% auto",
                color: "white",
                borderRadius: "10px",
                "&:hover": {
                  backgroundPosition: "right center",
                  color: "#fff",
                  textDecoration: "none",
                },
              }}
            />
            <Chip
              label="Transform"
              sx={{
                width: 150,
                margin: "10px",
                padding: "15px",
                fontFamily: "fantasy",
                letterSpacing: "0.1em",
                textAlign: "center",
                textTransform: "uppercase",
                transition: "0.5s",
                backgroundImage:
                  "linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)",
                backgroundSize: "200% auto",
                color: "white",
                borderRadius: "10px",
                "&:hover": {
                  backgroundPosition: "right center",
                  color: "#fff",
                  textDecoration: "none",
                },
              }}
            />
          </Box>
          <Button
            variant="contained"
            size="large"
            sx={{
              margin: "10px",
              width: "150px",
              textAlign: "center",
              textTransform: "uppercase",
              fontFamily: "fantasy",
              letterSpacing: "0.1em",
              transition: "0.5s",
              backgroundImage:
                "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)",
              backgroundSize: "200% auto",
              color: "white",
              borderRadius: "10px",
              "&:hover": {
                backgroundPosition: "right center",
                color: "#fff",
                textDecoration: "none",
              },
            }}
            onClick={handleStartTransforming}
          >
            Start
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default WelcomePage;
