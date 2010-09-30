function(head, req) {
  var xrd = require("vendor/couchapp/lib/xrd");
  return {
    "headers" : {"Content-Type" : "application/xml"},
    "body" : xrd.generate('example.com').toXMLString()
  }
}