import { Route, Routes } from "react-router-dom";
import Compritas from "./pages/compras";

function App() {
  return (
    <Routes>
      <Route element={<Compritas />} path="/compras" />
    </Routes>
  );
}

export default App;
