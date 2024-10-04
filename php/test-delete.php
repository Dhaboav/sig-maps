<?php
header('Content-Type: application/json');
$response = array();

// Your deletion logic here...
if ($deletionSuccessful) {
    $response['success'] = true;
} else {
    $response['success'] = false;
}

echo json_encode($response);
?>
