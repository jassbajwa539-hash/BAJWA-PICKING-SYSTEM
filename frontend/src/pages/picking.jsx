import { useEffect, useRef, useState } from "react";
import api from "../api/api";
import ShortPickDialog from "../components/ShortPickDialog";

function Picking() {
  // ----------------------------------------------------
  // USER & AUTH
  // ----------------------------------------------------
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  // ----------------------------------------------------
  // DATA STATES
  // ----------------------------------------------------
  const [locationData, setLocationData] = useState(null);
  const [currentBox, setCurrentBox] = useState(null);
  const [currentTask, setCurrentTask] = useState(null);

  // ----------------------------------------------------
  // SCAN INPUT STATES
  // ----------------------------------------------------
  const [locationScan, setLocationScan] = useState("");
  const [boxScan, setBoxScan] = useState("");
  const [serialScan, setSerialScan] = useState("");

  // ----------------------------------------------------
  // UI & DIALOG STATES
  // ----------------------------------------------------
  const [step, setStep] = useState("LOCATION");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showShortDialog, setShowShortDialog] = useState(false);

  // ----------------------------------------------------
  // REFS
  // ----------------------------------------------------
  const locationRef = useRef();
  const boxRef = useRef();
  const serialRef = useRef();

  const successAudio = useRef(new Audio("/success.mp3"));
  const errorAudio = useRef(new Audio("/error.mp3"));

  // ----------------------------------------------------
  // AUDIO HELPERS
  // ----------------------------------------------------
  const successBeep = () => {
    successAudio.current.currentTime = 0;
    successAudio.current.play().catch(() => {});
  };

  const errorBeep = () => {
    errorAudio.current.currentTime = 0;
    errorAudio.current.play().catch(() => {});
  };

  // ----------------------------------------------------
  // INITIAL LOAD
  // ----------------------------------------------------
  useEffect(() => {
    loadLocation();
  }, []);

  const loadLocation = async () => {
    try {
      setCurrentBox(null);
      setCurrentTask(null);
      setLoading(true);

      const res = await api.get("/rf/location", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // NO ALERT: Render smoothly via locationData = null
      if (res.data?.completed) {
        setLocationData(null);
        return;
      }

      const data = res.data;
      setLocationData(data);

      const boxKeys = Object.keys(data?.boxes || {});
      if (boxKeys.length > 0) {
        const firstBoxName = boxKeys[0];
        const firstBoxTasks = data.boxes[firstBoxName];
        setCurrentBox(firstBoxName);
        setCurrentTask(firstBoxTasks[0] || null);
      }

      setLocationScan("");
      setBoxScan("");
      setSerialScan("");
      setStep("LOCATION");
      setStatus("");

      setTimeout(() => {
        locationRef.current?.focus();
      }, 200);
    } catch (err) {
      console.error(err);
      setStatus("❌ Unable to load Location");
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------
  // UNIFIED PROGRESSION HELPER
  // ----------------------------------------------------
  const handleProgression = async (data, prefix = "") => {
    successBeep();

    // 1. LOCATION COMPLETED
    if (data.location_completed) {
      setStatus(`✔ ${prefix}Location Completed`);
      setTimeout(async () => {
        await loadLocation();
        setStatus("");
      }, 500);
      return;
    }

    // 2. BOX COMPLETED -> NEXT BOX
    if (data.box_completed && data.next_box) {
      setCurrentBox(data.next_box.box || data.next_box.box_name);
      setCurrentTask(data.next_box);
      setBoxScan("");
      setSerialScan("");
      setStep("BOX");
      setStatus(`✔ ${prefix}Box Completed`);
      setTimeout(() => {
        boxRef.current?.focus();
      }, 100);
      return;
    }

    // 3. TASK/SKU COMPLETED -> NEXT SKU IN SAME BOX
    if ((data.task_completed || prefix) && data.task) {
      setCurrentTask(data.task);
      setSerialScan("");
      setStep("SERIAL");
      setStatus(`✔ ${prefix}Next SKU`);
      setTimeout(() => {
        serialRef.current?.focus();
      }, 100);
      return;
    }

    // 4. SAME TASK -> INCREMENT PICKED QTY
    if (!data.task_completed) {
      setCurrentTask((prev) => {
        const nextPicked = (prev?.picked_qty ?? 0) + 1;
        const required = prev?.required_qty ?? nextPicked;

        return {
          ...prev,
          picked_qty: nextPicked,
          remaining_qty: Math.max(required - nextPicked, 0),
        };
      });
      setStatus(`✔ ${prefix}Serial Picked`);
      setTimeout(() => {
        serialRef.current?.focus();
      }, 100);
      return;
    }
  };

  // ----------------------------------------------------
  // SCAN LOCATION
  // ----------------------------------------------------
  const scanLocation = async () => {
    if (processing) return;
    try {
      setProcessing(true);
      const res = await api.post(
        "/rf/scan-location",
        { location: locationScan.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.success) {
        successBeep();
        setStatus("✔ Location Verified");
        setLocationScan("");
        setStep("BOX");
        setTimeout(() => boxRef.current?.focus(), 100);
      }
    } catch (err) {
      errorBeep();
      setStatus("❌ Wrong Location");
      setLocationScan("");
      setTimeout(() => locationRef.current?.focus(), 100);
    } finally {
      setProcessing(false);
    }
  };

  // ----------------------------------------------------
  // SCAN BOX
  // ----------------------------------------------------
  const scanBox = async () => {
    if (processing || !currentTask) return;
    try {
      setProcessing(true);
      const res = await api.post(
        "/rf/scan-box",
        {
          task_id: currentTask.id || currentTask.task_id,
          box: boxScan.trim(),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.success) {
        successBeep();
        setStatus("✔ Box Verified");
        setBoxScan("");
        setStep("SERIAL");
        setTimeout(() => serialRef.current?.focus(), 100);
      }
    } catch (err) {
      errorBeep();
      setStatus("❌ Wrong Box");
      setBoxScan("");
      setTimeout(() => boxRef.current?.focus(), 100);
    } finally {
      setProcessing(false);
    }
  };

  // ----------------------------------------------------
  // SCAN SERIAL
  // ----------------------------------------------------
  const scanSerial = async () => {
    if (processing || !currentTask) return;
    try {
      setProcessing(true);
      const res = await api.post(
        "/rf/scan-serial",
        {
          task_id: currentTask.id || currentTask.task_id,
          serial: serialScan.trim(),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.success) {
        setSerialScan("");
        await handleProgression(res.data);
      }
    } catch (err) {
      errorBeep();
      setStatus("❌ Wrong Serial");
      setSerialScan("");
      setTimeout(() => {
        serialRef.current?.focus();
      }, 100);
    } finally {
      setProcessing(false);
    }
  };

  // ----------------------------------------------------
  // SHORT PICK HANDLERS
  // ----------------------------------------------------
  const handleOpenShortDialog = () => {
    setSerialScan(""); // Clean serial input before opening
    setShowShortDialog(true);
  };

  const handleShortPickSuccess = async (data) => {
    setShowShortDialog(false);
    await handleProgression(data, "Short Pick - ");
  };

  // ----------------------------------------------------
  // KEYPRESS ROUTER
  // ----------------------------------------------------
  const handleKeyDown = (e) => {
    if (e.key !== "Enter" || processing) return;

    if (step === "LOCATION") scanLocation();
    else if (step === "BOX") scanBox();
    else if (step === "SERIAL") scanSerial();
  };

  // ----------------------------------------------------
  // CONDITIONAL RENDERS
  // ----------------------------------------------------
  if (loading) {
    return (
      <div style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", fontSize: 28, fontWeight: "bold" }}>
        Loading...
      </div>
    );
  }

  if (!locationData) {
    return (
      <div style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", fontSize: 28, fontWeight: "bold" }}>
        Picking Completed
      </div>
    );
  }

  const progress = currentTask && currentTask.required_qty > 0
    ? (currentTask.picked_qty / currentTask.required_qty) * 100
    : 0;

  const statusColor = status.startsWith("✔")
    ? "green"
    : status.startsWith("❌")
    ? "red"
    : "#1976d2";

  return (
    <div style={{ background: "#f4f6f9", minHeight: "100vh", padding: 20 }}>
      <div style={{ maxWidth: 700, margin: "auto", background: "white", borderRadius: 10, padding: 25, boxShadow: "0 0 10px rgba(0,0,0,.1)" }}>
        <h1 style={{ textAlign: "center" }}>Warehouse RF Picking</h1>
        <hr />

        <h2>Location</h2>
        <h1 style={{ color: "#1976d2" }}>{locationData.location}</h1>
        <hr />

        <h2>Box</h2>
        <h1>{currentBox || "—"}</h1>
        <hr />

        <h2>SKU</h2>
        <h2>{currentTask?.sku || "—"}</h2>
        <hr />

        {/* Quantity Breakdown */}
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            <h3>Need</h3>
            <h1>{currentTask?.required_qty ?? 0}</h1>
          </div>
          <div>
            <h3>Picked</h3>
            <h1>{currentTask?.picked_qty ?? 0}</h1>
          </div>
          <div>
            <h3>Remaining</h3>
            <h1>{currentTask?.remaining_qty ?? 0}</h1>
          </div>
        </div>

        {/* Progress Bar & Percentage */}
        <div style={{ background: "#e0e0e0", borderRadius: 4, height: 10, marginTop: 15 }}>
          <div style={{ width: `${progress}%`, background: "#4caf50", height: "100%", borderRadius: 4, transition: "width 0.2s" }} />
        </div>
        <div style={{ textAlign: "center", marginTop: 8, fontSize: 14, fontWeight: "bold", color: "#555" }}>
          {Math.round(progress)}%
        </div>

        <hr />

        <h3>Scan Location</h3>
        <input
          ref={locationRef}
          value={locationScan}
          onChange={(e) => setLocationScan(e.target.value.toUpperCase())}
          onKeyDown={handleKeyDown}
          disabled={step !== "LOCATION" || processing}
          style={{ width: "100%", padding: 15, fontSize: 20 }}
        />

        <br /><br />

        <h3>Scan Box</h3>
        <input
          ref={boxRef}
          value={boxScan}
          onChange={(e) => setBoxScan(e.target.value.toUpperCase())}
          onKeyDown={handleKeyDown}
          disabled={step !== "BOX" || processing}
          style={{ width: "100%", padding: 15, fontSize: 20 }}
        />

        <br /><br />

        <h3>Scan Serial</h3>
        <input
          ref={serialRef}
          value={serialScan}
          onChange={(e) => setSerialScan(e.target.value.toUpperCase())}
          onKeyDown={handleKeyDown}
          disabled={step !== "SERIAL" || processing}
          style={{ width: "100%", padding: 15, fontSize: 20 }}
        />

        {/* SHORT PICK BUTTON */}
        {step === "SERIAL" && (
          <button
            onClick={handleOpenShortDialog}
            disabled={processing}
            style={{
              width: "100%",
              padding: 15,
              marginTop: 15,
              background: "#d32f2f",
              color: "white",
              fontWeight: "bold",
              fontSize: 18,
              border: "none",
              borderRadius: 5,
              cursor: processing ? "not-allowed" : "pointer",
            }}
          >
            ⚠️ Short Pick
          </button>
        )}

        <br /><br />

        <div style={{ textAlign: "center", fontSize: 22, fontWeight: "bold", color: statusColor }}>
          {status}
        </div>

        <br />

        <div style={{ textAlign: "center", color: "#777" }}>
          Logged in as <b>{user?.full_name || user?.username || "Operator"}</b>
        </div>
      </div>

      {/* SHORT PICK DIALOG */}
      <ShortPickDialog
        open={showShortDialog}
        task={currentTask}
        token={token}
        onClose={() => setShowShortDialog(false)}
        onSuccess={handleShortPickSuccess}
      />
    </div>
  );
}

export default Picking;