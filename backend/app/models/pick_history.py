import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import api from "../api/api";

function PickingHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filter States
  const [orderNo, setOrderNo] = useState("");
  const [sku, setSku] = useState("");
  const [serialNo, setSerialNo] = useState("");
  const [picker, setPicker] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const token = localStorage.getItem("token");

  // ----------------------------------------------------
  // FETCH AUDIT HISTORY FROM BACKEND
  // ----------------------------------------------------
  const fetchHistory = async (overrideParams = null) => {
    try {
      setLoading(true);

      // Allows passing explicit clean params during Reset
      const params = overrideParams ?? {};

      if (!overrideParams) {
        if (orderNo.trim()) params.order_no = orderNo.trim();
        if (sku.trim()) params.sku = sku.trim();
        if (serialNo.trim()) params.serial_no = serialNo.trim();
        if (picker.trim()) params.picker = picker.trim();
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;
      }

      const res = await api.get("/history/picks", {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      setHistory(res.data || []);
    } catch (err) {
      console.error(err);
      alert("Failed to load pick history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // ----------------------------------------------------
  // FIXED RESET HANDLER (Fetches clean data immediately)
  // ----------------------------------------------------
  const handleReset = async () => {
    setOrderNo("");
    setSku("");
    setSerialNo("");
    setPicker("");
    setStartDate("");
    setEndDate("");

    // Fetch immediately using empty query parameters
    await fetchHistory({});
  };

  // ----------------------------------------------------
  // EXCEL EXPORT HANDLER
  // ----------------------------------------------------
  const exportToExcel = () => {
    if (history.length === 0) {
      alert("No data available to export.");
      return;
    }

    const exportData = history.map((item) => ({
      "Picked Date & Time": item.picked_at
        ? new Date(item.picked_at).toLocaleString()
        : "—",
      "Order No": item.order_no,
      "SKU": item.sku,
      "Serial No": item.serial_no,
      "Location": item.location,
      "Box": item.box,
      "Picker": item.picker,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);

    worksheet["!cols"] = [
      { wch: 22 }, // Date Time
      { wch: 15 }, // Order No
      { wch: 15 }, // SKU
      { wch: 22 }, // Serial No
      { wch: 12 }, // Location
      { wch: 12 }, // Box
      { wch: 15 }, // Picker
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Pick History");

    const dateStr = new Date().toISOString().split("T")[0];
    XLSX.writeFile(workbook, `Pick_History_${dateStr}.xlsx`);
  };

  return (
    <div style={{ background: "#f4f6f9", minHeight: "100vh", padding: 25 }}>
      <div
        style={{
          maxWidth: 1100,
          margin: "auto",
          background: "white",
          borderRadius: 10,
          padding: 25,
          boxShadow: "0 0 10px rgba(0,0,0,.1)",
        }}
      >
        <h1 style={{ textAlign: "center", marginBottom: 20 }}>
          📜 Picking History & Audit Trail
        </h1>

        {/* Filter Bar */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 12,
            marginBottom: 20,
            background: "#f8f9fa",
            padding: 15,
            borderRadius: 8,
          }}
        >
          <div>
            <label style={{ fontSize: 12, fontWeight: "bold" }}>Order No</label>
            <input
              type="text"
              placeholder="Filter Order..."
              value={orderNo}
              onChange={(e) => setOrderNo(e.target.value.toUpperCase())}
              style={{
                width: "100%",
                padding: 8,
                marginTop: 4,
                borderRadius: 4,
                border: "1px solid #ccc",
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: "bold" }}>SKU</label>
            <input
              type="text"
              placeholder="Filter SKU..."
              value={sku}
              onChange={(e) => setSku(e.target.value.toUpperCase())}
              style={{
                width: "100%",
                padding: 8,
                marginTop: 4,
                borderRadius: 4,
                border: "1px solid #ccc",
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: "bold" }}>Serial No</label>
            <input
              type="text"
              placeholder="Filter Serial..."
              value={serialNo}
              onChange={(e) => setSerialNo(e.target.value.toUpperCase())}
              style={{
                width: "100%",
                padding: 8,
                marginTop: 4,
                borderRadius: 4,
                border: "1px solid #ccc",
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: "bold" }}>Picker</label>
            <input
              type="text"
              placeholder="Filter Picker..."
              value={picker}
              onChange={(e) => setPicker(e.target.value)}
              style={{
                width: "100%",
                padding: 8,
                marginTop: 4,
                borderRadius: 4,
                border: "1px solid #ccc",
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: "bold" }}>From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                width: "100%",
                padding: 8,
                marginTop: 4,
                borderRadius: 4,
                border: "1px solid #ccc",
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: "bold" }}>To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{
                width: "100%",
                padding: 8,
                marginTop: 4,
                borderRadius: 4,
                border: "1px solid #ccc",
              }}
            />
          </div>
        </div>

        {/* Action Toolbar */}
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          <button
            onClick={() => fetchHistory()}
            style={{
              padding: "10px 20px",
              background: "#1976d2",
              color: "white",
              border: "none",
              borderRadius: 5,
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            🔍 Search
          </button>

          <button
            onClick={() => fetchHistory()}
            style={{
              padding: "10px 20px",
              background: "#0288d1",
              color: "white",
              border: "none",
              borderRadius: 5,
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            🔄 Refresh
          </button>

          <button
            onClick={handleReset}
            style={{
              padding: "10px 20px",
              background: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: 5,
              cursor: "pointer",
            }}
          >
            ❌ Clear Filters
          </button>

          <button
            onClick={exportToExcel}
            disabled={history.length === 0}
            style={{
              padding: "10px 20px",
              background: history.length === 0 ? "#ccc" : "#2e7d32",
              color: "white",
              border: "none",
              borderRadius: 5,
              cursor: history.length === 0 ? "not-allowed" : "pointer",
              fontWeight: "bold",
              marginLeft: "auto",
            }}
          >
            📊 Export to Excel
          </button>
        </div>

        {/* Record Counter */}
        <div style={{ marginBottom: 15, fontWeight: "bold", fontSize: 16, color: "#333" }}>
          Total Records: {history.length}
        </div>

        {/* History Table Container */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 40, fontSize: 18, fontWeight: "bold" }}>
            Loading audit records...
          </div>
        ) : (
          <div
            style={{
              maxHeight: "600px",
              overflowY: "auto",
              overflowX: "auto",
              border: "1px solid #e0e0e0",
              borderRadius: 6,
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr style={{ background: "#1976d2", color: "white", textAlign: "left" }}>
                  <th style={{ padding: 12, position: "sticky", top: 0, background: "#1976d2", zIndex: 1 }}>
                    Time
                  </th>
                  <th style={{ padding: 12, position: "sticky", top: 0, background: "#1976d2", zIndex: 1 }}>
                    Order
                  </th>
                  <th style={{ padding: 12, position: "sticky", top: 0, background: "#1976d2", zIndex: 1 }}>
                    SKU
                  </th>
                  <th style={{ padding: 12, position: "sticky", top: 0, background: "#1976d2", zIndex: 1 }}>
                    Serial
                  </th>
                  <th style={{ padding: 12, position: "sticky", top: 0, background: "#1976d2", zIndex: 1 }}>
                    Location
                  </th>
                  <th style={{ padding: 12, position: "sticky", top: 0, background: "#1976d2", zIndex: 1 }}>
                    Box
                  </th>
                  <th style={{ padding: 12, position: "sticky", top: 0, background: "#1976d2", zIndex: 1 }}>
                    Picker
                  </th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center", padding: 20, color: "#888" }}>
                      No pick records found.
                    </td>
                  </tr>
                ) : (
                  history.map((row, idx) => (
                    <tr
                      key={row.id || idx}
                      style={{
                        borderBottom: "1px solid #ddd",
                        background: idx % 2 === 0 ? "#ffffff" : "#f9f9f9",
                      }}
                    >
                      <td style={{ padding: 12 }}>
                        {row.picked_at ? new Date(row.picked_at).toLocaleString() : "—"}
                      </td>
                      <td style={{ padding: 12, fontWeight: "bold" }}>{row.order_no}</td>
                      <td style={{ padding: 12 }}>{row.sku}</td>
                      <td style={{ padding: 12, fontFamily: "monospace" }}>{row.serial_no}</td>
                      <td style={{ padding: 12 }}>{row.location}</td>
                      <td style={{ padding: 12 }}>{row.box}</td>
                      <td style={{ padding: 12 }}>{row.picker}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default PickingHistory;