import axios from "axios";

const api = axios.create({
    baseURL: "https://warehouse-wms-tgaz.onrender.com",
    headers: {
        "Content-Type": "application/json"
    }
});

export default api;