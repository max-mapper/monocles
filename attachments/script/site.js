var app = {
	baseURL: util.getBaseURL(document.location.pathname),
	hubURL: "http://www.psychicwarlock.com"
};

// TODO make this auto somehow
couch.dbPath = app.baseURL;
couch.rootPath = app.baseURL + "api/couch/";

app.handler = function(route) {
  if (route.params && route.params.route) {
    var path = route.params.route;
    app.routes[path](route.params.id);
  } else {
    app.routes['home']();
  }  
};

app.routes = {
  home: function() {
    monocles.fetchSession();
    // monocles.bindInfiniteScroll();
  },
  login: function() {
    monocles.showLogin();
  },
  logout: function() {
    couch.logout().then(function() {
      $( '#header' ).data( 'profile', null );
      monocles.getPostsWithComments( { reload: true } );
      monocles.fetchSession();
      window.location = "";
    })
  }
}

app.after = {
  stream: function() {
    monocles.decorateStream();
  }
}

app.sammy = $.sammy(function () {
  this.get('', app.handler);
  this.get("#/", app.handler);
  this.get("#:route", app.handler);
  this.get("#:route/:id", app.handler);
});

$(function() {
  app.sammy.run();  
})