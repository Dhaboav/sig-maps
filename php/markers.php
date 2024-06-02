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

// Retrieve latitude and longitude from the database
$sql = "SELECT * FROM poitugas";
$result = $conn->query($sql);

// Prepare marker data array
$markers = array();
if ($result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        $markers[] = $row;
    }
}

// Close connection
$conn->close();

// Output marker data as JSON
header('Content-Type: application/json');
echo json_encode($markers);
?>
