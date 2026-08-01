import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

function Dashboard() {

    const navigate = useNavigate();

    const user = JSON.parse(localStorage.getItem("user"));

    const [summary, setSummary] = useState({
        inventory: 0,
        orders: 0,
        pending: 0,
        completed: 0
    });

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {

        try {

            const token = localStorage.getItem("token");

            const res = await api.get(
                "/dashboard/summary",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setSummary(res.data);

        } catch (err) {

            console.log(err);

        }

    };

    const logout = () => {

        localStorage.clear();

        navigate("/");

    };

    const card = {
        background: "#fff",
        padding: 20,
        borderRadius: 10,
        boxShadow: "0 2px 8px rgba(0,0,0,.1)",
        textAlign: "center"
    };

    const button = {
        padding: 18,
        border: "none",
        borderRadius: 8,
        background: "#1976d2",
        color: "#fff",
        cursor: "pointer",
        fontSize: 16
    };

    return (

        <div style={{ background: "#f5f6fa", minHeight: "100vh" }}>

            <div
                style={{
                    background: "#1976d2",
                    color: "white",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "15px 30px"
                }}
            >

                <div>

                    <h2>Warehouse RF System</h2>

                    <small>

                        Welcome {user?.full_name}

                    </small>

                </div>

                <button
                    onClick={logout}
                    style={{
                        background: "red",
                        color: "#fff",
                        border: "none",
                        padding: "10px 20px",
                        borderRadius: 5
                    }}
                >

                    Logout

                </button>

            </div>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4,1fr)",
                    gap: 20,
                    padding: 30
                }}
            >

                <div style={card}>
                    <h3>Total Inventory</h3>
                    <h1>{summary.inventory}</h1>
                </div>

                <div style={card}>
                    <h3>Total Orders</h3>
                    <h1>{summary.orders}</h1>
                </div>

                <div style={card}>
                    <h3>Pending Picks</h3>
                    <h1>{summary.pending}</h1>
                </div>

                <div style={card}>
                    <h3>Completed Picks</h3>
                    <h1>{summary.completed}</h1>
                </div>

            </div>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3,1fr)",
                    gap: 20,
                    padding: "0 30px 30px"
                }}
            >

                <button
                    style={button}
                    onClick={() => navigate("/inventory-upload")}
                >
                    📦 Upload Inventory
                </button>

                <button
                    style={button}
                    onClick={() => navigate("/orders-upload")}
                >
                    📋 Upload Orders
                </button>

                <button
                    style={button}
                    onClick={() => navigate("/generate-picking")}
                >
                    ⚙️ Generate Picking
                </button>

                <button
                    style={button}
                    onClick={() => navigate("/pick-tasks")}
                >
                    🚶 Pick Tasks
                </button>

                <button
                    style={button}
                    onClick={() => navigate("/inventory-list")}
                >
                    📦 Inventory List
                </button>

                <button
                    style={button}
                    onClick={() => navigate("/reports")}
                >
                    📈 Reports
                </button>

            </div>

        </div>

    );

}

export default Dashboard;