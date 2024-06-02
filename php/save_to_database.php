<?php
// Database connection parameters
$servername = "localhost";
$username = "root";
$password = ""; // You may need to set a password if it's configured for your MySQL server
$database = "gis2024"; // Change this to your database name

// Create connection
$conn = new mysqli($servername, $username, $password, $database);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Check if all required fields are set
if (!isset($_POST['name-of-location'], $_POST['latitude'], $_POST['longitude'], $_POST['description'], $_POST['photo'])) {
    die("One or more required fields are missing.");
}

// Prepare data for insertion
$name = $_POST['name-of-location'];
$latitude = $_POST['latitude'];
$longitude = $_POST['longitude'];
$desc = $_POST['description'];
$img = $_POST['photo'];


// Validate latitude and longitude
if ($latitude === '' || $longitude === '' || $desc === ''|| $img === '') {
    die("There is empty data");
}

// Prepare SQL query
$sql = "INSERT INTO poitugas (name, latitude, longitude, deskripsi, linkfoto) VALUES ('$name', '$latitude', '$longitude', '$desc', '$img')";

// Execute SQL query
if ($conn->query($sql) === TRUE) {
    // Success: Redirect back with success message
    header("Location: ../index.html");
    exit();
} else {
    // Error: Redirect back with error message
    header("Location: ../index.html");
    exit();
}

// Close connection
$conn->close();
?>
