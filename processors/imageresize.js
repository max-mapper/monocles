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
  , deferred = require('deferred')
  , _ = require("underscore")
  ;

var db = "http://admin:admin@localhost:5984/monocles"
  , h = {"Content-type": "application/json", "Accept": "application/json"}
  ;

follow({db:db, include_docs:true}, function(error, change) {
  if (error || change.deleted || !("doc" in change)) return;
  if (!("_attachments" in change.doc)) return;
   
  ensureCommit().then( function() {
    var doc = change.doc;
    var attachments = doc._attachments
      , needsResize = []
      ;

    if (!doc.attachment_meta) doc.attachment_meta = {};
    if ( ( doc._id.substr(0,7) === "_design" ) || ( ! attachments ) ) return;

    _.each(_.keys(attachments), function(name) {
      var converted = false;
      if (doc.attachment_meta && doc.attachment_meta[name]) converted = doc.attachment_meta[name].converted;
      if ( ( _.include(_.keys(doc), "message") ) && ( !converted ) && ( name.match(/jpe?g|png/ig) ) ) needsResize.push(name);          
    })

    if (needsResize.length > 0) sys.puts('Resizing ' + needsResize.length + " from doc " + doc._id + "...");
    resize(needsResize, db + "/" + doc._id, doc);
  })
})

function ensureCommit() {
  var dfd = deferred();
  request({uri:db + "/_ensure_full_commit", method:'POST', headers:h, body: "''"}, function (err, resp, body) {
    if (err) throw err;
    if (resp.statusCode > 299) throw new Error("Could not check committed status\n"+body);
    var status = JSON.parse(body);
    if (status.ok) {
      dfd.resolve(status.ok);
    }
  });
  return dfd.promise;
}

function download(uri) {
  var dfd = deferred();
  var filename = unescape(url.parse(uri).pathname.split("/").pop());
  request({
    uri: uri,
    encoding: "binary"
  }, 
  function(err, resp, body) {
    if (err || resp.statusCode > 299) throw new Error("Could not download photo\n"+body);
      fs.writeFileSync(filename, body, 'binary')
      dfd.resolve(filename);      
    }
  )
  return dfd.promise;
}

function resize(attachments, uri, doc) {
  function doneResizing() { if (left === 0) upload(files, uri, doc) };
  var files = []
    , left = attachments.length;
  _.each(attachments, function(name) {
    download(uri + "/" + escape(unescape(name))).then(
      function(filename) {
        im.convert([filename, '-resize', '500', filename], 
        function(err, stdout, stderr) {
          if (err) throw err;
          left--;
          files.push(filename);
          doneResizing();
        })
      }
    )
  })
}

function upload(files, uri, doc) {
  _.each(files, function(filename) {
    var data = fs.readFileSync(filename, 'binary')
    var mime = mimetypes.lookup(path.extname(filename).slice(1));
    data = new Buffer(data, 'binary').toString('base64');
    doc._attachments[filename] = {data:data, content_type:mime};
    doc.attachment_meta[filename] = {converted: true};
  })
  var body = JSON.stringify(doc);
  request({uri:uri, method:'PUT', body:body, headers:h}, function (err, resp, body) {
    if (err) throw err;
    if (resp.statusCode > 299) throw new Error("Could not upload converted photo\n"+body);
    sys.puts('Resized ' + files.length + " from doc " + doc._id);
  });
}
// 
// TODO binary version (doesnt work yet -- incorrect encoding?):
// var data = fs.readFileSync(filename, 'binary');
// request({uri:uri + "/" + filename + "?rev=" + doc._rev, method: 'PUT', encoding: "binary", body:data, headers:{"content-type": mime}}, function (err, resp, body) {
//   if (err) throw err;
//   if (resp.statusCode !== 201) throw new Error("Could not push document\n"+body);
// });