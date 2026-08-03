import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";

function RFPicking() {
  const { taskId } = useParams();
  const navigate = useNavigate();

  const [currentTask, setCurrentTask] = useState(null);

  const [location, setLocation] = useState("");
  const [box, setBox] = useState("");
  const [serial, setSerial] = useState("");

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTask();
  }, []);

  const loadTask = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await api.get("/picking/tasks", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const task = res.data.find(
        (t) => Number(t.id) === Number(taskId)
      );

      if (!task) {
        alert("Task not found");
        navigate("/pick-tasks");
        return;
      }

      setCurrentTask(task);
    } catch (err) {
      console.error(err);
      alert(JSON.stringify(err.response?.data || err.message));
    } finally {
      setLoading(false);
    }
  };

  const scan = async () => {
    if (!location || !box || !serial) {
      alert("Please scan Location, Box and Serial.");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      await api.post(
        "/rf/scan",
        {
          task_id: currentTask.id,
          location,
          box,
          serial,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Serial Picked Successfully");

      navigate("/pick-tasks");
    } catch (err) {
      console.error(err);
      alert(JSON.stringify(err.response?.data || err.message));
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 40 }}>
        <h2>Loading...</h2>
      </div>
    );
  }

  if (!currentTask) {
    return (
      <div style={{ padding: 40 }}>
        <h2>Task not found.</h2>

        <button onClick={() => navigate("/pick-tasks")}>
          Back
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 30, maxWidth: 600, margin: "auto" }}>
      <h1>RF Picking</h1>

      <hr />

      <p><b>Order :</b> {currentTask.order_no}</p>
      <p><b>SKU :</b> {currentTask.sku}</p>
      <p><b>Location :</b> {currentTask.location}</p>
      <p><b>Box :</b> {currentTask.box}</p>
      <p><b>Required Qty :</b> {currentTask.required_qty}</p>

      <br />

      <input
        type="text"
        placeholder="Scan Location"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        style={{
          width: "100%",
          padding: "12px",
          marginBottom: "15px",
        }}
      />

      <input
        type="text"
        placeholder="Scan Box"
        value={box}
        onChange={(e) => setBox(e.target.value)}
        style={{
          width: "100%",
          padding: "12px",
          marginBottom: "15px",
        }}
      />

      <input
        type="text"
        placeholder="Scan Serial"
        value={serial}
        onChange={(e) => setSerial(e.target.value)}
        style={{
          width: "100%",
          padding: "12px",
          marginBottom: "20px",
        }}
      />

      <button
        onClick={scan}
        style={{
          background: "#2e7d32",
          color: "#fff",
          border: "none",
          padding: "12px 25px",
          borderRadius: "5px",
          cursor: "pointer",
          marginRight: "10px",
        }}
      >
        Confirm Pick
      </button>

      <button
        onClick={() => navigate("/pick-tasks")}
        style={{
          padding: "12px 25px",
          cursor: "pointer",
        }}
      >
        Back
      </button>
    </div>
  );
}

export default RFPicking;