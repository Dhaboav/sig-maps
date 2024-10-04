<?php
include 'database.php';

// Create database connection
$conn = getDbConnection();

// Check connection
if ($conn->connect_error) {
    die(json_encode(["success" => false, "message" => "Connection failed: " . $conn->connect_error]));
}

// Retrieve data from the database
$tableName = 'utspoi2024'; 
$sql = "SELECT * FROM `$tableName`";

$result = $conn->query($sql);

// Prepare marker data array
$markers = array();
if ($result === FALSE) {
    die(json_encode(["success" => false, "message" => "Error executing query: " . $conn->error]));
}

if ($result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        $markers[] = $row;
    }
} else {
    echo 'No results found.<br>';
}

// Close connection
$conn->close();

// Output marker data as JSON
header('Content-Type: application/json');
echo json_encode($markers);
?>
