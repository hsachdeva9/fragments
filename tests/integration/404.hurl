# 404 Test - Route Not Found

# Make a GET request to a non-existent route
GET http://localhost:8080/no-such-route

# Assert that the server returns HTTP 404
HTTP/1.1 404
