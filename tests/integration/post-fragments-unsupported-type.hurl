# tests/integration/post-fragments-unsupported-type.hurl
# Try to POST an unsupported media type
POST http://localhost:8080/v1/fragments
Content-Type: application/unsupported
[BasicAuth]
user1@email.com:password1
`This should fail`

# We expect to get back an HTTP 415
HTTP/1.1 415
[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error" == "Unsupported content type: application/unsupported"
