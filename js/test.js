let map;
let userCircle;
let userMarker;
let markers = [];
let tempMarkers = [];
let dragTimeout = null;
let draggedMarker = null;
let addMarkerMode = false;
let originalPosition = null;
let currentInfoWindow = null;

function initMap() {
    const fallbackLocation = { lat: -0.05572, lng: 109.3485 }; // Default location

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            initializeMap({ lat: position.coords.latitude, lng: position.coords.longitude });
        }, () => {
            console.error("Error fetching GPS location.");
            initializeMap(fallbackLocation);
        });
    } else {
        console.warn("Geolocation not supported, using fallback location.");
        initializeMap(fallbackLocation);
    }

    setupEventListeners();
    fetchMarkers();
}

function initializeMap(location) {
    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 15,
        center: location,
        mapTypeId: "terrain",
    });

    userMarker = new google.maps.Marker({
        position: location,
        map: map,
        title: "You are here"
    });

    updateCircle(location);
}

function setupEventListeners() {
    document.getElementById("update-radius").addEventListener("click", updateRadius);
    document.getElementById("add-marker").addEventListener("click", toggleAddMarkerMode);
    document.getElementById("show-markers").addEventListener("click", showMarkers);
    document.getElementById("hide-markers").addEventListener("click", hideMarkers);
}

function fetchMarkers() {
    fetch("php/markers.php")
        .then(response => response.json())
        .then(data => data.forEach(markerData => showDatabaseMarkers(markerData)))
        .catch(error => console.error("Error fetching marker data:", error));
}

function showDatabaseMarkers({ idpoi, name, latitude, longitude, deskripsi, linkfoto }) {
    const marker = new google.maps.Marker({
        position: { lat: parseFloat(latitude), lng: parseFloat(longitude) },
        map: null,
        draggable: false,
        icon: {
            url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
            fillColor: "blue",
            scale: 8,
        },
    });

    marker.id = idpoi;
    marker.name = name;

    const infowindow = new google.maps.InfoWindow();
    fetchImageStatus(linkfoto)
        .then(imagePath => {
            const content = createInfoWindowContent({ idpoi, name, latitude, longitude, deskripsi, imagePath });
            infowindow.setContent(content);
            google.maps.event.addListener(marker, 'click', () => {
                if (currentInfoWindow) {
                    currentInfoWindow.close();
                }
                infowindow.open(map, marker);
                currentInfoWindow = infowindow;
            });
            google.maps.event.addListener(infowindow, 'domready', () => {
                attachButtonListeners(marker);
            });
        })
        .catch(error => {
            console.error('Error:', error);
            const content = createInfoWindowContent({ idpoi, name, latitude, longitude, deskripsi, imagePath: null });
            infowindow.setContent(content);
            google.maps.event.addListener(marker, 'click', () => {
                if (currentInfoWindow) {
                    currentInfoWindow.close();
                }
                infowindow.open(map, marker);
                currentInfoWindow = infowindow;
            });
            google.maps.event.addListener(infowindow, 'domready', () => {
                attachButtonListeners(marker);
            });
        });

    markers.push(marker);
}

function updateInfoWindow(marker) {
    if (currentInfoWindow) {
        currentInfoWindow.setContent(`
            <div>
                <h3>${marker.name} <button class="edit-name-button" data-id="${marker.id}">Edit Name</button></h3>
                <div>
                    <p>
                    Lat: ${marker.getPosition().lat()}, Lng: ${marker.getPosition().lng()}
                    <br><br>
                    <button class="delete-button" data-id="${marker.id}">Delete</button>
                    <button class="edit-button" data-id="${marker.id}">Edit</button>
                    </p>
                </div>
            </div>
        `);
        google.maps.event.addListener(currentInfoWindow, 'domready', () => {
            attachButtonListeners(marker);
        });
    }
}

function createInfoWindowContent({ idpoi, name, latitude, longitude, deskripsi, imagePath }) {
    return `
        <div>
            ${imagePath ? `<img src="${imagePath}" alt="${name}" style="max-width:100%; max-height:150px;"><br>` : '<p>No image available</p>'}
            <h3>${name} <button class="edit-name-button" data-id="${idpoi}">Edit Name</button></h3>
            <p>Lat: ${latitude}, Lng: ${longitude}<br>Deskripsi: ${deskripsi}</p>
            <button class="delete-button" data-id="${idpoi}">Delete</button>
            <button class="edit-button" data-id="${idpoi}">Edit</button>
        </div>
    `;
}

function attachButtonListeners(marker) {
    document.querySelectorAll(".delete-button").forEach(button => {
        button.addEventListener("click", () => {
            confirmDelete(marker.id);
        });
    });

    document.querySelectorAll(".edit-button").forEach(button => {
        button.addEventListener("click", () => {
            enableEdit(marker);
        });
    });

    document.querySelectorAll(".edit-name-button").forEach(button => {
        button.addEventListener("click", () => {
            editName(marker.id);
        });
    });
}

