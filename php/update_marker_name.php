<?php
header('Content-Type: application/json');

// Database credentials
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "gis2024";

// Connect to the database
$conn = new mysqli($servername, $username, $password, $dbname);

// Check the connection
if ($conn->connect_error) {
    die(json_encode(['success' => false, 'message' => 'Database connection failed: ' . $conn->connect_error]));
}

// Get the JSON data from the POST request
$data = json_decode(file_get_contents('php://input'), true);

// Validate the input data
if (!isset($data['id']) || !isset($data['name'])) {
    die(json_encode(['success' => false, 'message' => 'Invalid input']));
}

$id = $conn->real_escape_string($data['id']);
$name = $conn->real_escape_string($data['name']);

// Prepare the SQL query to update the marker's name
$sql = "UPDATE poi SET name = '$name' WHERE idpoi = '$id'";

// Execute the query
if ($conn->query($sql) === TRUE) {
    echo json_encode(['success' => true, 'message' => 'Marker name updated successfully']);
} else {
    echo json_encode(['success' => false, 'message' => 'Error updating marker name: ' . $conn->error]);
}

// Close the database connection
$conn->close();
?>
