import { BrowserRouter, Routes, Route } from "react-router-dom";
import WelcomePage from "./components/welcomePage/WelcomePage";
import OptionsCards from "./components/optionsPage/OptionsCards";
import ERPage from "./components/erPage/ERPage";
import SqlAlgebra from "./Pages/sqlAlgebra";
import AlgebraSql from "./Pages/AlgebraSql";
import EERPage from "./components/eerPage/eerPage";
import Relacional from "./Pages/relacional"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/options" element={<OptionsCards />} />
        <Route path="/options/er" element={<ERPage />} />
        <Route path="/options/eer" element={<EERPage/>} />
        <Route path="/sql-to-algebra" element={<SqlAlgebra />} />
        <Route path="/algebra-to-sql" element={<AlgebraSql />} />
        <Route path="/options/relational" element={<Relacional />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
