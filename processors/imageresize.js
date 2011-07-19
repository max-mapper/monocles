/**  Resizes images attachments in place on a remote CouchDB. 
  *  Usage: node imageresize.js
  *  Author: Max Ogden (@maxogden)
 **/

var follow = require('follow')
  , im = require('imagemagick')
  , sys = require("sys")
  , url = require("url")
  , path = require("path")
  , fs = require("fs")
  , mimetypes = require('./mimetypes')
  , request = require('request')
  , _ = require("underscore")
  ;

var db = "http://username:password@yourcouch.com/monocles"
  , h = {"Content-type": "application/json", "Accept": "application/json"}
  , converted = []
  ;

follow({db:db, include_docs:true}, function(error, change) {
  if(!error) {
    
    var doc = change.doc
      , attachments = doc._attachments
      ;

    if ( ( doc._id.substr(0,7) === "_design" ) || ( ! attachments ) ) return;

    _.each(_.keys(attachments), function(name) {
      var uniqueName = doc._id + unescape(name);      
      if ( ( doc.message ) && ( attachments[name].length > 500000 ) && ( name.match(/jpe?g|png/) ) ) {
        if ( !(_.include(converted, uniqueName)) ) {
          converted.push(uniqueName);
          ensureCommit(function(uri, doc) {
            return function() {
              resize(uri, doc);
            }
          }(db + "/" + doc._id + "/" + escape(unescape(name)), doc))
        }
      }
    })
  }
})

function ensureCommit(callback) {
  request({uri:db + "/_ensure_full_commit", method:'POST', headers:h, body: "''"}, function (err, resp, body) {
    if (err) throw err;
    if (resp.statusCode > 299) throw new Error("Could not check committed status\n"+body);
    var status = JSON.parse(body);
    if (status.ok) {
      callback();
    } else {
      setTimeout( function() {
        ensureCommit( callback );
      }, 1000 );
    }
  });
}

function download(uri, callback) {
  var filename = unescape(url.parse(uri).pathname.split("/").pop())
    ;
  request({
    uri: uri,
    encoding: "binary"
  }, function(err, resp, body) {
    if (err || resp.statusCode > 299) {
      setTimeout(function() {
        download(uri, callback)
      }, 1000)
    } else {
      fs.writeFileSync(filename, body, 'binary');
      callback(filename);      
    }
  })
}

function resize(uri, doc) {
  download(uri, function(filename) {
    im.convert([filename, '-resize', '500', filename], 
    function(err, stdout, stderr) {
      if (err) throw err;
      upload(filename, db + "/" + doc._id, doc);
    })
  })
}

function upload(filename, uri, doc) {
  fs.readFile(filename, 'binary', function (er, data) {
    var mime = mimetypes.lookup(path.extname(filename).slice(1));
    data = new Buffer(data, 'binary').toString('base64');
    doc._attachments[filename] = {data:data, content_type:mime};
    var body = JSON.stringify(doc);
    request({uri:uri, method:'PUT', body:body, headers:h}, function (err, resp, body) {
      if (err) throw err;
      if (resp.statusCode > 299) throw new Error("Could not upload converted photo\n"+body);
      sys.puts('Resized ' + filename + " from doc " + doc._id);
    });
  })
}
// 
// TODO binary version (doesnt work yet -- incorrect encoding?):
// var data = fs.readFileSync(filename, 'binary');
// request({uri:uri + "/" + filename + "?rev=" + doc._rev, method: 'PUT', encoding: "binary", body:data, headers:{"content-type": mime}}, function (err, resp, body) {
//   if (err) throw err;
//   if (resp.statusCode !== 201) throw new Error("Could not push document\n"+body);
// });