var sys = require('sys'),
  fs = require('fs'),
	sax = require("./sax"),
  path = require("path"),
  http = require("http"),
	events = require("events"),
	url = require("url");

/**
 * Crude sax-based Atom feed parser.
 * Use like so:
 *
 * var atomParser = new atom.AtomParser(false) //not strict
 * var parserPromise = atomParser.parse(feedXmlText);
 * parserPromise.addCallback(function(atomFeed) {
 *   sys.puts(atomFeed.entries[0].title);
 * });
 *
 * The feed object itself is structured like this:
 *
 * feed
 *   links[]
 *   entries[]
 *     title
 *     summary
 *     published
 *     updated
 *     id
 *     links[]
 * 		author
 * 			name
 * 			uri
 * 		content
 *
 * Not entirely sure it needs to return a promise, the way
 * it's written it doesn't do any buffering.  That may come
 * later though.
 *
 * Sean McCullough banksean@gmail.com
 *
 */

var AtomFeed = function() {
	this.links = [];
	this.entries = [];
	this.title = "";
	this.updated = "";
  this.id = "";
};

var Entry = function() {
	this.links = [];
	this.title = "";
	this.updated = "";
	this.published = "";
	this.summary = "";
	this.content = "";
  this.id="";
}

AtomFeed.prototype.getLinksByRel = function(rel) {
	var ret = [];
	for (var i=0; i<this.links.length; i++) {
		var link = this.links[i];
		if (link.rel == rel) {
			ret.push(link);
		}
	}
	return ret;
}

var AtomParser = function(strict) {
	this.strict = false;
};

exports.AtomParser = AtomParser;
exports.parse = parse;

function parse(data, callback, errback) {
  var parser = new AtomParser(false);
  return parser.parse(data, callback, errback);
}

AtomParser.prototype.parse = function(data, callback, errback) {
  sys.puts('callback: ' + callback);
	var parser = sax.parser(this.strict);
	var feed = new AtomFeed();
  var currentEntry = null;
	var currentNodeName = "";
	var skippingActivity = false;

 	parser.onerror = function (e) {
		if (errback) {
		  errback(e);
	  }
	};

	parser.ontext = function (t) {
		var el;
		if (currentEntry != null) {
			el = currentEntry;
		} else {
			el = feed;
		}
		if (currentNodeName == "TITLE") {
		  el.title += t;
		} else if (currentNodeName == "SUMMARY") {
			el.summary += t;
		} else if (currentNodeName == "PUBLISHED") {
			el.published += t;
		} else if (currentNodeName == "UPDATED") {
			el.updated += t;
		} else if (currentNodeName == "ID") {
			el.id += t;
		} else if (currentNodeName == "CONTENT") {
			el.content += t;
		}
	};

	parser.onopentag = function (node) {	
		if (skippingActivity) { return; }

		if (node.name == "ENTRY") {
			currentEntry = new Entry();
			feed.entries.push(currentEntry);
		}	else if (node.name == "LINK") {
			var l = {};
			for (var attrName in node.attributes) {
				l[attrName] = node.attributes[attrName];
			}
			if (currentEntry == null) {
				// LINKs for the feed itself
				feed.links.push(l);		
			} else {
				currentEntry.links.push(l);
			}
		} else if (node.name =="ACTIVITY:OBJECT") {
			skippingActivity = true;
		}
		currentNodeName = node.name;
	};

	parser.onclosetag = function (name) {
		if (name == "ENTRY") {
			currentEntry = null;
		} else if (name =="ACTIVITY:OBJECT") {
			skippingActivity = false;
		}
  };

	parser.onattribute = function (attr) {
		/*
		*/
	};

	parser.onend = function () {
		callback(feed);
	};
	
	parser.write(data).close();
};

