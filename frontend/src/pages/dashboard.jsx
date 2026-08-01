import { useNavigate } from "react-router-dom";

function Dashboard() {

    const navigate = useNavigate();

    const logout = () => {
        localStorage.clear();
        navigate("/");
    };

    const cardStyle = {
        background: "#fff",
        padding: "20px",
        borderRadius: "10px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        textAlign: "center"
    };

    const buttonStyle = {
        padding: "15px",
        fontSize: "16px",
        border: "none",
        borderRadius: "8px",
        background: "#1976d2",
        color: "white",
        cursor: "pointer"
    };

    return (
        <div style={{ background: "#f4f6f9", minHeight: "100vh" }}>

            <div style={{
                background: "#1976d2",
                color: "white",
                padding: "15px 30px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
            }}>
                <h2>Warehouse RF System</h2>

                <button
                    onClick={logout}
                    style={{
                        background: "red",
                        color: "white",
                        border: "none",
                        padding: "10px 20px",
                        borderRadius: "5px",
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
                    gap: "20px",
                    padding: "30px"
                }}
            >

                <div style={cardStyle}>
                    <h3>Total Inventory</h3>
                    <h1>0</h1>
                </div>

                <div style={cardStyle}>
                    <h3>Total Orders</h3>
                    <h1>0</h1>
                </div>

                <div style={cardStyle}>
                    <h3>Pending Picks</h3>
                    <h1>0</h1>
                </div>

                <div style={cardStyle}>
                    <h3>Completed Picks</h3>
                    <h1>0</h1>
                </div>

            </div>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3,1fr)",
                    gap: "20px",
                    padding: "0 30px 30px"
                }}
            >

                <button
                    style={buttonStyle}
                    onClick={() => alert("Inventory Upload Page")}
                >
                    Upload Inventory
                </button>

                <button
                    style={buttonStyle}
                    onClick={() => alert("Orders Upload Page")}
                >
                    Upload Orders
                </button>

                <button
                    style={buttonStyle}
                    onClick={() => navigate("/picking")}
                >
                    RF Picking
                </button>

            </div>

        </div>
    );
}

export default Dashboard;