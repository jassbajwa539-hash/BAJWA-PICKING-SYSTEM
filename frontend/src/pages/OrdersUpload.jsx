import { useState } from "react";
import api from "../api/api";

function OrdersUpload() {

    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const uploadOrders = async () => {

        if (!file) {
            alert("Please select an Excel file.");
            return;
        }

        const token = localStorage.getItem("token");

        const formData = new FormData();
        formData.append("file", file);

        try {

            setLoading(true);

            const res = await api.post(
                "/orders/upload",
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data"
                    }
                }
            );

            setResult(res.data);

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

        <div style={{ padding: 30 }}>

            <h2>Orders Upload</h2>

            <br />

            <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setFile(e.target.files[0])}
            />

            <br /><br />

            <button onClick={uploadOrders}>

                {loading ? "Uploading..." : "Upload Orders"}

            </button>

            <br /><br />

            {result && (

                <div>

                    <h3>Upload Successful</h3>

                    <pre>{JSON.stringify(result, null, 2)}</pre>

                </div>

            )}

        </div>

    );

}

export default OrdersUpload;