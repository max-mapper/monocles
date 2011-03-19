function(doc, req){
  //!json templates.profile
  Mustache = require("vendor/mustache");
  var profile = doc.couch.app.profile;
  var html = Mustache.to_html(templates.profile, profile);
  provides("html", function(){
    return html;
  });
}