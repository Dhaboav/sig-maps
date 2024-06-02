<?php
header('Content-Type: application/json');

// Database connection
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "gis2024";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die(json_encode(["success" => false, "message" => "Connection failed: " . $conn->connect_error]));
}

// Get the POST data
$data = json_decode(file_get_contents('php://input'), true);

$id = $conn->real_escape_string($data['id']);
$name = $conn->real_escape_string($data['name']);
$latitude = $conn->real_escape_string($data['lat']);
$longitude = $conn->real_escape_string($data['lng']);

// Prepare the SQL statement
$sql = "UPDATE poitugas SET name='$name', latitude='$latitude', longitude='$longitude' WHERE idpoi='$id'";

if ($conn->query($sql) === TRUE) {
    echo json_encode(["success" => true, "message" => "Marker updated successfully"]);
} else {
    echo json_encode(["success" => false, "message" => "Error updating marker: " . $conn->error]);
}

$conn->close();
?>