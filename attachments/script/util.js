var util = function() {

  $.fn.serializeObject = function() {
    var o = {};
    var a = this.serializeArray();
    $.each(a, function() {
      if (o[this.name]) {
        if (!o[this.name].push) {
          o[this.name] = [o[this.name]];
        }
        o[this.name].push(this.value || '');
      } else {
        o[this.name] = this.value || '';
      }
    });
    return o;
  };

  function inURL(url, str) {
    var exists = false;
    if ( url.indexOf( str ) > -1 ) {
      exists = true;
    }
    return exists;
  }
  
  function registerEmitter() {
    var Emitter = function(obj) {
      this.emit = function(obj, channel) { 
        if (!channel) var channel = 'data';
        this.trigger(channel, obj); 
      };
    };
    MicroEvent.mixin(Emitter);
    app.emitter = new Emitter();
  }
  
  function listenFor(keys) {
    _.each(keys, function(key) {
      $(document).bind('keydown', key, function() { app.emitter.emit(key, key) });
    })
  }

  function render( template, target, options ) {
    if ( !options ) options = {data: {}};
    if ( !options.data ) options = {data: options};
    var html = $.mustache( $( "#" + template + "Template:first" ).html(), options.data );
    if (target instanceof jQuery) {
      var targetDom = target;
    } else {
      var targetDom = $( "#" + target + ":first" );      
    }
    if( options.append ) {
      targetDom.append( html );
    } else {
      targetDom.html( html );
    }
    if (template in app.after) app.after[template]();
  }

  function formatMetadata(data) {
    out = '<dl>';
    $.each(data, function(key, val) {
      if (typeof(val) == 'string' && key[0] != '_') {
        out = out + '<dt>' + key + '<dd>' + val;
      } else if (typeof(val) == 'object' && key != "geometry" && val != null) {
        if (key == 'properties') {
          $.each(val, function(attr, value){
            out = out + '<dt>' + attr + '<dd>' + value;
          })
        } else {
          out = out + '<dt>' + key + '<dd>' + val.join(', ');
        }
      }
    });
    out = out + '</dl>';
    return out;
  }

  function getBaseURL(url) {
    var baseURL = "";
    if ( inURL(url, '_design') ) {
      if (inURL(url, '_rewrite')) {
        var path = url.split("#")[0];
        if (path[path.length - 1] === "/") {
          baseURL = "";
        } else {
          baseURL = '_rewrite/';
        }
      } else {
        baseURL = '_rewrite/';
      }
    }
    return baseURL;
  }
  
  var persist = {
    restore: function() {
      $('.persist').each(function(i, el) {
        var inputId = $(el).attr('id');
        if(localStorage.getItem(inputId)) $('#' + inputId).val(localStorage.getItem(inputId));
      })
    },
    save: function(id) {
      localStorage.setItem(id, $('#' + id).val());
    },
    clear: function() {
      $('.persist').each(function(i, el) {
        localStorage.removeItem($(el).attr('id'));
      })
    }
  }
  
  // simple debounce adapted from underscore.js
  function delay(func, wait) {
    return function() {
      var context = this, args = arguments;
      var throttler = function() {
        delete app.timeout;
        func.apply(context, args);
      };
      if (!app.timeout) app.timeout = setTimeout(throttler, wait);      
    };
  };
  
  function resetForm(form) {
    $(':input', form)
     .not(':button, :submit, :reset, :hidden')
     .val('')
     .removeAttr('checked')
     .removeAttr('selected');
  }
  
  var date = {
    // Takes the format of "Jan 15, 2007 15:45:00 GMT" and converts it to a relative time
    // Ruby strftime: %b %d, %Y %H:%M:%S GMT
    time_ago_in_words_with_parsing: function(from) {
      var date = new Date; 
      date.setTime(Date.parse(from));
      return this.time_ago_in_words(date);
    },

    time_ago_in_words: function(from) {
      return this.distance_of_time_in_words(new Date, from);
    },

    distance_of_time_in_words: function(to, from) {
      var distance_in_seconds = ((to - from) / 1000);
      var distance_in_minutes = Math.floor(distance_in_seconds / 60);

      if (distance_in_minutes == 0) { return 'less than a minute ago'; }
      if (distance_in_minutes == 1) { return 'a minute ago'; }
      if (distance_in_minutes < 45) { return distance_in_minutes + ' minutes ago'; }
      if (distance_in_minutes < 90) { return 'about 1 hour ago'; }
      if (distance_in_minutes < 1440) { return 'about ' + Math.floor(distance_in_minutes / 60) + ' hours ago'; }
      if (distance_in_minutes < 2880) { return '1 day ago'; }
      if (distance_in_minutes < 43200) { return Math.floor(distance_in_minutes / 1440) + ' days ago'; }
      if (distance_in_minutes < 86400) { return 'about 1 month ago'; }
      if (distance_in_minutes < 525960) { return Math.floor(distance_in_minutes / 43200) + ' months ago'; }
      if (distance_in_minutes < 1051199) { return 'about 1 year ago'; }

      return 'over ' + (distance_in_minutes / 525960).floor() + ' years ago';
    }
  };
  
  //splits message into an array of tagged links or text
  function linkSplit( string ) {
  	//from http://snipplr.com/view/6889/regular-expressions-for-uri-validationparsing
  	var regexUri = /([a-z0-9+.-]+):(?:\/\/(?:((?:[a-z0-9-._~!$&'()*+,;=:]|%[0-9A-F]{2})*)@)?((?:[a-z0-9-._~!$&'()*+,;=]|%[0-9A-F]{2})*)(?::(\d*))?(\/(?:[a-z0-9-._~!$&'()*+,;=:@\/]|%[0-9A-F]{2})*)?|(\/?(?:[a-z0-9-._~!$&'()*+,;=:@]|%[0-9A-F]{2})+(?:[a-z0-9-._~!$&'()*+,;=:@\/]|%[0-9A-F]{2})*)?)(?:\?((?:[a-z0-9-._~!$&'()*+,;=:\/?@]|%[0-9A-F]{2})*))?(?:#((?:[a-z0-9-._~!$&'()*+,;=:\/?@]|%[0-9A-F]{2})*))?/i;
  	var res = [];
  	while ( string.length > 0 ) {
  		var pos = string.search( regexUri );
  		switch( pos ) {
  			case -1: // no match
  				res.push( { "text": string } );
  				string = "";
  				break;
  			case 0: // match at front of string
  				var link = string.match( regexUri )[ 0 ];
  				res.push( { "link": link } );
  				string = string.substr( link.length );
  				break;
  			default:
  				res.push( { "text": string.substr( 0, pos ) } );
  				string = string.substr( pos );
  				break;
  		}	
  	}
  	return res
  }
  
  // true if no admins exist in the database
  function isAdminParty( userCtx ) {
    return userCtx.roles.indexOf("_admin") !== -1;
  }
  
  
  return {
    inURL: inURL,
    registerEmitter: registerEmitter,
    listenFor: listenFor,
    render: render,
    formatMetadata:formatMetadata,
    getBaseURL:getBaseURL,
    resetForm: resetForm,
    delay: delay,
    persist: persist,
    date: date,
    linkSplit: linkSplit,
    isAdminParty: isAdminParty
  };
}();