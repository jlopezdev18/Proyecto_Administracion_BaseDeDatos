import { BrowserRouter, Routes, Route } from "react-router-dom";
import WelcomePage from "./components/welcomePage/WelcomePage";
import OptionsCards from "./components/optionsPage/OptionsCards";
import ERPage from "./components/erPage/ERPage";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/options" element={<OptionsCards />} />
        <Route path="/options/er" element={<ERPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
