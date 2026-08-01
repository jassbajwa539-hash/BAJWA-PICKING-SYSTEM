import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

function GeneratePicking() {

    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const generatePicking = async () => {

        try {

            setLoading(true);

            const token = localStorage.getItem("token");

            const res = await api.post(
                "/picking/generate",
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setMessage(res.data.message || "Picking Generated Successfully");

            setTimeout(() => {

                navigate("/pick-tasks");

            }, 1500);

        } catch (err) {

            alert(
                JSON.stringify(
                    err.response?.data || err.message
                )
            );

        } finally {

            setLoading(false);

        }

    };

    return (

        <div style={{ padding: 40 }}>

            <h1>Generate Picking</h1>

            <p>
                Click the button below to generate all pick tasks.
            </p>

            <button
                onClick={generatePicking}
                style={{
                    padding: 15,
                    background: "#1976d2",
                    color: "white",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 18,
                    cursor: "pointer"
                }}
            >
                {loading ? "Generating..." : "Generate Picking"}
            </button>

            <br /><br />

            <h3>{message}</h3>

        </div>

    );

}

export default GeneratePicking;