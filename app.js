var couchapp = require('couchapp')
  , path = require('path')
  ;

ddoc =
  { _id:'_design/monocles'
  , rewrites :
    [ {from:"/", to:"pages/monocles.html"}
    , {from:"/", to:"_show/cors", method: "OPTIONS"},
    , {from:"/push",to:"_show/challenge",method: "GET"},
    , {from:"/push", to:"_update/pubsub", method:"POST" },
    , {from:"/.well-known/host-meta", to:"_show/webfinger" },
    , {from:"/webfinger", to:"_show/lrdd" },
    , {from:"/users/:user", to:"_list/profile/stream", query:{name: ":user" } },
    , {from:"/feeds/:user", to:"_list/feed/stream", query: {name : ":user" } },
    , {from:"/salmon/:user", to:"_update/salmon" },
    , {from:"/api/stream", to:"_view/stream"}
    , {from:"/api/comments", to:"_view/comments"}
    , {from:"/api/couch", to:"../../../"}
    , {from:"/api/couch/*", to:"../../../*"}
    , {from:"/api", to:"../../"}
    , {from:"/api/*", to:"../../*"}
    , {from:"/*", to:"*"}
    ]
  }
  ;

ddoc.views = {
  comments: {
    map: function(doc) {
      if (doc.created_at && doc.parent_id) {
        emit([doc.parent_id, doc.created_at], doc);
      }
    }
  },
  stream: {
    map: function(doc) {
      if (doc.type && doc.type === "note" || doc.type === "follow") {
        emit(doc.updated_at || doc.created_at, doc);
      }
    }
  }
};

ddoc.lists = {
  feed: function(head, req){
    provides("atom",function() {
      var rows = [];
      // !json templates.feed
      Mustache = require("common/mustache");
      Rfc3339 = require("common/rfc3339");
      while(row = getRow()){
        if (row.value.profile && row.value.profile.name === req.query.name){
          rows.push(row);
        }
      }
      var host = req.headers.Host;
      var view = {
        username: req.query.name,
        hubURL: "http://psychicwarlock.com",
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
  },
  profile: function(head, req){
    //!json templates.profile
    provides("html", function(){

      Mustache = require("common/mustache");
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
  },
  push: function(head, req){
    send(JSON.stringify(head)+" "+JSON.stringify(req));
  }
}

ddoc.shows = {
  challenge: function(head, req){
    return req.query["hub.challenge"];
  },
  cors: function(head, req){
    return {
      "headers": { 
        "Access-Control-Allow-Origin": "*"
      }
    }
  },
  lrdd: function(doc, req){
    //!json templates.lrdd
    uri = req.query.q
    Mustache = require("common/mustache");
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
  },
  profile: function(doc, req){
    //!json templates.profile
    Mustache = require("common/mustache");
    var profile = doc.couch.app.profile;
    var html = Mustache.to_html(templates.profile, profile);
    provides("html", function(){
      return html;
    });
  },
  webfinger: function(doc, req){
    //!json templates.xrd
    uri = req.query.q
    Mustache = require("common/mustache");
    var host = req.headers.Host;
    var view = {
      host: host
    };
    var xml = Mustache.to_html(templates.xrd, view);
    provides("xml", function(){
      return xml;
    });
  }
}

ddoc.updates = {
  pubsub: function(head, req) {
    var xml2js = require('common/xml2js');
    var json;

    new xml2js.Parser(function(data) {
      json = [{_id:req.uuid, created_at: new Date(), data:data, type:"pubsub"}, "posted"];
    }).parseString(req.body);

    return json;
  },
  salmon: function(doc, req) {
    // var Base64 = require("common/base64")
    //   , md5 = require('common/md5')
    //   ;
    // req.body = req.body.replace(/<.*?>/,"");
    // var codez = new XML(req.body);
    // var atom = new Namespace('http://www.w3.org/2005/Atom');
    // var poco = new Namespace('http://portablecontacts.net/spec/1.0');
    // var me = new Namespace('http://salmon-protocol.org/ns/magic-env');
    // var thr = new Namespace('http://purl.org/syndication/thread/1.0');
    // var activity = new Namespace('http://activitystrea.ms/spec/1.0/');
    // var data = codez..me::data.toString();
    // function tr(str, from, to) {
    //   var subst;
    //   for (i = 0; i < from.length; i++) {
    //       subst = (to[i]) ? to[i] : to[to.length-1];
    //       str = str.replace(new RegExp(str[str.indexOf(from[i])], 'g'), subst);
    //   }
    //   return str;
    // }
    // var striped = tr(data, "-_,","+/=");
    // var decoded = new XML(Base64.client.decode(striped).replace(/<.*?>/,"").replace(/in-reply-to/g,"reply"));
    // var profile = {
    //   name: decoded..atom::author.atom::name.toString(),
    //   url: decoded..atom::author.atom::uri.toString(),
    //   gravatar_url: decoded..activity::actor.atom::link.(@rel == 'avatar')[0].@href.toString()
    // }
    // var parent_id = decoded..thr::reply.@ref.toString().split("/");
    // parent_id = parent_id[parent_id.length-1];
    // var hostname = profile.url.split("/")[2];
    // var message = decoded..atom::content.toString().replace(/<.*?>/g,"");
    // var created_at = new Date();
    // return [{_id:md5.hex(message), created_at:created_at, xml:req.body, decoded:decoded.toString(), hostname:hostname, profile:profile, message:message, parent_id:parent_id, type:"follow" }, "posted"]
  }
}

ddoc.validate_doc_update = function ( newDoc, oldDoc, userCtx, secObj ) {
  var v = require( "common/validate" ).init( newDoc, oldDoc, userCtx, secObj );
  
  if ( v.isAdmin() ) return;
  
  if( ! userCtx.name ) {
    // CouchDB sets userCtx.name only after a successful authentication
    v.unauthorized( "Please log in first." );
  }
  
  // if( oldDoc && oldDoc.profile.name !== userCtx.name ) {
  //   v.unauthorized( "You are not the author" );  
  // }
  
  // if ( ( oldDoc && oldDoc.type === "comment" ) || ( oldDoc && oldDoc.type === "note" ) ) {
  //   v.unauthorized( "You can't edit that" );
  // }
  
}

ddoc.common = couchapp.loadFiles('./common');
ddoc.templates = couchapp.loadFiles('./templates');
couchapp.loadAttachments(ddoc, path.join(__dirname, 'attachments'));

module.exports = ddoc;