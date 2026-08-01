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

    useEffect(() => {
        loadTask();
    }, []);

    const loadTask = async () => {

        try {

            const token = localStorage.getItem("token");

            const res = await api.get(
                "/picking/tasks",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const task = res.data.find(
                t => t.id === Number(taskId)
            );

            if (!task) {

                alert("Task not found");

                navigate("/pick-tasks");

                return;

            }

            setCurrentTask(task);

        } catch (err) {

            alert(
                JSON.stringify(
                    err.response?.data || err.message
                )
            );

        }

    };

    const scan = async () => {

        try {

            const token = localStorage.getItem("token");

            await api.post(
                "/rf/scan",
                {
                    task_id: currentTask.id,
                    location,
                    box,
                    serial
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            alert("Serial Picked Successfully");

            navigate("/pick-tasks");

        } catch (err) {

            alert(
                JSON.stringify(
                    err.response?.data || err.message
                )
            );

        }

    };

    if (!currentTask)
        return <h2>Loading...</h2>;

    return (

        <div style={{ padding: 30 }}>

            <h2>RF Picking</h2>

            <hr />

            <h3>Order : {currentTask.order_no}</h3>

            <h3>SKU : {currentTask.sku}</h3>

            <h3>Location : {currentTask.location}</h3>

            <h3>Box : {currentTask.box}</h3>

            <h3>Required Qty : {currentTask.required_qty}</h3>

            <br />

            <input
                placeholder="Scan Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
            />

            <br /><br />

            <input
                placeholder="Scan Box"
                value={box}
                onChange={(e) => setBox(e.target.value)}
            />

            <br /><br />

            <input
                placeholder="Scan Serial"
                value={serial}
                onChange={(e) => setSerial(e.target.value)}
            />

            <br /><br />

            <button
                onClick={scan}
            >
                Confirm Pick
            </button>

            <br /><br />

            <button
                onClick={() => navigate("/pick-tasks")}
            >
                Back
            </button>

        </div>

    );

}

export default RFPicking;