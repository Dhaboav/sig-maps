<?php
include 'database.php';

// Create database connection
$conn = getDbConnection();

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Check if all required fields are set
if (!isset($_POST['name-of-location'], $_POST['latitude'], $_POST['longitude'], $_POST['description'])) {
    die("One or more required fields are missing.");
}

// Prepare data for insertion
$name = $_POST['name-of-location'];
$latitude = $_POST['latitude'];
$longitude = $_POST['longitude'];
$desc = $_POST['description'];

// Validate latitude, longitude, and description
if (empty($latitude) || empty($longitude) || empty($desc)) {
    die("There is empty data");
}

// Get the current time
$currentTime = date('Y-m-d H:i:s');

// Prepare SQL query
$tableName = 'utspoi2024'; 
$sql = $conn->prepare("INSERT INTO `$tableName` (name, coordinat_lat, coordinat_long, deskripsi, datecreate, dateupdate) VALUES (?, ?, ?, ?, ?, ?)");
$sql->bind_param('ssssss', $name, $latitude, $longitude, $desc, $currentTime, $currentTime); // Corrected to six parameters

// Execute SQL query
if ($sql->execute()) {
    // Success: Redirect back with success message
    header("Location: ../index.html?status=success");
    exit();
} else {
    // Error: Redirect back with error message
    header("Location: ../index.html?status=error");
    exit();
}

// Close connection
$conn->close();
?>
