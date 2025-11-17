# tests/integration/post-fragments-unauthenticated.hurl
# Try to POST without authentication
POST http://localhost:8080/v1/fragments
Content-Type: text/plain
`This should fail without auth`

# We expect to get back an HTTP 401
HTTP/1.1 401
[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.code" == 401
jsonpath "$.error.message" == "Unauthorized"
