# tests/integration/lab-9-s3.hurl
# Authenticated POST to /v1/fragments
POST http://localhost:8080/v1/fragments
# user1@email.com:password1
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==
Content-Type: text/plain
`Hello S3!`

# 1. We expect to get back an HTTP 201
HTTP/1.1 201
# 2. Capture the Location header value
[Captures]
url: header "Location"

# 3. GET the fragment we just created using the url
GET {{url}}
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==

# 4. Confirm server returns 200, correct type, and body
HTTP/1.1 200
Content-Type: text/plain; charset=utf-8
Content-Length: 9
[Asserts]
body == "Hello S3!"

# 5. DELETE the fragment using the url
DELETE {{url}}
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==

# 6. Confirm server returns 200
HTTP/1.1 200

# 7. Try to GET the fragment again (should be deleted)
GET {{url}}
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==

# 8. Confirm server returns 404
HTTP/1.1 404
