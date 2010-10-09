function(head, req){
  provides("atom",function(){
    var rows = [];
    // !json templates.feed
    Mustache = require("vendor/couchapp/lib/mustache");
    while(row = getRow()){
      if (row.value.profile && row.value.profile.name === req.query.name && row.value.message.length > 0){
        rows.push(row);
      }
    }
    var host = req.headers.Host;
    var domain = host.split(":")[0];
    var view = {
      username: req.query.name,
      domain: domain,
      updated_at: new Date(),
      gravatar: rows[0].value.profile.gravatar_url,
      entries: rows.map(function(r){
        return {
          entry_title: r.value.message,
          entry_url: "http://"+req.headers.Host+"/spora/"+r.value.id,
          entry_published: r.value.created_at,
          entry_updated: r.value.created_at,
          entry_content: r.value.message
        };
      })
    };
    var xml = Mustache.to_html(templates.feed, view);
    return xml;
  });
}