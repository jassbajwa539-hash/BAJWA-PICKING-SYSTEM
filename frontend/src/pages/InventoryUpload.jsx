import { useState } from "react";
import api from "../api/api";

function InventoryUpload() {

    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const uploadInventory = async () => {

        if (!file) {
            alert("Please select a CSV file.");
            return;
        }

        const token = localStorage.getItem("token");

        const formData = new FormData();
        formData.append("file", file);

        try {

            setLoading(true);

            const res = await api.post(
                "/inventory/upload",
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

            <h2>Inventory Upload</h2>

            <br />

            <input
                type="file"
                accept=".csv"
                onChange={(e) => setFile(e.target.files[0])}
            />

            <br /><br />

            <button onClick={uploadInventory}>

                {loading ? "Uploading..." : "Upload Inventory"}

            </button>

            <br /><br />

            {result && (

                <div>

                    <h3>Upload Complete</h3>

                    <p>Imported : {result.Imported}</p>

                    <p>Skipped : {result.Skipped}</p>

                    <p>User : {result.UploadedBy}</p>

                </div>

            )}

        </div>

    );

}

export default InventoryUpload;