var app = {
	baseURL: util.getBaseURL(document.location.pathname),
	hubURL: "http://www.psychicwarlock.com"
};

// TODO make this auto somehow
couch.dbPath = app.baseURL + "api/";
couch.rootPath = couch.dbPath + "couch/";

app.handler = function(route) {
  if (route.params && route.params.route) {
    var path = route.params.route;
    monocles.switchNav(path);
    app.routes[path](route.params.id);
  } else {
    monocles.switchNav('stream');
    app.routes['stream']();
  }
};

app.routes = {
  stream: function() {
    monocles.fetchSession();
  },
  images: function() {
    couch.get('images').then(
      function( data ) {
        var photos = _.map(data.rows, function( r ) { 
          return { 
            name : r.value.filename,
            url: couch.dbPath + r.id + "/" + r.value.filename
          };
        });
        util.render( 'images', 'content', {photos: photos} );
      }
    )
    
  },
  logout: function() {
    couch.logout().then(function() {
      delete app.session;
      $( '#header' ).data( 'profile', null );
      app.sammy.setLocation("#");
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
  $('.login').live('click', function(e) {
    monocles.showLogin();
    return false;
  })
  app.sammy.run(); 
  monocles.bindInfiniteScroll(); 
})