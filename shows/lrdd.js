function(doc, req){
  //!json templates.lrdd
  uri = req.query.q
  Mustache = require("vendor/mustache");
  var username = uri.split("@")[0].replace("acct:","");
  var host = req.headers.Host;
  var view = {
    username: username,
    host: host
  };
  var xml = Mustache.to_html(templates.lrdd, view);
  provides("xml", function(){
    return xml;
  });
}