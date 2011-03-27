function(head, req){
  provides("atom",function() {
    var rows = [];
    // !json templates.feed
    Mustache = require("vendor/mustache");
    Rfc3339 = require("vendor/rfc3339");
    while(row = getRow()){
      if (row.value.profile && row.value.profile.name === req.query.name){
        rows.push(row);
      }
    }
    var host = req.headers.Host;
    var view = {
      username: req.query.name,
      hubURL: "http://psychicwarlock.com/publish",
      domain: host,
      updated_at: Rfc3339.convert(new Date()),
      gravatar: rows[0].value.profile.gravatar_url,
      entries: rows.map(function(r){
        var rand = Math.random();
        var url = "http://"+host+"/db/"+r.value._id
        return {
          entry_title: r.value.message,
          entry_url: url,
          entry_published: Rfc3339.convert(new Date(r.value.created_at)),
          entry_updated: Rfc3339.convert(new Date(r.value.created_at)),
          entry_content: r.value.message,
          attachments: Object.keys(r.value._attachments || {}).map(function(a){
            var val=r.value._attachments[a];
            return {
            	name: a,
            	type: val.content_type,
            	length: val.length,
            	url: url+"/"+a
            };
          })
        };
      })
    };
    var xml = Mustache.to_html(templates.feed, view);
    return xml;
  });
}