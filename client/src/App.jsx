import { BrowserRouter, Routes, Route } from "react-router-dom";
import WelcomePage from "./components/welcomePage/WelcomePage";
import OptionsCards from "./components/optionsPage/OptionsCards";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/options" element={<OptionsCards />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
