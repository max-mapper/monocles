function(doc, req){
  //!json templates.lrdd
  uri = req.query.q
  Mustache = require("vendor/couchapp/lib/mustache");
  var username = uri.split("@")[0];
  var host = req.headers.Host;
  var domain = host.split(":")[0];
  var view = {
    username: username,
    domain: domain
  };
  var xml = Mustache.to_html(templates.lrdd, view);
  provides("xml", function(){
    return xml;
  });
}