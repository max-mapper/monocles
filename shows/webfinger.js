function(head, req) {
  var xrd = require("vendor/couchapp/lib/xrd_gen");
  var host = req.headers.Host;
  var domain = host.split(":")[0];
  return {
    "headers" : {"Content-Type" : "application/xml"},
    "body" : xrd.generate(domain).toXMLString()
  }
}