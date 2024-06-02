let map;
let markers = [];
let tempMarkers = [];
let currentInfoWindow = null;
let dragTimeout = null;
let draggedMarker = null;
let originalPosition = null;

function initMap() {
    const universityOfTanjungpura = { lat: -0.05572, lng: 109.3485 };
    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 20,
        center: universityOfTanjungpura,
        mapTypeId: "terrain",
    });

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
    const { id, name, lat, lng } = data;

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

    const infowindow = new google.maps.InfoWindow({
        content: `
            <div>
                <h3>${name} <button class="edit-name-button" data-id="${id}">Edit Nama</button></h3>
                <div>
                    <p>
                    lat: ${lat}, lng: ${lng}
                    <br><br>
                    <button class="delete-button" data-id="${id}">Delete</button>
                    <button class="edit-button" data-id="${id}">Edit</button>
                    </p>
                </div>
            </div>
        `,
    });

    google.maps.event.addListener(infowindow, "domready", function () {
        document
            .querySelector(".delete-button")
            .addEventListener("click", function () {
                confirmDelete(id);
            });

        document
            .querySelector(".edit-button")
            .addEventListener("click", function () {
                enableEdit(marker);
            });

        document
            .querySelector(".edit-name-button")
            .addEventListener("click", function () {
                editName(id);
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
    if (confirm("Are you sure you want to edit this marker name?")) {
        const marker = markers.find((m) => m.id === id);
        if (marker) {
            const newName = prompt("Enter the new name for the marker:", marker.name);
            if (newName !== null && newName !== "") {
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
                        marker.setTitle(newName);
                        updateInfoWindow(marker);
                        alert("Marker name updated successfully!");
                    } else {
                        alert("Error updating marker name: " + data.message);
                    }
                })
                .catch((error) => {
                    console.error("Error updating marker name:", error);
                });
            } else {
                alert("Marker name update canceled or invalid.");
            }
        } else {
            alert("Marker not found.");
        }
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