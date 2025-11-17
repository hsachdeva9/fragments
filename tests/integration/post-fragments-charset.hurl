# tests/integration/post-fragments-charset.hurl
# POST a fragment with a charset in Content-Type
POST http://localhost:8080/v1/fragments
Content-Type: text/plain; charset=utf-8
[BasicAuth]
user1@email.com:password1
`This is a fragment with charset!`

HTTP/1.1 201
[Asserts]
header "Location" matches "^http:\/\/localhost:8080\/v1\/fragments\/[A-Za-z0-9_-]+$"
jsonpath "$.status" == "ok"
# Server stores type without charset
jsonpath "$.fragment.type" == "text/plain"
jsonpath "$.fragment.size" == 32
[Captures]
url: header "Location"

# GET the fragment back and verify the Content-Type includes charset
GET {{url}}
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
Content-Type: text/plain; charset=utf-8
Content-Length: 32
[Asserts]
body == "This is a fragment with charset!"
