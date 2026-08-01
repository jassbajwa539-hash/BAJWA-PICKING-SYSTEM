import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

function Dashboard() {

    const navigate = useNavigate();

    const user = JSON.parse(localStorage.getItem("user"));

    const [loading, setLoading] = useState(true);

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

            console.log("Dashboard Response:", res.data);

            setSummary({
                inventory:
                    Number(res.data.inventory) ||
                    Number(res.data.total_inventory) ||
                    0,

                orders:
                    Number(res.data.orders) ||
                    Number(res.data.total_orders) ||
                    0,

                pending:
                    Number(res.data.pending) ||
                    Number(res.data.pending_picks) ||
                    0,

                completed:
                    Number(res.data.completed) ||
                    Number(res.data.completed_picks) ||
                    0
            });

        } catch (err) {

            console.error(err);

            alert(
                JSON.stringify(
                    err.response?.data || err.message
                )
            );

        } finally {

            setLoading(false);

        }

    };

    const logout = () => {

        localStorage.clear();

        navigate("/");

    };

    const cardStyle = {
        background: "#fff",
        padding: 20,
        borderRadius: 10,
        boxShadow: "0 2px 8px rgba(0,0,0,.1)",
        textAlign: "center"
    };

    const buttonStyle = {
        padding: 18,
        border: "none",
        borderRadius: 8,
        background: "#1976d2",
        color: "#fff",
        cursor: "pointer",
        fontSize: 16
    };

    if (loading)
        return (
            <div style={{ padding: 40 }}>
                <h2>Loading Dashboard...</h2>
            </div>
        );

    return (

        <div style={{ background: "#f5f6fa", minHeight: "100vh" }}>

            <div
                style={{
                    background: "#1976d2",
                    color: "#fff",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "15px 30px"
                }}
            >

                <div>

                    <h2>Warehouse RF System</h2>

                    <small>

                        Welcome {user?.full_name || user?.username}

                    </small>

                </div>

                <button
                    onClick={logout}
                    style={{
                        background: "red",
                        color: "#fff",
                        border: "none",
                        padding: "10px 20px",
                        borderRadius: 5,
                        cursor: "pointer"
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

                <div style={cardStyle}>
                    <h3>Total Inventory</h3>
                    <h1>{summary.inventory}</h1>
                </div>

                <div style={cardStyle}>
                    <h3>Total Orders</h3>
                    <h1>{summary.orders}</h1>
                </div>

                <div style={cardStyle}>
                    <h3>Pending Picks</h3>
                    <h1>{summary.pending}</h1>
                </div>

                <div style={cardStyle}>
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
                    style={buttonStyle}
                    onClick={() => navigate("/inventory-upload")}
                >
                    📦 Upload Inventory
                </button>

                <button
                    style={buttonStyle}
                    onClick={() => navigate("/orders-upload")}
                >
                    📋 Upload Orders
                </button>

                <button
                    style={buttonStyle}
                    onClick={() => navigate("/generate-picking")}
                >
                    ⚙️ Generate Picking
                </button>

                <button
                    style={buttonStyle}
                    onClick={() => navigate("/pick-tasks")}
                >
                    🚶 Pick Tasks
                </button>

                <button
                    style={buttonStyle}
                    onClick={() => navigate("/inventory-list")}
                >
                    📦 Inventory List
                </button>

                <button
                    style={buttonStyle}
                    onClick={() => navigate("/reports")}
                >
                    📈 Reports
                </button>

            </div>

        </div>

    );

}

export default Dashboard;