import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";

export default function RFPicking() {
  const { taskId } = useParams();
  const navigate = useNavigate();

  const [currentTask, setCurrentTask] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    loadTask();
  }, []);

  async function loadTask() {
    try {
      const token = localStorage.getItem("token");

      console.log("Task ID:", taskId);

      const res = await api.get("/picking/tasks", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Tasks:", res.data);

      const task = res.data.find((t) => t.id === Number(taskId));

      console.log("Matched Task:", task);

      if (!task) {
        setError("Task not found");
        return;
      }

      setCurrentTask(task);
    } catch (err) {
      console.error(err);
      setError(JSON.stringify(err.response?.data || err.message));
    }
  }

  if (error) {
    return (
      <div style={{ padding: 30 }}>
        <h2 style={{ color: "red" }}>Error</h2>
        <pre>{error}</pre>
        <button onClick={() => navigate("/pick-tasks")}>Back</button>
      </div>
    );
  }

  if (!currentTask) {
    return (
      <div style={{ padding: 30 }}>
        <h2>Loading...</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: 30 }}>
      <h1>RF Picking Works ✅</h1>

      <p>
        <strong>Task ID:</strong> {taskId}
      </p>

      <p>
        <strong>Order:</strong> {currentTask.order_no}
      </p>

      <p>
        <strong>SKU:</strong> {currentTask.sku}
      </p>

      <p>
        <strong>Location:</strong> {currentTask.location}
      </p>

      <p>
        <strong>Box:</strong> {currentTask.box}
      </p>

      <button onClick={() => navigate("/pick-tasks")}>
        Back
      </button>
    </div>
  );
}