import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import "../styles/login.css";

function Login() {

    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const login = async () => {

        try {

            setLoading(true);

            const res = await api.post("/login", {
                username,
                password
            });

            localStorage.setItem(
                "token",
                res.data.access_token
            );

            localStorage.setItem(
                "user",
                JSON.stringify(res.data.user)
            );

            navigate("/dashboard");

        } catch (err) {

            alert(
                err.response?.data?.detail ||
                "Login Failed"
            );

        }

        setLoading(false);

    };

    return (

        <div className="login-container">

            <div className="login-card">

                <h1>Warehouse RF System</h1>

                <p>Login to continue</p>

                <input
                    placeholder="Username"
                    value={username}
                    onChange={(e)=>setUsername(e.target.value)}
                />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e)=>setPassword(e.target.value)}
                />

                <button
                    onClick={login}
                    disabled={loading}
                >
                    {loading ? "Logging..." : "Login"}
                </button>

            </div>

        </div>

    );

}

export default Login;