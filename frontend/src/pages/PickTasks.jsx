import { useEffect, useState } from "react";
import api from "../api/api";

function PickTasks() {

    const [tasks, setTasks] = useState([]);

    useEffect(() => {
        loadTasks();
    }, []);

    const loadTasks = async () => {

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

            setTasks(res.data);

        } catch (err) {

            alert(
                JSON.stringify(
                    err.response?.data || err.message
                )
            );

        }

    };

    return (

        <div style={{ padding: 30 }}>

            <h2>Picking Tasks</h2>

            <table
                border="1"
                cellPadding="10"
                width="100%"
            >

                <thead>

                    <tr>

                        <th>Order</th>
                        <th>SKU</th>
                        <th>Location</th>
                        <th>Box</th>
                        <th>Qty</th>
                        <th>Status</th>
                        <th>Action</th>

                    </tr>

                </thead>

                <tbody>

                    {tasks.map(task => (

                        <tr key={task.id}>

                            <td>{task.order_no}</td>
                            <td>{task.sku}</td>
                            <td>{task.location}</td>
                            <td>{task.box}</td>
                            <td>{task.required_qty}</td>
                            <td>{task.status}</td>

                            <td>

                                <button>

                                    Start Picking

                                </button>

                            </td>

                        </tr>

                    ))}

                </tbody>

            </table>

        </div>

    );

}

export default PickTasks;