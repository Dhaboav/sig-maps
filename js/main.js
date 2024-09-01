let map;
let markers = [];
let markerWindow;
let markerAddMode = false;
let markersMapStatus = true;

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
			console.log(
				"Geolocation not supported. Using default location:",
				location
			);
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
	markersData.forEach((markerData) =>
		databaseMarkers(markerData, AdvancedMarkerElement)
	);

	// Add event listeners for the buttons
    document
		.getElementById("show-markers")
		.addEventListener("click", function () {
			showMarkers();
		});
	document
		.getElementById("hide-markers")
		.addEventListener("click", function () {
			hideMarkers();
		});
    document
		.getElementById("add-marker")
		.addEventListener("click", function () {
			addMarker();
		});
    document
		.getElementById("reset-marker")
		.addEventListener("click", function () {
			resetButton();
		});
	
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
		const response = await fetch(
			`php/check_image.php?filename=${encodeURIComponent(imagePath)}`
		);

		if (!response.ok)
			throw new Error(`HTTP error! Status: ${response.status}`);

		const data = await response.json();

		if (data.status === "ok") {
			console.log("Returning image path:", data.path);
			return data.path;
		} else {
			console.log("No image available. Returning fallback path.");
			return "img/testo.png";
		}
	} catch (error) {
		console.error("Error fetching image status:", error.message);
		return "img/testo.png";
	}
}

// Create markers from the fetched data
function databaseMarkers(markerData) {
	// Create a new marker
	const marker = new google.maps.marker.AdvancedMarkerElement({
		map,
		position: {
			lat: parseFloat(markerData.latitude),
			lng: parseFloat(markerData.longitude),
		},
		title: markerData.name,
	});

	// Store additional information in the marker object
	markers.push(marker);

	// Add click event listener to open the InfoWindow
	marker.addListener("click", () => openMarkerWindow(marker, markerData));
}
// ================ DATABASE END ===============================================

// ================ MARKER START ===============================================
async function openMarkerWindow(marker, markerData) {
	const imagePath = await fetchImageStatus(markerData.linkfoto).catch(
		() => null
	);
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

// Function to resetting
function resetButton(){
    if (!markersMapStatus) {
        markers.forEach((marker) => (marker.map = map));
        markersMapStatus = true;
    }

    if (markerAddMode) {
        markerAddMode = false;
    }
    document.getElementById("hide-markers").style.backgroundColor = "#007bff";
    document.getElementById("show-markers").style.backgroundColor = "#007bff";
    document.getElementById("add-marker").style.backgroundColor = "#007bff";
    console.log("Done resetting");
}

// Function to show all markers
function showMarkers() {
	if (!markersMapStatus) {
		markers.forEach((marker) => (marker.map = map));
		markersMapStatus = true;

        document.getElementById("show-markers").style.backgroundColor = "red";
        document.getElementById("hide-markers").style.backgroundColor = "#007bff";
		console.log("Markers have been shown");
	} else {
		console.log("Markers already shown");
	}
}

// Function to hide all markers
function hideMarkers() {
	if (markersMapStatus) {
		markers.forEach((marker) => (marker.map = null));
		markersMapStatus = false;

        document.getElementById("hide-markers").style.backgroundColor = "red";
        document.getElementById("show-markers").style.backgroundColor = "#007bff";
		console.log("Markers have been hidden");
	} else {
		console.log("Markers already hidden");
	}
}

// Function to add marker
function addMarker(){
    if (!markerAddMode){
        markerAddMode = true;
        document.getElementById("add-marker").style.backgroundColor = "red";
        console.log('add marker on');
    } else {
        markerAddMode = false;
        document.getElementById("add-marker").style.backgroundColor = "#007bff";
        console.log('add marker off');
    }
}
// ================ MARKER END ===============================================

// Get the user's location and then initialize the map with it
getUserLocation().then(initMap);