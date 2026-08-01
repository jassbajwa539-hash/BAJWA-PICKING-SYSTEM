import { useEffect, useState } from "react";
import api from "../api/api";

function InventoryList() {

    const [inventory, setInventory] = useState([]);
    const [search, setSearch] = useState("");

    useEffect(() => {
        loadInventory();
    }, []);

    const loadInventory = async () => {

        try {

            const token = localStorage.getItem("token");

            const res = await api.get(
                "/inventory",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setInventory(res.data);

        } catch (err) {

            alert(err.response?.data?.detail || err.message);

        }

    };

    const filtered = inventory.filter(item =>

        item.sku?.toLowerCase().includes(search.toLowerCase()) ||

        item.serial_no?.toLowerCase().includes(search.toLowerCase()) ||

        item.location?.toLowerCase().includes(search.toLowerCase()) ||

        item.box?.toLowerCase().includes(search.toLowerCase())

    );

    return (

        <div style={{ padding: 30 }}>

            <h1>Inventory</h1>

            <input
                placeholder="Search SKU / Serial / Location / Box"
                value={search}
                onChange={(e)=>setSearch(e.target.value)}
                style={{
                    width:"100%",
                    padding:12,
                    marginBottom:20
                }}
            />

            <table
                width="100%"
                border="1"
                cellPadding="8"
                style={{
                    borderCollapse:"collapse"
                }}
            >

                <thead
                    style={{
                        background:"#1976d2",
                        color:"white"
                    }}
                >

                    <tr>

                        <th>SKU</th>
                        <th>Serial</th>
                        <th>Location</th>
                        <th>Box</th>
                        <th>Status</th>

                    </tr>

                </thead>

                <tbody>

                    {filtered.map(item=>(

                        <tr key={item.id}>

                            <td>{item.sku}</td>
                            <td>{item.serial_no}</td>
                            <td>{item.location}</td>
                            <td>{item.box}</td>

                            <td>

                                <span
                                    style={{
                                        background:
                                            item.status==="AVAILABLE"
                                            ? "#4CAF50"
                                            : item.status==="RESERVED"
                                            ? "#FF9800"
                                            : "#2196F3",

                                        color:"white",
                                        padding:"5px 10px",
                                        borderRadius:20
                                    }}
                                >

                                    {item.status}

                                </span>

                            </td>

                        </tr>

                    ))}

                </tbody>

            </table>

            <br/>

            <h3>

                Total Records : {filtered.length}

            </h3>

        </div>

    );

}

export default InventoryList;