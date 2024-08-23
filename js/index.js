let map;
let markers = [];
let tempMarkers = [];
let currentInfoWindow = null;
let dragTimeout = null;
let draggedMarker = null;
let originalPosition = null;

function initMap() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            const userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            console.log("User location:", userLocation); // Log user's location
    
            // Initialize the map centered on the user's location
            map = new google.maps.Map(document.getElementById("map"), {
                zoom: 20,
                center: userLocation,
                mapTypeId: "terrain",
            });
    
            // Add a marker at the user's location
            new google.maps.Marker({
                position: userLocation,
                map: map,
                title: "You are here"
            });
    
        }, function(error) {
            console.error("Error fetching GPS location: ", error);
            // Fallback to default location if GPS fails
            const fallbackLocation = { lat: -0.05572, lng: 109.3485 }; // University of Tanjungpura
            console.log("Fallback location:", fallbackLocation);
    
            // Initialize the map centered on the fallback location
            map = new google.maps.Map(document.getElementById("map"), {
                zoom: 20,
                center: fallbackLocation,
                mapTypeId: "terrain",
            });
    
            // Add a marker at the fallback location
            new google.maps.Marker({
                position: fallbackLocation,
                map: map,
                title: "Fallback location"
            });
        });
    } else {
        // Fallback if geolocation is not supported
        const fallbackLocation = { lat: -0.05572, lng: 109.3485 }; // University of Tanjungpura
        console.log("Fallback location:", fallbackLocation);
    
        // Initialize the map centered on the fallback location
        map = new google.maps.Map(document.getElementById("map"), {
            zoom: 20,
            center: fallbackLocation,
            mapTypeId: "terrain",
        });
    
        // Add a marker at the fallback location
        new google.maps.Marker({
            position: fallbackLocation,
            map: map,
            title: "Fallback location"
        });
    }    

    // Fetch marker data from markers.php
    fetch("php/markers.php")
        .then((response) => response.json())
        .then((data) => {
            // Loop through the retrieved marker data
            data.forEach((markerData) => {
                const data = {
                    id: markerData.idpoi,
                    name: markerData.name,
                    lat: parseFloat(markerData.latitude),
                    lng: parseFloat(markerData.longitude),
                    desc: markerData.deskripsi,
                    img: markerData.linkfoto
                };
                showDatabaseMarkers(data);
            });
        })
        .catch((error) => {
            console.error("Error fetching marker data:", error);
        });

    map.addListener("click", (event) => {
        deleteTemporaryMarkers();
        addMarker(event.latLng);
    });

    document
        .getElementById("show-markers")
        .addEventListener("click", showMarkers);
    document
        .getElementById("hide-markers")
        .addEventListener("click", hideMarkers);
    document
        .getElementById("delete-markers")
        .addEventListener("click", deleteMarkers);
}

function showDatabaseMarkers(data) {
    const { id, name, lat, lng, desc, img } = data;

    const marker = new google.maps.Marker({
        position: { lat, lng },
        map: map,
        draggable: false,
        icon: {
            url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
            fillColor: "blue",
            scale: 8,
        },
    });
    marker.id = id;
    marker.name = name;

    // Function to fetch image status
    function fetchImageStatus(img) {
        return fetch(`php/check_image.php?filename=${encodeURIComponent(img)}`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'ok') {
                console.log('Image path:', data.path);
                return data.path;
            } else {
                console.log('No image available for', data.path);
                return null;
            }
        })
        .catch(error => {
            console.error('Error fetching image status:', error);
            return null;
        });
    }

    // Create the info window with the initial content
    const infowindow = new google.maps.InfoWindow();

    // Fetch image status and update the info window content
    fetchImageStatus(img)
    .then(imagePath => {
        let content = '';
        if (imagePath) {
            content += `
                <div>
                    <img src="${imagePath}" alt="${name}" style="max-width:100%; max-height:150px;"><br>
                </div>
            `;
        } else {
            content += `<p>No image available</p>`;
        }
        content += `
            <div>
                <h3>${name} <button class="edit-name-button" data-id="${id}">Edit Nama</button></h3>
                <div>
                    <p>
                    lat: ${lat}, lng: ${lng}
                    <br>
                    Deskripsi Tempat: ${desc}
                    <br><br>
                    <button class="delete-button" data-id="${id}">Delete</button>
                    <button class="edit-button" data-id="${id}">Edit</button>
                    </p>
                </div>
            </div>
        `;
        infowindow.setContent(content);
    })
    .catch(error => {
        console.error('Error:', error);
        infowindow.setContent(`
            <div>
                <h3>${name} <button class="edit-name-button" data-id="${id}">Edit Nama</button></h3>
                <div>
                    <p>
                    lat: ${lat}, lng: ${lng}
                    <br>
                    ${desc}
                    <br><br>
                    <button class="delete-button" data-id="${id}">Delete</button>
                    <button class="edit-button" data-id="${id}">Edit</button>
                    </p>
                </div>
            </div>
            <p>Error fetching image</p>
        `);
    });

    google.maps.event.addListener(infowindow, "domready", () => {
        document.querySelector(".delete-button").addEventListener("click", () => {
            confirmDelete(marker.id);
        });
    
        document.querySelector(".edit-button").addEventListener("click", () => {
            enableEdit(marker);
        });
    
        document.querySelector(".edit-name-button").addEventListener("click", () => {
            editName(marker.id);
        });
    });
    
    marker.addListener("click", () => {
        if (currentInfoWindow) {
            currentInfoWindow.close();
        }
        infowindow.open(map, marker);
        currentInfoWindow = infowindow;
    });

    marker.addListener("dragend", (event) => {
        if (marker.getDraggable()) {
            draggedMarker = marker;
            if (dragTimeout) {
                clearTimeout(dragTimeout);
            }
            dragTimeout = setTimeout(() => {
                confirmUpdate(event.latLng, marker);
            }, 1000);
        }
    });

    marker.addListener("drag", (event) => {
        if (marker.getDraggable()) {
            displayLatLng(event.latLng);
        }
    });

    markers.push(marker);
}


