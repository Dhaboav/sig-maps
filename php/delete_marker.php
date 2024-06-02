<?php
// Check if the request method is POST
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Retrieve the marker ID from the request body
    $data = json_decode(file_get_contents("php://input"), true);
    $id = $data["id"];

    // Database connection settings
    $servername = "localhost";
    $username = "root";
    $password = "";
    $dbname = "gis2024";

    // Create connection
    $conn = new mysqli($servername, $username, $password, $dbname);

    // Check connection
    if ($conn->connect_error) {
        http_response_code(500);
        echo json_encode(array("error" => "Connection failed: " . $conn->connect_error));
        exit();
    }

    // Prepare and execute SQL DELETE statement
    $sql = "DELETE FROM poitugas WHERE idpoi = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $id);

    if ($stmt->execute()) {
        // Return success response
        http_response_code(200);
        echo json_encode(array("message" => "Marker deleted successfully."));
    } else {
        // Return error response
        http_response_code(500);
        echo json_encode(array("error" => "Failed to delete marker from the database."));
    }

    // Close statement and connection
    $stmt->close();
    $conn->close();
} else {
    // Return error response for unsupported request method
    http_response_code(405);
    echo json_encode(array("error" => "Method Not Allowed"));
}
?>
