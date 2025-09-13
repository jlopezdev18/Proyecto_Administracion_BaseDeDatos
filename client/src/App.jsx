import { BrowserRouter, Routes, Route } from "react-router-dom";
import WelcomePage from "./components/welcomePage/WelcomePage";
import OptionsCards from "./components/optionsPage/OptionsCards";
import SqlAlgebra from "./Pages/sqlAlgebra";
import AlgebraSql from "./Pages/AlgebraSql";



function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/options" element={<OptionsCards />} />
        <Route path="/sql-to-algebra" element={<SqlAlgebra />} />
        <Route path="/algebra-to-sql" element={<AlgebraSql />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
