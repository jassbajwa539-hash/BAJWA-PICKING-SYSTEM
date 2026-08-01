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
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/picking" element={<Picking />} />
        <Route path="/inventory-upload" element={<InventoryUpload />} />
        <Route path="/orders-upload" element={<OrdersUpload />} />
        <Route path="/pick-tasks" element={<PickTasks />} />
        <Route path="/rf-picking" element={<RFPicking />} />
        <Route path="/generate-picking" element={<GeneratePicking />} />
        <Route path="/inventory-list" element={<InventoryList />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;