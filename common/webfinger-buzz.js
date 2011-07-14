var sys = require('sys'),
  http = require("http"),
  url = require("url"),
  atom = require("./atom"),
  webfinger = require('./webfinger-client');

/**
 * A command line webfinger client.  Currently only works on
 * google Buzz updates, but could be tweaked to get differently
 * formatted updates from other services.
 * 
 * Example usage:
 *
 * $ node webfinger-buzz.js banksean@gmail.com
 * <spits out my latest public buzz update>
 */
if (process.argv.length < 3) {
  sys.puts("usage: " + process.argv[0] + " " + process.argv[1] + " <user uri>");
  process.exit();
}

var userUri =   process.argv[2];

sys.puts("fingering " + userUri);

var wf = new webfinger.WebFingerClient();
wf.finger(userUri, function(xrdObj) {
  var statusLinks = xrdObj.getLinksByRel("http://schemas.google.com/g/2010#updates-from");
  if (statusLinks.length < 1) {
    sys.puts("No status information for " + userUri);
    process.exit(0);
  }
  var statusUrl = url.parse(statusLinks[0].getAttrValues('href')[0]);
  //console.log(statusUrl);
  var pushFeed = statusUrl.href
  var httpClient = http.createClient(80, statusUrl.hostname);
  var path = statusUrl.pathname;
  if (statusUrl.search) {
    path += statusUrl.search;
  }

  var request = httpClient.request("GET", path, {"host": statusUrl.hostname});
  console.log(path);
  request.addListener('response', function (response) {
    response.setBodyEncoding("utf8");
    var body = "";
    response.addListener("data", function (chunk) {
      body += chunk;
    });
    response.addListener("end", function() {
      var atomPromise = atom.parse(body,
      function(atomFeed) {
        //sys.puts("Feed: " + atomFeed.title);
        //sys.puts(atomFeed.entries.length + " entries");
        //sys.puts("Updated: " + atomFeed.entries[0].updated);
        //sys.puts(atomFeed.entries[0].title + ": " + atomFeed.entries[0].summary);
        //console.log(atomFeed);
        for(i=0;i < atomFeed.links.length;i++){
          var link = atomFeed.links[i];
          if(link.rel === "hub"){
            var requestUrl = url.parse(pushFeed);
            console.log("<<REQUEST URL>>"+JSON.stringify(requestUrl.href));
            console.log("<<HUB URL>>"+link.href);
            var hubUrl = url.parse(link.href);
            var request = httpClient.request("POST", hubUrl.pathname+"?hub.callback=http://tyler.couchone.com/spora/_design/monocles/_rewrite/xml&hub.mode=subscribe&hub.topic="+requestUrl.href+"&hub.verify=sync", {"host": hubUrl.hostname});
            request.addListener('response', function (response) {
              response.setBodyEncoding("utf8");
              var body = "";
              response.addListener("data", function (chunk) {
                body += chunk;
              });
              response.addListener("end", function() {
                console.log(body);
              });
            });
            request.close();
          }
        }
      });
    });
  });
  request.close();
});

