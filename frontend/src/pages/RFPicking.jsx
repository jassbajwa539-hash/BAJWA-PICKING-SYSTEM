import { useEffect, useState } from "react";
import api from "../api/api";

function RFPicking() {

    const [tasks, setTasks] = useState([]);
    const [currentTask, setCurrentTask] = useState(null);

    const [location, setLocation] = useState("");
    const [box, setBox] = useState("");
    const [serial, setSerial] = useState("");

    useEffect(() => {
        loadTasks();
    }, []);

    const loadTasks = async () => {

        const token = localStorage.getItem("token");

        const res = await api.get(
            "/picking/tasks",
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        setTasks(res.data);

        if (res.data.length > 0)
            setCurrentTask(res.data[0]);
    };

    const scan = async () => {

        const token = localStorage.getItem("token");

        try {

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

            setLocation("");
            setBox("");
            setSerial("");

            loadTasks();

        } catch (err) {

            alert(
                JSON.stringify(
                    err.response?.data || err.message
                )
            );

        }

    };

    if (!currentTask)
        return <h2>No Pending Picking</h2>;

    return (

        <div style={{ padding: 30 }}>

            <h2>RF Picking</h2>

            <hr />

            <h3>Order : {currentTask.order_no}</h3>

            <h3>SKU : {currentTask.sku}</h3>

            <h3>Location : {currentTask.location}</h3>

            <h3>Box : {currentTask.box}</h3>

            <h3>Qty : {currentTask.required_qty}</h3>

            <br />

            <input
                placeholder="Scan Location"
                value={location}
                onChange={(e)=>setLocation(e.target.value)}
            />

            <br /><br />

            <input
                placeholder="Scan Box"
                value={box}
                onChange={(e)=>setBox(e.target.value)}
            />

            <br /><br />

            <input
                placeholder="Scan Serial"
                value={serial}
                onChange={(e)=>setSerial(e.target.value)}
            />

            <br /><br />

            <button onClick={scan}>

                Confirm Pick

            </button>

        </div>

    );

}

export default RFPicking;