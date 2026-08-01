import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Picking from "./pages/Picking";
import InventoryUpload from "./pages/InventoryUpload";
import OrdersUpload from "./pages/OrdersUpload";
import PickTasks from "./pages/PickTasks";
import RFPicking from "./pages/RFPicking";
import GeneratePicking from "./pages/GeneratePicking";
import InventoryList from "./pages/InventoryList";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Login */}
        <Route
          path="/"
          element={<Login />}
        />

        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        {/* Inventory */}
        <Route
          path="/inventory-upload"
          element={<InventoryUpload />}
        />

        <Route
          path="/inventory-list"
          element={<InventoryList />}
        />

        {/* Orders */}
        <Route
          path="/orders-upload"
          element={<OrdersUpload />}
        />

        {/* Picking */}
        <Route
          path="/generate-picking"
          element={<GeneratePicking />}
        />

        <Route
          path="/pick-tasks"
          element={<PickTasks />}
        />

        <Route
          path="/rf-picking/:taskId"
          element={<RFPicking />}
        />

        <Route
          path="/picking"
          element={<Picking />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;