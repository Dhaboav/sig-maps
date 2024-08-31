let map;
let markers = [];


// ================ MAP START ===============================================

// Load Google Maps libraries
async function loadGoogleMaps() {
    const { Map } = await google.maps.importLibrary("maps");
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
    return { Map, AdvancedMarkerElement };
}

// Get user location
function getUserLocation() {
    return new Promise((resolve) => {
        // Default location: University of Tanjungpura
        let location = { lat: -0.05572, lng: 109.3485 }; 

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    location = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    };
                    console.log("User location:", location);
                    resolve(location);
                },
                (error) => {
                    console.error("Error fetching GPS location: ", error);
                    console.log("Using default location:", location);
                    resolve(location);
                }
            );
        } else {
            console.log("Geolocation not supported. Using default location:", location);
            resolve(location);
        }
    });
}

// Initialize the map
async function initMap(location) {
    const { Map, AdvancedMarkerElement } = await loadGoogleMaps();
    map = new Map(document.getElementById("map"), {
        center: location,
        zoom: 14,
        mapId: "4504f8b37365c3d0", // Map ID for advanced markers
    });

    new AdvancedMarkerElement({
        map: map,
        position: location,
    });

    // Fetch and display markers from the PHP backend
    const markersData = await fetchMarkers();
    markersData.forEach((markerData) => databaseMarkers(markerData, AdvancedMarkerElement));
}
// ================ MAP END ===============================================

// ================ DATABASE START ===============================================

// Fetch markers from the database
async function fetchMarkers() {
    try {
        const response = await fetch("php/markers.php");
        const data = await response.json();
        console.log(data); // Optional: Log the fetched data
        return data;
    } catch (error) {
        console.error("Error fetching marker data:", error);
        return []; // Return an empty array in case of an error
    }
}

// Create markers from the fetched data
function databaseMarkers(markerData) {
    // Create a new marker
    const marker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: { lat: parseFloat(markerData.latitude), lng: parseFloat(markerData.longitude) },
        title: markerData.name,
    });

    // Store additional information in the marker object
    marker.uniqueID = markerData.idpoi;
    marker.name = markerData.name;
    marker.description = markerData.deskripsi;
    marker.imgPath = markerData.linkfoto;
    markers.push(marker);
}
// ================ DATABASE END ===============================================

// Get the user's location and then initialize the map with it
getUserLocation().then(initMap);