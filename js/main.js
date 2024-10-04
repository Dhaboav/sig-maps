let map;
let markers = [];
let markerWindow;
let markerListener = null;
let currentMarker = null;
let markerAddMode = false;
let markersMapStatus = false;
let radiusStatus = false;
let circle;
let slider = document.getElementById("myRange");
let output = document.getElementById("outputValue");
let location = { lat: -0.05572, lng: 109.3485 }; // Default location

// ================ MAP START ===============================================

// Load Google Maps libraries
async function loadGoogleMaps() {
	const { Map, Circle, LatLng } = await google.maps.importLibrary("maps");
	const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
	const { spherical } = await google.maps.importLibrary("geometry");
	return { Map, Circle, LatLng, AdvancedMarkerElement, spherical };
}

// Get user location
function getUserLocation() {
	return new Promise((resolve) => {
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
async function initMap(userLocation) {
	const { Map, AdvancedMarkerElement } = await loadGoogleMaps();

	map = new Map(document.getElementById("map"), {
		center: userLocation,
		zoom: 14,
		mapId: "4504f8b37365c3d0", // Map ID for advanced markers
	});

	// Add GPS marker
	new AdvancedMarkerElement({
		map: map,
		position: userLocation,
	});

	markerWindow = new google.maps.InfoWindow();

	// Fetch and add database markers but don't show them yet
	const markersData = await fetchMarkers();
	markersData.forEach((markerData) => databaseMarkers(markerData));

	// Event listeners
	document
		.getElementById("show-markers")
		.addEventListener("click", showMarkers);
	document
		.getElementById("hide-markers")
		.addEventListener("click", hideMarkers);
	document.getElementById("add-marker").addEventListener("click", addMarker);
	document
		.getElementById("reset-marker")
		.addEventListener("click", resetButton);
	document
		.getElementById("radius-button")
		.addEventListener("click", radiusMode);
}
// ================ MAP END ===============================================

// ================ DATABASE START ===============================================

// Fetch markers from the database
async function fetchMarkers() {
	try {
		const response = await fetch("php/markers.php");
		const data = await response.json();
		console.log(data);
		return data;
	} catch (error) {
		console.error("Error fetching marker data:", error);
		return [];
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
		return data.status === "ok" ? data.path : "img/testo.png";
	} catch (error) {
		console.error("Error fetching image status:", error.message);
		return "img/testo.png";
	}
}

function databaseMarkers(markerData) {
    const markerDatabase = document.createElement("img");
    markerDatabase.src =
        "https://maps.google.com/mapfiles/ms/icons/blue-dot.png";

    const marker = new google.maps.marker.AdvancedMarkerElement({
        map: null, // Set map to null initially
        position: {
            lat: parseFloat(markerData.latitude),
            lng: parseFloat(markerData.longitude),
        },
        title: markerData.name,
        content: markerDatabase,
    });

    // Store marker and its data in the markers array
    markers.push({
        marker: marker,
        position: new google.maps.LatLng(
			markerData.id,
			markerData.name,
            markerData.latitude,
            markerData.longitude
        ),
        markerData: markerData // Add this line to store marker data
    });

    // Add click event listener to open the InfoWindow
    marker.addListener("click", () => openMarkerWindow(marker, markerData));
}

// ================ DATABASE END ===============================================

// ================ MARKER START ===============================================
async function openMarkerWindow(marker, markerData) {
	const imagePath = await fetchImageStatus(markerData.linkfoto);
	const content = `
        <div>
            <h3>${markerData.name}</h3>
            <p>${markerData.deskripsi}</p>
            <img src="${imagePath}" alt="${markerData.name}" style="width:100px; height:auto;">
			<br><br>
			<button class="delete-button" data-id="${markerData.idpoi}">Delete</button>
			<button class="edit-button" data-id="${markerData.idpoi}">Edit</button>
        </div>
    `;

	markerWindow.setContent(content);
	markerWindow.open(map, marker);

	// Move event listener registration here
	google.maps.event.addListener(markerWindow, "domready", () => {
        document.querySelector(".delete-button").addEventListener("click", () => {
            const id = markerData.idpoi; // Get the marker ID
            confirmDelete(id); // Pass the marker ID for deletion
        });
    
        document.querySelector(".edit-button").addEventListener("click", () => {
            openEditForm(markerData); // Open the edit form with marker data
        });
    });
}


// Function to resetting
function resetButton() {
	if (markersMapStatus) {
		markers.forEach((markerObj) => markerObj.marker.setMap(null));
		markersMapStatus = false;
	}
	if (markerAddMode) markerAddMode = false;
	if (markerListener) {
		google.maps.event.removeListener(markerListener);
		markerListener = null;
	}
	if (currentMarker) {
		currentMarker.setMap(null);
		currentMarker = null;
	}
	removePosition();

	if (radiusStatus) {
		radiusStatus = false;
		slider.disabled = true;
		slider.value = 0;
		output.innerHTML = 0 + " M";
		if (circle) circle.setMap(null);
		updateMarkersVisibility(); // Update markers visibility
	}
	document.getElementById("hide-markers").style.backgroundColor = "#007bff";
	document.getElementById("show-markers").style.backgroundColor = "#007bff";
	document.getElementById("add-marker").style.backgroundColor = "#007bff";
	document.getElementById("radius-button").style.backgroundColor = "#007bff";
	updateMarkersVisibility(); // Update markers visibility
	console.log("Done resetting");
}

// Function to show all markers
function showMarkers() {
	if (!markersMapStatus) {
		markers.forEach((markerObj) => markerObj.marker.setMap(map));
		markersMapStatus = true;
		document.getElementById("show-markers").style.backgroundColor = "red";
		document.getElementById("hide-markers").style.backgroundColor =
			"#007bff";
		console.log("Markers have been shown");
	} else {
		console.log("Markers already shown");
	}
}

// Function to hide all markers
function hideMarkers() {
	if (markersMapStatus) {
		markers.forEach((markerObj) => markerObj.marker.setMap(null));
		markersMapStatus = false;
		document.getElementById("hide-markers").style.backgroundColor = "red";
		document.getElementById("show-markers").style.backgroundColor =
			"#007bff";
		console.log("Markers have been hidden");
	} else {
		console.log("Markers already hidden");
	}
}

// Function to add marker
async function addMarker() {
	const { AdvancedMarkerElement } = await loadGoogleMaps();
	const tempMark = document.createElement("img");
	tempMark.src =
		"https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png";

	if (!markerAddMode) {
		markerAddMode = true;
		document.getElementById("add-marker").style.backgroundColor = "red";

		if (markerListener) google.maps.event.removeListener(markerListener);

		markerListener = map.addListener("click", function (event) {
			if (currentMarker) {
				currentMarker.setMap(null);
				currentMarker = null;
			}
			currentMarker = new AdvancedMarkerElement({
				map: map,
				position: event.latLng,
				title: "Temp Marker",
				content: tempMark,
			});
			addPosition(event.latLng);
			console.log("Marker added at position:", event.latLng);
		});
	} else {
		markerAddMode = false;
		document.getElementById("add-marker").style.backgroundColor = "#007bff";

		if (markerListener) {
			google.maps.event.removeListener(markerListener);
			markerListener = null;
		}
		if (currentMarker) {
			currentMarker.setMap(null);
			currentMarker = null;
		}
		removePosition();
	}
}

// Adding position to HTML
function addPosition(position) {
	document.getElementById("latitude").value = position.lat();
	document.getElementById("longitude").value = position.lng();
}

// Delete position from HTML
function removePosition() {
	document.getElementById("latitude").value = "";
	document.getElementById("longitude").value = "";
}

async function radiusMode() {
	if (!radiusStatus) {
		radiusStatus = true;
		document.getElementById("radius-button").style.backgroundColor = "red";
		slider.disabled = false;

		function updateSliderOutput() {
			output.innerHTML = slider.value * 100 + " M";
		}

		updateSliderOutput();

		slider.oninput = function () {
			updateSliderOutput();
			// Update circle radius on slider input
			const centerLocation = new google.maps.LatLng(
				location.lat,
				location.lng
			);
			updateCircle(centerLocation, parseFloat(slider.value) * 100); // Convert to meters
		};

		// Use google.maps.LatLng directly
		const centerLocation = new google.maps.LatLng(
			location.lat,
			location.lng
		);
		updateCircle(centerLocation, parseFloat(slider.value) * 100); // Convert to meters
	} else {
		radiusStatus = false;
		slider.disabled = true;
		slider.value = 0;
		output.innerHTML = 0 + " M";
		document.getElementById("radius-button").style.backgroundColor =
			"#007bff";
		if (circle) circle.setMap(null);
		updateMarkersVisibility(); // Update markers visibility
	}
}

async function updateCircle(center, radius) {
	const { spherical } = await loadGoogleMaps();

	if (circle) circle.setMap(null);

	circle = new google.maps.Circle({
		strokeColor: "#008000",
		strokeOpacity: 0.8,
		strokeWeight: 2,
		fillColor: "#008000",
		fillOpacity: 0.25,
		map: map,
		center: center,
		radius: radius,
	});

	updateMarkersVisibility(); // Update markers visibility based on new circle
}

async function updateMarkersVisibility() {
	const { spherical } = await loadGoogleMaps();

	if (circle) {
		const center = circle.getCenter();
		const radius = circle.getRadius();

		markers.forEach((markerObj) => {
			const marker = markerObj.marker;
			const position = markerObj.position;

			const distance = spherical.computeDistanceBetween(position, center);
			marker.setMap(distance <= radius ? map : null);
		});
	} else {
		markers.forEach((markerObj) =>
			markerObj.marker.setMap(markersMapStatus ? map : null)
		);
	}
}

async function confirmDelete(id) {
    const response = await fetch('php/delete.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: id }),
    });

    if (response.ok) {
        const result = await response.json();
        console.log(`Response status: ${response.status}`);
        console.log(`Raw response: ${JSON.stringify(result)}`);

        // Check the 'success' property in the response
        if (result.success) {
            console.log(result.message); // Successful deletion message
        } else {
            console.log('Failed to delete marker from the database.'); // Log the failure
        }
    } else {
        console.log('Failed to delete marker from the server.'); // Handle HTTP errors
    }
}


function deleteMarker(markerId) {
    fetch('php/delete.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: markerId }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log(data);
        if (data.success) {
            console.log(`Successfully deleted marker with ID: ${markerId}`);
        } else {
            console.error("Failed to delete marker:", data.message);
        }
    })
    .catch(error => {
        console.error("Error deleting marker:", error);
    });
}



function confirmUpdate(position, marker) {
    if (confirm("Do you want to update the marker position?")) {
        updateMarkerPosition(marker, position);
    } else {
        marker.setPosition(originalPosition);
        marker.setDraggable(false);
        clearLatLngDisplay();
    }
}

function updateMarkerPosition(marker, position) {
    marker.setPosition(position);
    marker.setDraggable(false);
    clearLatLngDisplay();

    fetch("php/update_marker.php", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            id: marker.id,
            name: marker.name,
            lat: position.lat(),
            lng: position.lng(),
        }),
    })
        .then((response) => {
            if (response.ok) {
                location.reload();
                console.log("Marker updated successfully in the database.");
            } else {
                console.error("Failed to update marker in the database.");
            }
        })
        .catch((error) => {
            console.error("Error updating marker:", error);
        });
}

function enableEdit(markerData) {
    if (confirm("Are you sure you want to edit this marker?")) {
        // Populate the form with marker data
        document.getElementById("name-of-location").value = markerData.name;
        document.getElementById("latitude").value = markerData.latitude;
        document.getElementById("longitude").value = markerData.longitude;
        document.getElementById("description").value = markerData.deskripsi;

        // Show the form (if it's hidden)
        document.getElementById("form-input").style.display = "block";

        // Listen for form submission
        document.getElementById("submit-button").onclick = function(event) {
            event.preventDefault(); // Prevent default form submission

            // Create a FormData object to send data along with the image file
            const formData = new FormData(document.getElementById("form-input"));
            formData.append("id", markerData.id); // Add the marker's ID

            // Send the form data via fetch
            fetch("php/save.php", {
                method: "POST",
                body: formData,
            })
            .then((response) => {
                if (response.ok) {
                    console.log("Marker updated successfully.");
                    location.reload(); // Reload the page to reflect changes
                } else {
                    console.error("Failed to update marker.");
                }
            })
            .catch((error) => {
                console.error("Error updating marker:", error);
            });
        };
    }
}


// Get the user's location and then initialize the map with it
getUserLocation().then(initMap);
