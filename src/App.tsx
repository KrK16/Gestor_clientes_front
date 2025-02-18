import { Route, Routes } from "react-router-dom";

import AgregarCliente from "./components/agregarCliente";
import SeleccionarCliente from "./components/seleccionarCliente";
import Compritas from "./pages/compras";
import Compritas2 from "./pages/compras2";

function App() {
  return (
    <Routes>
      <Route element={<AgregarCliente />} path="/" />
      <Route element={<SeleccionarCliente />} path="/seleccionar" />
      <Route element={<Compritas />} path="/compras" />
      <Route element={<Compritas2/>} path="/compras2" />
    </Routes>
  );
}

export default App;
