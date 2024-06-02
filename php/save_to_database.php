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
if (!isset($_POST['name-of-location'], $_POST['latitude'], $_POST['longitude'])) {
    die("One or more required fields are missing.");
}

// Prepare data for insertion
$name = $_POST['name-of-location'];
$latitude = $_POST['latitude'];
$longitude = $_POST['longitude'];

// Validate latitude and longitude
if ($latitude === '' || $longitude === '') {
    die("Latitude and longitude cannot be empty.");
}

// Prepare SQL query
$sql = "INSERT INTO poi (name, latitude, longitude) VALUES ('$name', '$latitude', '$longitude')";

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
