var sys = require('sys'),
  fs = require('fs'),
  sax = require("./sax"),
  http = require("http"),
  events = require("events"),
  url = require("url"),
  xrd = require("./xrd"),
  uriTemplate = require('./uri-template');

/**
 * An async webfinger client.
 * For more info on webfinger:
 * http://code.google.com/p/webfinger/
 *
 * Usage:
 *
 * var fingerPromise = wf.finger(userUri);
 * fingerPromise.addCallback(function(xrdObj) {
 *   // do something with the webfinger XRD for this user
 * });
 *
 * Caveat: currently only works with email addresses.
 * 
 * Sean McCullough banksean@gmail.com
 *
 */

var WebFingerClient = function() {};

WebFingerClient.prototype.fetchFingerData_ = function(urlStr, callback) {
  var fingerUrl = url.parse(urlStr);
  
  var httpClient = http.createClient(80, fingerUrl.hostname);
  var request = httpClient.request("GET", fingerUrl.pathname + fingerUrl.search, {"host": fingerUrl.hostname});
  var wf = this;
  request.addListener('response', function (response) {
    response.setBodyEncoding("utf8");
    var body = "";
    response.addListener("data", function (chunk) {
      body += chunk;
    });
    response.addListener("end", function() {
      var xrdParser = new xrd.XRDParser(false);
      xrdParser.parse(body,
        function(xrdObj) {
          callback(xrdObj);
        });
    });
  });
  request.close();
};

WebFingerClient.prototype.fetchHostMeta_ = function(host, callback) {
  return this.fetchHostMetaCookedUrl_("http://" + host + "/.well-known/host-meta", callback)
}

WebFingerClient.prototype.fetchHostMetaCookedUrl_ = function(urlStr, callback) {
  var hostMetaUrl = url.parse(urlStr);
  var wf = this;
  var httpClient = http.createClient(80, hostMetaUrl.host);
  var path = hostMetaUrl.pathname;
  if (hostMetaUrl.search) {
    path += hostMetaUrl.search;
  }
  var request = httpClient.request("GET", path, {"host": hostMetaUrl.host});
  request.addListener('response', function (response) {
    sys.puts("status: " + response.statusCode);
    if (response.statusCode == 301 || response.statusCode == 302) {
      // Do a redirect.  Yahoo does this with @yahoo.com addresses
      // but this XRD parser can't grok it yet. 
      sys.puts('got redirected to: ' + response.headers['location']);
      return wf.fetchHostMetaCookedUrl_(response.headers['location']);
    }
    response.setBodyEncoding("utf8");
    var body = "";
    response.addListener("data", function (chunk) {
      body += chunk;
    });
    response.addListener("end", function() {
      sys.puts(body);
      var xrdParser = new xrd.XRDParser(false);
      xrdParser.parse(body,
        function(xrdObj) {
          callback(xrdObj);
        });
    });
  });
  request.close();
};

WebFingerClient.prototype.finger = function(userUri, callback) {
  var wf = this;

  // parse out the hostname from user id. currently only works for email.
  // TODO: see if node's url class can parse email addresses too.
  var hostName = userUri.split("@")[1];
  this.fetchHostMeta_(hostName, 
    function(xrdObj) {
      var webfingerTemplates = xrdObj.getLinksByRel("lrdd");
      var webfingerTemplateStr = webfingerTemplates[0].getAttrValues('template')[0];
      var webfingerTemplate = new uriTemplate.UriTemplate(webfingerTemplateStr);

      var fingerUrl = webfingerTemplate.expand({uri:userUri});
      sys.puts("webfinger uri: " + fingerUrl);

      wf.fetchFingerData_(fingerUrl,
        function(xrdObj) {
          callback(xrdObj);
        });
    });
};

exports.WebFingerClient = WebFingerClient;