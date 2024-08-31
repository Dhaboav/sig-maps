let map;
let markers = [];
let markerWindow;


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

    // Initialize InfoWindow
    markerWindow = new google.maps.InfoWindow();

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

// Checking image path if exist then fetched
async function fetchImageStatus(imagePath) {
    try {
        const response = await fetch(`php/check_image.php?filename=${encodeURIComponent(imagePath)}`);
        
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        
        const data = await response.json();
        
        if (data.status === 'ok') {
            console.log('Returning image path:', data.path);
            return data.path;
        } else {
            console.log('No image available. Returning fallback path.');
            return 'img/testo.png';
        }
    } catch (error) {
        console.error('Error fetching image status:', error.message);
        return 'img/testo.png';
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
    markers.push(marker);

    // Add click event listener to open the InfoWindow
    marker.addListener('click', () => openMarkerWindow(marker, markerData));
}
// ================ DATABASE END ===============================================

// ================ INFO WINDOW START ===============================================
async function openMarkerWindow(marker, markerData) {
    const imagePath = await fetchImageStatus(markerData.linkfoto).catch(() => null);
    const content = `
        <div>
            <h3>${markerData.name}</h3>
            <p>${markerData.deskripsi}</p>
            <img src="${imagePath}" alt="${markerData.name}" style="width:100px; height:auto;">
        </div>
    `;

    markerWindow.setContent(content);
    markerWindow.open(map, marker);
}
// ================ INFO WINDOW END ===============================================

// Get the user's location and then initialize the map with it
getUserLocation().then(initMap);