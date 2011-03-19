function(head, req){
  //!json templates.profile
  provides("html", function(){

    Mustache = require("vendor/mustache");
    var rows = [];
    while(row = getRow()){
    if (row.value.profile && row.value.profile.name === req.query.name && row.value.message.length > 0){
      rows.push(row);
    }
    }
    var profile = rows[0].value.profile;
    var html = Mustache.to_html(templates.profile, profile);
    return html;
  });
}