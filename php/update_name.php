<?php
header('Content-Type: application/json');
include 'database.php';

// Create database connection
$conn = getDbConnection();

// Get the JSON data from the POST request
$data = json_decode(file_get_contents('php://input'), true);

// Validate the input data
if (!isset($data['id']) || !isset($data['name'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid input']);
    exit();
}

$id = $data['id'];
$name = $data['name'];

// Prepare the SQL query to update the marker's name
$sql = "UPDATE poitugas SET name = ? WHERE idpoi = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param('si', $name, $id);

// Execute the query
if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Marker name updated successfully']);
} else {
    echo json_encode(['success' => false, 'message' => 'Error updating marker name: ' . $stmt->error]);
}

// Close the statement and connection
$stmt->close();
$conn->close();
?>
