(function($) {

  window.couch = { dbPath: "", rootPath: "/" };

  couch.defaults = {
    headers: {"Accept":"application/json"},
    dataType:"json",
    contentType: "application/json",
    type: "GET",
    url: "/"
  };  

  couch.request = function(opts) {
    var ajaxOpts = $.extend({}, couch.defaults, opts);
    return $.ajax(ajaxOpts).promise();
  }
  
  couch.get = function(path, opts) {
    return couch.request($.extend({}, {url: couch.dbPath + path, type: "GET"}, opts));
  }
  
  couch.login = function(credentials) {
    return couch.request({
      url: couch.rootPath + "_session",
      type: 'POST',
      data: JSON.stringify(credentials)
    })
  }
  
  couch.logout = function() {
    return couch.request({url: couch.rootPath + "_session", type: 'DELETE'});
  }
  
  couch.session = function() {
    return couch.request({url: couch.rootPath + "_session"});    
  }
  
  couch.userDb = function() {
    var dfd = $.Deferred();
    couch.session().then(function(session) {
      dfd.resolve(couch.db(session.info.authentication_db));
    })
    return dfd;
  }

  couch.db = function(name) {
    return {
      name: name,
      uri: couch.rootPath + "/" + encodeURIComponent(name) + "/",

      get: function(id) {
        return couch.request({url:this.uri + id, type:"GET"});
      },

      put: function(id, data) {
        return couch.request({url:this.uri + id, type:"PUT", data:data});
      },

      designDocs: function(opts) {
        return couch.request($.extend(couch.defaults, {
          url: this.uri + "_all_docs",
          data: {startkey:'"_design/"', endkey:'"_design0"', include_docs:true}
        }));
      }

    };
  };

})(jQuery);