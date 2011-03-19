function(doc, req){
  //!json templates.xrd
  uri = req.query.q
  Mustache = require("vendor/mustache");
  var host = req.headers.Host;
  var view = {
    host: host
  };
  var xml = Mustache.to_html(templates.xrd, view);
  provides("xml", function(){
    return xml;
  });
}