import { useEffect, useState } from "react";
import api from "../api/api";

function SupervisorApproval() {
  const [shortPicks, setShortPicks] = useState([]);
  const [stats, setStats] = useState({ pending: 0, approved_today: 0, rejected: 0, reallocated: 0 });
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  // Filters
  const [orderNo, setOrderNo] = useState("");
  const [sku, setSku] = useState("");
  const [picker, setPicker] = useState("");
  const [reason, setReason] = useState("");
  const [statusFilter, setStatusFilter] = useState("PENDING");

  const token = localStorage.getItem("token");

  // Fetch Dashboard Stats
  const fetchStats = async () => {
    try {
      const res = await api.get("/supervisor/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(res.data);
    } catch (err) {
      console.error("Failed to load stats", err);
    }
  };

  // Fetch Short Picks
  const fetchShortPicks = async () => {
    try {
      setLoading(true);
      const params = {};
      if (orderNo.trim()) params.order_no = orderNo.trim();
      if (sku.trim()) params.sku = sku.trim();
      if (picker.trim()) params.picker = picker.trim();
      if (reason) params.reason = reason;
      if (statusFilter) params.status = statusFilter;

      const res = await api.get("/supervisor/short-picks", {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      setShortPicks(res.data || []);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch short picks queue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchShortPicks();
  }, [statusFilter]);

  const handleAction = async (id, actionType) => {
    const remarks = prompt(`Enter optional remarks for ${actionType.toUpperCase()}:`, "Verified by supervisor");
    if (remarks === null) return; // User cancelled

    try {
      setProcessingId(id);
      let endpoint = "/supervisor/approve-short-pick";
      let payload = { id, remarks };

      if (actionType === "reject") {
        endpoint = "/supervisor/reject-short-pick";
      } else if (actionType === "reallocate") {
        const newLoc = prompt("Enter NEW Location for reallocation:", "MR-0002");
        if (!newLoc) return;
        const newBox = prompt("Enter NEW Box identifier:", "BOX02");
        endpoint = "/supervisor/reallocate-short-pick";
        payload = { id, new_location: newLoc, new_box: newBox, remarks };
      }

      await api.post(endpoint, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      await fetchStats();
      await fetchShortPicks();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || `Failed to ${actionType} short pick.`);
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "PENDING":
        return <span style={{ background: "#fff3cd", color: "#856404", padding: "4px 8px", borderRadius: 4, fontWeight: "bold" }}>🟡 PENDING</span>;
      case "APPROVED":
        return <span style={{ background: "#d4edda", color: "#155724", padding: "4px 8px", borderRadius: 4, fontWeight: "bold" }}>🟢 APPROVED</span>;
      case "REJECTED":
        return <span style={{ background: "#f8d7da", color: "#721c24", padding: "4px 8px", borderRadius: 4, fontWeight: "bold" }}>🔴 REJECTED</span>;
      case "REALLOCATED":
        return <span style={{ background: "#d1ecf1", color: "#0c5460", padding: "4px 8px", borderRadius: 4, fontWeight: "bold" }}>🔵 REALLOCATED</span>;
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div style={{ background: "#f4f6f9", minHeight: "100vh", padding: 25 }}>
      <div style={{ maxWidth: 1200, margin: "auto", background: "white", borderRadius: 10, padding: 25, boxShadow: "0 0 10px rgba(0,0,0,.1)" }}>
        <h1 style={{ textAlign: "center", marginBottom: 20 }}>🛡️ Supervisor Exception Queue</h1>

        {/* Dashboard Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 15, marginBottom: 25 }}>
          <div style={{ background: "#fff3cd", borderLeft: "5px solid #ffc107", padding: 15, borderRadius: 6 }}>
            <h4 style={{ margin: 0, color: "#856404" }}>Pending Short Picks</h4>
            <h1 style={{ margin: "10px 0 0 0", color: "#856404" }}>{stats.pending}</h1>
          </div>
          <div style={{ background: "#d4edda", borderLeft: "5px solid #28a745", padding: 15, borderRadius: 6 }}>
            <h4 style={{ margin: 0, color: "#155724" }}>Approved Today</h4>
            <h1 style={{ margin: "10px 0 0 0", color: "#155724" }}>{stats.approved_today}</h1>
          </div>
          <div style={{ background: "#f8d7da", borderLeft: "5px solid #dc3545", padding: 15, borderRadius: 6 }}>
            <h4 style={{ margin: 0, color: "#721c24" }}>Rejected</h4>
            <h1 style={{ margin: "10px 0 0 0", color: "#721c24" }}>{stats.rejected}</h1>
          </div>
          <div style={{ background: "#d1ecf1", borderLeft: "5px solid #17a2b8", padding: 15, borderRadius: 6 }}>
            <h4 style={{ margin: 0, color: "#0c5460" }}>Reallocated</h4>
            <h1 style={{ margin: "10px 0 0 0", color: "#0c5460" }}>{stats.reallocated}</h1>
          </div>
        </div>

        {/* Filter Bar */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, padding: 15, background: "#f8f9fa", borderRadius: 8, marginBottom: 20 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: "bold" }}>Order No</label>
            <input type="text" value={orderNo} onChange={(e) => setOrderNo(e.target.value.toUpperCase())} style={{ width: "100%", padding: 6, marginTop: 4 }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: "bold" }}>SKU</label>
            <input type="text" value={sku} onChange={(e) => setSku(e.target.value.toUpperCase())} style={{ width: "100%", padding: 6, marginTop: 4 }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: "bold" }}>Picker</label>
            <input type="text" value={picker} onChange={(e) => setPicker(e.target.value)} style={{ width: "100%", padding: 6, marginTop: 4 }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: "bold" }}>Reason</label>
            <select value={reason} onChange={(e) => setReason(e.target.value)} style={{ width: "100%", padding: 6, marginTop: 4 }}>
              <option value="">All Reasons</option>
              <option value="NOT_FOUND">NOT FOUND</option>
              <option value="DAMAGED">DAMAGED</option>
              <option value="EMPTY_LOCATION">EMPTY LOCATION</option>
              <option value="QUALITY_HOLD">QUALITY HOLD</option>
              <option value="WRONG_STOCK">WRONG STOCK</option>
              <option value="OTHER">OTHER</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: "bold" }}>Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: "100%", padding: 6, marginTop: 4 }}>
              <option value="PENDING">PENDING</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
              <option value="REALLOCATED">REALLOCATED</option>
              <option value="">ALL</option>
            </select>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: "flex", gap: 10, marginBottom: 15 }}>
          <button onClick={fetchShortPicks} style={{ padding: "8px 16px", background: "#1976d2", color: "white", border: "none", borderRadius: 4, cursor: "pointer", fontWeight: "bold" }}>🔍 Apply Filters</button>
          <button onClick={() => { setOrderNo(""); setSku(""); setPicker(""); setReason(""); setStatusFilter("PENDING"); }} style={{ padding: "8px 16px", background: "#6c757d", color: "white", border: "none", borderRadius: 4, cursor: "pointer" }}>❌ Clear</button>
        </div>

        {/* Table View */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 30 }}>Loading pending short picks...</div>
        ) : (
          <div style={{ maxHeight: 550, overflowY: "auto", border: "1px solid #ddd", borderRadius: 6 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#343a40", color: "white", textAlign: "left" }}>
                  <th style={{ padding: 10, position: "sticky", top: 0, background: "#343a40" }}>Order</th>
                  <th style={{ padding: 10, position: "sticky", top: 0, background: "#343a40" }}>SKU</th>
                  <th style={{ padding: 10, position: "sticky", top: 0, background: "#343a40" }}>Location / Box</th>
                  <th style={{ padding: 10, position: "sticky", top: 0, background: "#343a40" }}>Need / Pick / Short</th>
                  <th style={{ padding: 10, position: "sticky", top: 0, background: "#343a40" }}>Reason & Remarks</th>
                  <th style={{ padding: 10, position: "sticky", top: 0, background: "#343a40" }}>Picker</th>
                  <th style={{ padding: 10, position: "sticky", top: 0, background: "#343a40" }}>Status</th>
                  <th style={{ padding: 10, position: "sticky", top: 0, background: "#343a40", textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {shortPicks.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: "center", padding: 20, color: "#888" }}>No short picks found for selected filters.</td>
                  </tr>
                ) : (
                  shortPicks.map((row) => (
                    <tr key={row.id} style={{ borderBottom: "1px solid #eee" }}>
                      <td style={{ padding: 10, fontWeight: "bold" }}>{row.order_no}</td>
                      <td style={{ padding: 10 }}>{row.sku}</td>
                      <td style={{ padding: 10 }}>{row.location} / {row.box}</td>
                      <td style={{ padding: 10 }}>
                        {row.required_qty} / {row.picked_qty} / <b style={{ color: "#dc3545" }}>{row.short_qty}</b>
                      </td>
                      <td style={{ padding: 10 }}>
                        <div><b>{row.reason.replaceAll("_", " ")}</b></div>
                        {row.remarks && <small style={{ color: "#666" }}>{row.remarks}</small>}
                      </td>
                      <td style={{ padding: 10 }}>{row.picker}</td>
                      <td style={{ padding: 10 }}>{getStatusBadge(row.status)}</td>
                      <td style={{ padding: 10, textAlign: "center" }}>
                        {row.status === "PENDING" ? (
                          <div style={{ display: "flex", gap: 5, justifyContent: "center" }}>
                            <button
                              onClick={() => handleAction(row.id, "approve")}
                              disabled={processingId === row.id}
                              style={{ background: "#28a745", color: "white", border: "none", padding: "6px 10px", borderRadius: 4, cursor: "pointer", fontWeight: "bold" }}
                            >
                              ✓ Approve
                            </button>
                            <button
                              onClick={() => handleAction(row.id, "reject")}
                              disabled={processingId === row.id}
                              style={{ background: "#dc3545", color: "white", border: "none", padding: "6px 10px", borderRadius: 4, cursor: "pointer", fontWeight: "bold" }}
                            >
                              ✗ Reject
                            </button>
                            <button
                              onClick={() => handleAction(row.id, "reallocate")}
                              disabled={processingId === row.id}
                              style={{ background: "#17a2b8", color: "white", border: "none", padding: "6px 10px", borderRadius: 4, cursor: "pointer", fontWeight: "bold" }}
                            >
                              ↻ Reallocate
                            </button>
                          </div>
                        ) : (
                          <small style={{ color: "#888" }}>By {row.resolved_by || "System"}</small>
                        )}
                      </td>
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

export default SupervisorApproval;