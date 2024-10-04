<?php
include 'database.php';

// Check if the request method is POST
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Retrieve the marker ID from the request body
    $data = json_decode(file_get_contents("php://input"), true);
    
    // Check if the ID is provided
    if (!isset($data["id"])) {
        http_response_code(400); // Bad Request
        echo json_encode(array("success" => false, "message" => "Marker ID is missing."));
        exit();
    }

    $id = $data["id"];

    // Create database connection
    $conn = getDbConnection();

    // Check connection
    if ($conn->connect_error) {
        http_response_code(500);
        echo json_encode(array("success" => false, "error" => "Connection failed: " . $conn->connect_error));
        exit();
    }

    // Prepare and execute SQL DELETE statement
    $tableName = 'poitugas'; 
    $sql = "DELETE FROM `$tableName` WHERE idpoi = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $id);

    if ($stmt->execute()) {
        // Return success response
        http_response_code(200);
        echo json_encode(array("success" => true, "message" => "Marker deleted successfully."));
        
    } else {
        // Return error response
        http_response_code(500);
        echo json_encode(array("success" => false, "error" => "Failed to delete marker from the database."));

    }

    // Close statement and connection
    $stmt->close();
    $conn->close();
} else {
    // Return error response for unsupported request method
    http_response_code(405); // Method Not Allowed
    echo json_encode(array("success" => false, "message" => "Method Not Allowed"));
}
?>