function fetchImageStatus(img) {
    return fetch(`php/check_image.php?filename=${encodeURIComponent(img)}`)
        .then(response => response.json())
        .then(data => data.status === 'ok' ? data.path : null)
        .catch(error => {
            console.error('Error fetching image status:', error);
            return null;
        });
}

function updateRadius() {
    const radius = parseFloat(document.getElementById("radius").value) || 10; // Default to 10 meters
    updateCircle(userMarker.getPosition(), radius);
}

function toggleAddMarkerMode() {
    addMarkerMode = !addMarkerMode;
    if (addMarkerMode) {
        map.addListener("click", onMapClick);
        console.log("Add marker mode enabled");
    } else {
        google.maps.event.clearListeners(map, 'click');
        console.log("Add marker mode disabled");
    }
}

function updateCircle(center, radius = 0) {
    if (userCircle) userCircle.setMap(null);

    userCircle = new google.maps.Circle({
        strokeColor: "#008000",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#008000",
        fillOpacity: 0.25,
        map: map,
        center: center,
        radius: radius
    });

    markers.forEach(marker => {
        const distance = google.maps.geometry.spherical.computeDistanceBetween(marker.getPosition(), center);
        marker.setMap(distance <= radius ? map : null);
    });
}

function onMapClick(event) {
    deleteTemporaryMarkers();
    addMarker(event.latLng);
}

function addMarker(position) {
    deleteTemporaryMarkers();
    const marker = new google.maps.Marker({
        position,
        map: map,
    });

    if (tempMarkers.length > 0) {
        tempMarkers[0].setMap(null);
        tempMarkers = [];
    }

    tempMarkers.push(marker);
    addPositionText(position);
}

function deleteTemporaryMarkers() {
    tempMarkers.forEach(marker => marker.setMap(null));
    tempMarkers = [];
    deletePositionText();
}

function showMarkers() {
    setMapOnAll(map);
}

function hideMarkers() {
    setMapOnAll(null);
}

function deleteMarkers() {
    tempMarkers.forEach(marker => marker.setMap(null));
    tempMarkers = [];
    deletePositionText();
}

function setMapOnAll(map) {
    markers.forEach(marker => marker.setMap(map));
}

function deletePositionText() {
    document.getElementById("latitude").value = "";
    document.getElementById("longitude").value = "";
}

function addPositionText(position) {
    document.getElementById("latitude").value = position.lat();
    document.getElementById("longitude").value = position.lng();
}

function displayLatLng(position) {
    document.getElementById("latitude").value = position.lat();
    document.getElementById("longitude").value = position.lng();
}

function clearLatLngDisplay() {
    document.getElementById("latitude").value = "";
    document.getElementById("longitude").value = "";
}

function enableEdit(marker) {
    if (confirm("Are you sure you want to edit this marker?")) {
        if (dragTimeout) {
            clearTimeout(dragTimeout);
        }
        originalPosition = marker.getPosition();
        marker.setDraggable(true);
        displayLatLng(marker.getPosition());

        google.maps.event.addListener(marker, 'dragend', (event) => {
            if (draggedMarker === marker) {
                const position = event.latLng;
                dragTimeout = setTimeout(() => {
                    confirmUpdate(position, marker);
                }, 500); // Delay to confirm the drag
            }
        });

        draggedMarker = marker;
    }
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
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log("Marker updated successfully in the database.");
        } else {
            console.error("Failed to update marker in the database.");
        }
    })
    .catch(error => {
        console.error("Error updating marker:", error);
    });
}

function confirmDelete(id) {
    if (confirm("Are you sure you want to delete this marker?")) {
        deleteMarker(id);
    }
}

function deleteMarker(id) {
    const markerIndex = markers.findIndex(marker => marker.id === id);
    if (markerIndex !== -1) {
        markers[markerIndex].setMap(null);
        markers.splice(markerIndex, 1);
    }

    fetch("php/delete.php", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log("Marker deleted successfully from the database.");
        } else {
            console.error("Failed to delete marker from the database.");
        }
    })
    .catch(error => {
        console.error("Error deleting marker:", error);
    });
}

function editName(id) {
    const marker = markers.find((m) => m.id === id);
    if (!marker) {
        alert("Marker not found.");
        return;
    }

    const newName = prompt("Enter the new name for the marker:", marker.name);
    if (newName !== null && newName.trim() !== "") {
        if (confirm("Are you sure you want to edit this marker name?")) {
            fetch("php/update_name.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    id: marker.id,
                    name: newName,
                }),
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    marker.name = newName;
                    updateInfoWindow(marker);
                    alert("Marker name updated successfully!");
                } else {
                    alert("Error updating marker name: " + data.message);
                }
            })
            .catch(error => {
                console.error("Error updating marker name:", error);
                alert("Error updating marker name. Please try again.");
            });
        }
    } else {
        alert("Marker name update canceled or invalid.");
    }
}

window.initMap = initMap;