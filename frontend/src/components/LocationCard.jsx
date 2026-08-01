function LocationCard({ location }) {

    if (!location) return null;

    return (

        <div
            style={{
                background: "#1976d2",
                color: "white",
                borderRadius: 10,
                padding: 20,
                marginBottom: 20,
                boxShadow: "0 2px 10px rgba(0,0,0,.15)"
            }}
        >

            <h3
                style={{
                    margin: 0,
                    opacity: .9
                }}
            >
                CURRENT LOCATION
            </h3>

            <h1
                style={{
                    marginTop: 10,
                    marginBottom: 20,
                    fontSize: 38
                }}
            >
                {location.location}
            </h1>

            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    textAlign: "center"
                }}
            >

                <div>

                    <h2>{location.total_boxes}</h2>

                    <small>Boxes</small>

                </div>

                <div>

                    <h2>{location.total_skus}</h2>

                    <small>SKUs</small>

                </div>

                <div>

                    <h2>{location.total_serials}</h2>

                    <small>Serials</small>

                </div>

            </div>

        </div>

    );

}

export default LocationCard;