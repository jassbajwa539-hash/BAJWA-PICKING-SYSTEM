import axios from "axios";

const api = axios.create({
    baseURL: "https://warehouse-wms-tgaz.onrender.com"
});

export default api;