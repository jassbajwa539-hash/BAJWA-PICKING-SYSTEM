import { useState } from "react";
import api from "../api/api";

const REASONS = [
  "NOT_FOUND",
  "DAMAGED",
  "EMPTY_LOCATION",
  "QUALITY_HOLD",
  "WRONG_STOCK",
  "OTHER",
];

function ShortPickDialog({ open, task, token, onClose, onSuccess }) {
  const [reason, setReason] = useState("NOT_FOUND");
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);

  if (!open || !task) return null;

  // Derive short quantity safely
  const shortQty = Math.max((task.required_qty ?? 0) - (task.picked_qty ?? 0), 0);

  // ----------------------------------------------------
  // IMPROVEMENT 1: RESET FORM ON CLOSE
  // ----------------------------------------------------
  const handleClose = () => {
    if (saving) return; // IMPROVEMENT 4: Prevent closing while saving
    setReason("NOT_FOUND");
    setRemarks("");
    onClose();
  };

  // ----------------------------------------------------
  // SUBMIT SHORT PICK
  // ----------------------------------------------------
  const submitShortPick = async () => {
    if (saving) return;

    // IMPROVEMENT 2: MANDATORY REMARKS FOR 'OTHER'
    if (reason === "OTHER" && !remarks.trim()) {
      alert("Please enter remarks when selecting 'OTHER'.");
      return;
    }

    try {
      setSaving(true);

      const res = await api.post(
        "/rf/short-pick",
        {
          task_id: task.id || task.task_id,
          reason,
          remarks: remarks.trim() || null,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data?.success) {
        // Reset state & inform parent
        setReason("NOT_FOUND");
        setRemarks("");
        onSuccess(res.data);
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Failed to create short pick.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={(e) => {
        // IMPROVEMENT 4: Prevent backdrop click while saving
        if (e.target === e.currentTarget && !saving) {
          handleClose();
        }
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: 10,
          padding: 25,
          width: "90%",
          maxWidth: 450,
          boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
        }}
      >
        <h2 style={{ textAlign: "center", color: "#d32f2f", marginTop: 0 }}>
          ⚠️ SHORT PICK
        </h2>
        <hr />

        {/* Quantity Breakdown */}
        <div style={{ fontSize: 16, lineHeight: "1.8em", margin: "15px 0" }}>
          <div>
            <strong>SKU:</strong> {task.sku || "—"}
          </div>
          <div>
            <strong>Required:</strong> {task.required_qty ?? 0}
          </div>
          <div>
            <strong>Picked:</strong> {task.picked_qty ?? 0}
          </div>
          <div style={{ color: "#d32f2f", fontSize: 18, marginTop: 5 }}>
            <strong>Short:</strong> {shortQty}
          </div>
        </div>

        <hr />

        {/* Reason Selector */}
        <div style={{ margin: "15px 0" }}>
          <label style={{ fontWeight: "bold", display: "block", marginBottom: 6 }}>
            Reason
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={saving}
            style={{
              width: "100%",
              padding: 12,
              fontSize: 16,
              borderRadius: 5,
              border: "1px solid #ccc",
              background: "white",
            }}
          >
            {REASONS.map((r) => (
              <option key={r} value={r}>
                {/* IMPROVEMENT 3: REPLACE ALL UNDERSCORES */}
                {r.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </div>

        {/* Remarks Input */}
        <div style={{ margin: "15px 0" }}>
          <label style={{ fontWeight: "bold", display: "block", marginBottom: 6 }}>
            Remarks {reason === "OTHER" ? <span style={{ color: "#d32f2f" }}>* (Required)</span> : "(Optional)"}
          </label>
          <textarea
            rows={3}
            placeholder={
              reason === "OTHER"
                ? "Describe the issue..."
                : "Add any extra notes..."
            }
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            disabled={saving}
            style={{
              width: "100%",
              padding: 10,
              fontSize: 14,
              borderRadius: 5,
              border: `1px solid ${reason === "OTHER" && !remarks.trim() ? "#d32f2f" : "#ccc"}`,
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button
            onClick={handleClose}
            disabled={saving}
            style={{
              flex: 1,
              padding: 12,
              background: saving ? "#ccc" : "#6c757d",
              color: "white",
              border: "none",
              borderRadius: 5,
              fontWeight: "bold",
              fontSize: 16,
              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={submitShortPick}
            disabled={saving}
            style={{
              flex: 1,
              padding: 12,
              background: saving ? "#ccc" : "#d32f2f",
              color: "white",
              border: "none",
              borderRadius: 5,
              fontWeight: "bold",
              fontSize: 16,
              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            {saving ? "Saving..." : "Confirm Short Pick"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ShortPickDialog;