function editName(id) {
    const marker = markers.find((m) => m.id === id);
    if (!marker) {
        alert("Marker not found.");
        return;
    }

    const newName = prompt("Enter the new name for the marker:", marker.name);
    if (newName !== null && newName !== "") {
        if (confirm("Are you sure you want to edit this marker name?")) {
            fetch("php/update_marker_name.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    id: marker.id,
                    name: newName,
                }),
            })
            .then((response) => response.json())
            .then((data) => {
                if (data.success) {
                    marker.name = newName;
                    updateInfoWindow(marker); // Update info window content
                    alert("Marker name updated successfully!");
                    location.reload(); // Refresh the webpage
                } else {
                    alert("Error updating marker name: " + data.message);
                }
            })
            .catch((error) => {
                console.error("Error updating marker name:", error);
            });
        }
    } else {
        alert("Marker name update canceled or invalid.");
    }
}


function updateInfoWindow(marker) {
    // Find and update the info window content
    if (currentInfoWindow) {
        currentInfoWindow.setContent(`
            <div>
                <h3>${marker.name} <button class="edit-name-button" data-id="${marker.id}">Edit Nama</button></h3>
                <div>
                    <p>
                    lat: ${marker.getPosition().lat()}, lng: ${marker.getPosition().lng()}
                    <br><br>
                    <button class="delete-button" data-id="${marker.id}">Delete</button>
                    <button class="edit-button" data-id="${marker.id}">Edit</button>
                    </p>
                </div>
            </div>
        `);
    }
}


function updateMarkerLabel(marker, newName) {
    if (marker.setLabel) {
        marker.setLabel(newName);
    } else {
        console.log("Marker label update not implemented.");
    }
}

function enableEdit(marker) {
    if (confirm("Are you sure you want to edit this marker?")) {
        if (dragTimeout) {
            clearTimeout(dragTimeout);
        }
        originalPosition = marker.getPosition();
        marker.setDraggable(true);
        displayLatLng(marker.getPosition());
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

function confirmDelete(id) {
    if (confirm("Are you sure you want to delete this marker?")) {
        deleteMarker(id);
    }
}

function deleteMarker(id) {
    const markerIndex = markers.findIndex((marker) => marker.id === id);
    if (markerIndex !== -1) {
        markers[markerIndex].setMap(null);
        markers.splice(markerIndex, 1);
    }

    fetch("php/delete_marker.php", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
    })
        .then((response) => {
            if (response.ok) {
                console.log("Marker deleted successfully from the database.");
            } else {
                console.error("Failed to delete marker from the database.");
            }
        })
        .catch((error) => {
            console.error("Error deleting marker:", error);
        });
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
    tempMarkers.forEach((marker) => {
        marker.setMap(null);
    });
    tempMarkers = [];
    deletePositionText();
}

function hideMarkers() {
    setMapOnAll(null);
}

function showMarkers() {
    setMapOnAll(map);
}

function deleteMarkers() {
    tempMarkers.forEach((marker) => {
        marker.setMap(null);
    });
    tempMarkers = [];
    deletePositionText();
}

function setMapOnAll(map) {
    markers.forEach((marker) => {
        marker.setMap(map);
    });
}

function deletePositionText() {
    document.getElementById("latitude").value = "";
    document.getElementById("longitude").value = "";
}

function addPositionText(position) {
    const latitude = position.lat();
    const longitude = position.lng();

    document.getElementById("latitude").value = latitude;
    document.getElementById("longitude").value = longitude;
}

function displayLatLng(position) {
    document.getElementById("latitude").value = position.lat();
    document.getElementById("longitude").value = position.lng();
}

function clearLatLngDisplay() {
    document.getElementById("latitude").value = "";
    document.getElementById("longitude").value = "";
}

window.initMap = initMap;