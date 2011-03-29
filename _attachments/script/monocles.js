$( function() {
  if ( ! monocles.inVhost() ) {
    var cfg = monocles.config;
    cfg.vhost = false
    cfg.db = document.location.href.split( '/' )[ 3 ];
    cfg.design = unescape( document.location.href ).split( '/' )[ 5 ];
    cfg.baseURL = "/" + cfg.db + "/_design/" + cfg.design + "/_rewrite/";
  }
  monocles.fetchSession();
  monocles.bindInfiniteScroll();
} );

var defaults = {
    db: "api" // relative vhost links defined in rewrites.json
  , design: "ddoc"
  , vhost: true
  , baseURL: "/"
  , host: window.location.href.split( "/" )[ 2 ]
  , hubURL: "http://www.psychicwarlock.com"
}

var monocles = {
  config: defaults,

  // initial state
  currentDoc: null,
  oldestDoc: null,
  streamDisabled: false,
  newUser: false,

  db: function() {
    return $.couch.db( monocles.config.db );
  },
  
  userProfile: function() {
    return $( '#header' ).data( 'profile' );
  },
  
  // vhosts are when you mask couchapps behind a pretty URL
  inVhost: function() {
    var vhost = false;
    if ( document.location.pathname.indexOf( "_design" ) === -1 ) {
      vhost = true;
    }
    return vhost;
  },
  
  // true if no admins exist in the database
  isAdminParty: function( userCtx ) {
    return userCtx.roles.indexOf("_admin") !== -1;
  },
  
  /** Uses mustache to render a template out to a target DOM
   *  template: camelcase ID (minus the word Template) of the DOM object containg your mustache template
   *  target: ID of the DOM node you wish to render the template into
   *  data: data object to pass into the mustache template when rendering
   *  append: whether or not to append to or replace the contents of the target
  **/
  render: function( template, target, data, append ) {
    if ( ! data ) data = {};
    var html = $.mustache( $( "#" + template + "Template" ).text(), data ),
        targetDom = $( "#" + target );
    if( append ) {
      targetDom.append( html );    
    } else {
      targetDom.html( html );
    }
  },
  
  // binds UX interaction and form submit event handlers to the signup/login forms
  waitForLoginOrSignUp: function() {
    $( "a.login" ).click( function() {

      monocles.disableStream();

      // TODO: dynamic host
      monocles.render( 'login', 'stream', { host: "monocles" }, false );

      var form = $( "#login form" )
        , button = $( '.login_submit .button' );

      setTimeout( function() {
        $( '#stream' ).fadeIn(200);
        $( 'label', form ).inFieldLabels();
        $( "input[name=username]", form ).focus();
      }, 200);

      $( '.loginToggle' ).click( function ( e ) {
        var label = $( this )
          , labelText = label.text()
          , buttonText = button.text();

        label.text( buttonText );
        button.text( labelText );
      })

      form.submit( function( e ) {
        var type = button.text().trim()
          , name = $( 'input[name=username]', this ).val()
          , pass = $( 'input[name=password]', this ).val(); 

        if ( type === 'Sign up' ) {
          monocles.signUp( name, pass );
        } else if ( type === 'Login' ) {
          monocles.login( name, pass );
        }

        e.preventDefault();
      })

      $( "input", form ).keydown( function( e ) {
         if( e.keyCode == 13 ) form.submit();
      });

      button.click( function( e ) {
        form.submit();
        e.preventDefault();
      });

    })
  }, 
  
  // checks if the user is logged in and responds accordingly
  fetchSession: function() {
    $.couch.app ( function( app ) { 
      $.couch.session({
        success : function( session ) {
          if ( session.userCtx.name ) {
            monocles.fetchProfile( session, function( profile ) {
              monocles.render( 'loggedIn', 'account', {
                nickname : profile.nickname,
                gravatar_url : profile.gravatar_url
              });
              monocles.getPostsWithComments( { reload: true } );
              // TODO sammy
              $( "a[href=#logout]" ).click (function() { monocles.logout() });
            });
          } else if ( monocles.isAdminParty( session.userCtx ) ) {
            monocles.render( 'adminParty', 'account' );
            monocles.getPostsWithComments();
          } else {
            monocles.render( 'loginButton', 'account' );
            monocles.render( 'loggedOut', 'header' );
            monocles.waitForLoginOrSignUp();
            monocles.getPostsWithComments();
          };
        }
      });
    }, monocles.config );
  },
  
  // gets user's stored profile info from couch
  // asks them to fill out a form if it's their first login
  fetchProfile: function( session, callback ) {
    $.couch.userDb( function( db ) {
      db.openDoc( "org.couchdb.user:" + session.userCtx.name, {
        success : function( userDoc ) {
          var profile = userDoc[ "couch.app.profile" ];
          if ( profile ) {
            // we copy the name to the profile so it can be used later
            // without publishing the entire userdoc (roles, pass, etc)
            profile.name = userDoc.name;
            profile.base_url = monocles.config.baseURL;
            monocles.profileReady( profile );
            callback( profile );
          } else {
            monocles.render( 'newProfileForm', 'stream', session.userCtx, false );
            $( '#stream form' ).submit( function( e ) {
              monocles.saveUser( $( this ) );
              e.preventDefault();
            });
          }
        }
      });
    });
  },
  
  saveUser: function(form) {
    $.couch.app( function( app ) {     
      var md5 = app.require( "vendor/md5" );

      var name = $( "input[name=userCtxName]", form ).val();
      var newProfile = {
        rand : Math.random().toString(), 
        nickname : $( "input[name=nickname]", form ).val(),
        email : $( "input[name=email]", form ).val(),
        url : $( "input[name=url]", form ).val()
      };

      if ( md5 ) {
        newProfile.gravatar_url = 'http://www.gravatar.com/avatar/' + md5.hex( newProfile.email || newProfile.rand ) + '.jpg?s=50&d=identicon';    
      }

      $.couch.userDb( function( db ) {
        var userDocId = "org.couchdb.user:" + name;
        db.openDoc( userDocId, {
          success : function( userDoc ) {
            userDoc[ "couch.app.profile" ] = newProfile;
            db.saveDoc( userDoc, {
              success : function() {
                newProfile.name = userDoc.name;
                monocles.render( 'loggedIn', 'account', {
                  nickname : newProfile.nickname,
                  gravatar_url : newProfile.gravatar_url
                });
                monocles.getPostsWithComments( { reload: true } );
                monocles.profileReady( newProfile );
              }
            });
          }
        });
      });
    }, monocles.config);
  },
  
  profileReady: function( profile ) {
    $( '#header' ).data( 'profile', profile );
    monocles.render( 'profileReady', 'header', profile )
    $( 'label' ).inFieldLabels();
    $( 'form.status_message' ).submit( monocles.submitPost );
    monocles.initFileUpload();
    if ( monocles.newUser ) {
      monocles.subscribeHub();
      newUser = false;
    }
  },
  
  addMessageToPhoto: function(photoDoc, callback) {
    var docAdditions = {
      type: "note",
      _id: photoDoc.id,
      _rev: photoDoc.rev,
      created_at : new Date(),
      profile : monocles.userProfile(),
      message : $( "form.status_message [name=message]" ).val(),
      hostname : monocles.config.host
    };

    posts( monocles.db() ).update( photoDoc.id, docAdditions );
  },
  
  initFileUpload: function() {
    var docURL
      , currentFileName
      , uploadSequence = [ ];

    $.getJSON( '/_uuids', function( data ) { 
      docURL = monocles.config.baseURL + "api/" + data.uuids[ 0 ] + "/";
    });

    $( '.file_list' ).html( "" );

    var uploadSequence = [];
    uploadSequence.start = function (index, fileName, rev) {
      var next = this[index];
      currentFileName = fileName;
      var url = docURL + fileName;
      if ( rev ) url = url + "?rev=" + rev;
      next(url);
      this[index] = null;
    };

    $('#file_upload').fileUploadUI({
      multipart: false,
      uploadTable: $( '.file_list' ),
      downloadTable: $( '.file_list' ),
      buildUploadRow: function ( files, index ) {
        return $( $.mustache( $( '#uploaderTemplate' ).text(), { name: files[ index ].name } ));
      },
      buildDownloadRow: function ( file ) {
        return $( '<tr><td>' + currentFileName + '<\/td><\/tr>' );
      },
      beforeSend: function (event, files, index, xhr, handler, callBack) {
        uploadSequence.push(function (url) {
          handler.url = url;
          callBack();
        });
        if (index === 0) {
          uploadSequence.splice(0, uploadSequence.length - 1);
        }
        if (index + 1 === files.length) {
          uploadSequence.start(0, files[ index ].fileName);
        }
      },
      onComplete: function (event, files, index, xhr, handler) {
        monocles.currentDoc = handler.response;
        var nextUpload = uploadSequence[ index + 1 ];
        if ( nextUpload ) {
          uploadSequence.start( index + 1, files[ index ].fileName, monocles.currentDoc.rev );
        } else {
          monocles.addMessageToPhoto(monocles.currentDoc);
        }
      },
      onAbort: function (event, files, index, xhr, handler) {
        handler.removeNode(handler.uploadRow);
        uploadSequence[index] = null;
        uploadSequence.start(index + 1, handler.url);
      }
    });
  },
  
  // pubsubhubbubb notification functions
  subscribeHub: function() {
    var cfg = monocles.config
      , callbackURL = "http://" + cfg.host + cfg.baseURL + "push"
      , topicURL = "http://" + cfg.host + cfg.baseURL + "feeds/" + monocles.userProfile().name;
    $.post(cfg.hubURL, { 
      "hub.mode": "subscribe", "hub.verify": "sync", "hub.topic": topicURL, "hub.callback": callbackURL
    })
  },
  
  pingHub: function() {
    var cfg = monocles.config
      , publishURL = "http://" + cfg.host + cfg.baseURL + "feeds/" + monocles.userProfile().name;
    $.post(cfg.hubURL, { 
      "hub.mode": "publish", "hub.url": publishURL
    })
  },
  
  submitPost: function( e ) {
    var form = this;
    var date = new Date();
    var doc = {
      type: "note",
      created_at : date,
      profile : monocles.userProfile(),
      message : $( "[name=message]", form ).val(),
      hostname : monocles.config.host
    };

    if ( monocles.currentDoc ) {
      posts( monocles.db() ).update( monocles.currentDoc.id, { message: doc.message }).addCallback( monocles.afterPost );
    } else {
      posts( monocles.db() ).save( doc ).addCallback( monocles.afterPost );
    }

    e.preventDefault();
    return false;
  },
  
  afterPost: function( newDoc ) {
    // Clear post entry form
    $( "form.status_message [name=message]" ).val( "" );
    $( '.file_list' ).html( "" );
    monocles.currentDoc = null;

    // Reload posts
    monocles.getPostsWithComments( { reload: true } );

    // notify the pubsubhubbub hub
    monocles.pingHub();
  },
  
  randomToken: function() {
    return String( Math.floor( Math.random() * 1000 ) );
  },
  
  login: function( name, pass ) {
    $.couch.login({
      name : name,
      password : pass,
      success : function( r ) {
        monocles.fetchSession();
      }
    });
  },
  
  logout: function() {
    $.couch.logout({
      success : function() {
        $( '#header' ).data( 'profile', null );
        monocles.getPostsWithComments( { reload: true } );
        monocles.fetchSession();
      }
    });
  },
  
  signUp: function( name, pass ) {
    $.couch.signup({
      name : name
    }, pass, {
      success : function() {
        monocles.login( name, pass );
        monocles.newUser = true;
      }
    });
  },

  disableStream: function() {
    if ( monocles.streamDisabled === false ) {
      $( 'header' ).fadeOut( 200 );
      $( '#stream' ).hide();
      monocles.streamDisabled = true;
    }
  },

  enableStream: function() {
    if ( monocles.streamDisabled ) {
      $( 'header' ).fadeIn( 200 );
      $( '#stream' ).show();
      monocles.streamDisabled = false;
    }
  },

  showLoader: function() {
    $( '.loader' ).removeClass( 'hidden' );
  },

  hideLoader: function() {
    $( '.loader' ).addClass( 'hidden' );
  },

  loaderShowing: function() {
    var showing = false;
    if( $( '.loader' ).css( 'display' ) !== "none" ) showing = true;
    return showing;
  },
  
  getPostsWithComments: function( opts ) {
    monocles.enableStream();
    var opts = opts || {};
    if( opts.offsetDoc === false ) return;
    var posts, comments;
    monocles.showLoader();

    // Renders only when posts and comments are both loaded.
    function renderStream() {
       if ( posts && comments ) {
        monocles.hideLoader();

        if ( posts.length > 0 ) {
          var append = true;
          if ( opts.reload ) append = false;
          monocles.render( 'stream', 'stream', monocles.renderPostsWithComments( posts, comments ), append );
          monocles.decorateStream();
        } else if ( ! opts.offsetDoc ){
          monocles.render( 'empty', 'stream' );
        }
      }
    }

    var query = {
      "descending" : true,
      "limit" : 20,
      success: function( data ) {
        if( data.rows.length === 0 ) {
          monocles.oldestDoc = false;
          monocles.hideLoader();
          posts = [];
        } else {
          monocles.oldestDoc = data.rows[ data.rows.length - 1 ];
          posts = data.rows;
        }
        renderStream();
      }
    }

    if ( opts.offsetDoc ) {
      $.extend( query, {
        "startkey": opts.offsetDoc.key,
        "startkey_docid": opts.offsetDoc.id,
        "skip": 1
      })
    }

    monocles.db().view( monocles.config.design + '/stream', query );

    monocles.db().view( monocles.config.design + '/comments', {
      "descending" : true,
      "limit" : 250,
      success: function( data ) {
        comments = data;

        // Reverse order of comments
        comments.rows = comments.rows.reduceRight( function( list, c ) {
          list.push( c );
          return list;
        }, [] );

        renderStream();
      }
    });
  },

  renderPostsWithComments: function( posts, comments ) {
    var data = {
      items : posts.map( function( r ) {
        var postComments = comments.rows.filter( function( cr ) {
              return cr.value.parent_id === r.id;
            }).map( function( cr ) {
              return $.extend({
                id : cr.id,
                created: cr.value.created_at,
                message : monocles.linkSplit( cr.value.message )
              }, cr.value.profile );
            })

          , attachments = Object.keys( r.value._attachments || {} ).map( function( file ) {
              return {
                file : file,
                randomToken : monocles.randomToken()
              };
            });

        return $.extend({
          comments : postComments,
          latestComments: postComments.slice( -2 ),  // grab the last 2 comments
          hasComments : postComments.length > 0,
          hasHiddenComments : postComments.length > 2,
          commentCount : postComments.length,
          hiddenCommentCount : postComments.length - 2,
          randomToken : monocles.randomToken(),
          message : monocles.linkSplit( r.value.message ),
          id: r.id,
          created_at : r.value.created_at,
      		hostname : r.value.hostname || "unknown",
          attachments : attachments
        }, r.value.profile );
      }),
      profile: monocles.userProfile(),
      db : monocles.config.db
    };
    data[ 'notid' ] = data[ 'items' ][ 0 ][ 'id' ];
    return data;
  },

  //splits message into an array of tagged links or text
  linkSplit: function( string ) {
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
  },

  getComments: function( post_id, callback ) {
    monocles.db().view( monocles.config.design + '/comments', {
      startkey: [ post_id ],
      endkey: [ post_id + "\u9999" ],
      success: function( data ) {
        callback( post_id, data );
      }
    });
  },

  formatComments: function( post_id, data ) {
    var comments = data.rows.map( function( r ) {
      return $.extend({
        id : r.id,
        created: r.value.created_at,
        message : monocles.linkSplit( r.value.message ),
  			hostname : r.value.hostname || "unknown",
  			randomToken : monocles.randomToken()
      }, r.value.profile );
    });

    return {
      id : post_id,
      empty : comments.length === 0,
      comments : comments
    };
  },

  showComments: function( post_id, post ) {
    monocles.getComments( post_id, function( post_id, data ) {
      post.html( $.mustache( $( '#commentsTemplate' ).text(), monocles.formatComments( post_id, data ) ) );
      post.show().find( '*' ).show();
      post.closest( 'li' ).find( 'a.show_post_comments' ).hide().end().find( 'a.hide_post_comments' ).show();
      post.find( 'label' ).inFieldLabels();
      post.find( '.timeago' ).timeago();
      $( 'form', post ).submit( monocles.submitComment );
      $( ".hover_profile", post ).cluetip( { local: true, sticky: true, activation: "click" } );
    });
  },

  submitComment: function( e ) {
    var form = $(this)
      , date = new Date()
      , parent = form.closest( '.stream_element' )
      , parent_id = parent.attr( 'data-post-id' )
      , parent_created_at = parent.attr( 'data-created-at' )
      , doc = {
          created_at : date,
          profile : monocles.userProfile(),
          message : form.find( '[name=message]' ).val(),
      	  hostname : monocles.config.host,
          parent_id : parent_id,
          parent_created_at : parent_created_at
      };

    comments( monocles.db() ).save( doc ).addCallback( function( savedComment ) {
      form.find( '[name=message]' ).val( '' );
      monocles.showComments( parent_id, form.closest( 'div.comments' ) );
    });

    e.preventDefault();
  },

  decorateStream: function() {
  	$( ".hover_profile" ).cluetip( { local: true, sticky: true, activation: "click" } );
    $( '.timeago' ).timeago();
  	$( 'a.hide_post_comments' ).click( function( e ) {
      var comment = $( this ).closest( 'li' ).find( 'div.comments' );
      comment.find( '*' ).remove();
      comment.closest( 'li' ).find( 'a.hide_post_comments' ).hide().end().find( 'a.show_post_comments' ).show();
      e.preventDefault();
  	})

  	$( 'a.show_post_comments' ).click( function( e ) {
  	  var postComments = $( this );
      var post = postComments.closest( '.stream_element' ).find( 'div.comments' )
        , post_id = postComments.closest( '.stream_element' ).attr( 'data-post-id' );

      monocles.showComments( post_id, post );
      e.preventDefault();
  	})
  },

  bindInfiniteScroll: function() {
    var settings = {
      lookahead: 400,
      container: $( document )
    };

    $( window ).scroll( function( e ) {
      if ( monocles.loaderShowing() || monocles.streamDisabled ) {
        return;
      }

      var containerScrollTop = settings.container.scrollTop();
      if ( ! containerScrollTop ) {
        var ownerDoc = settings.container.get().ownerDocument;
        if( ownerDoc ) {
          containerScrollTop = $( ownerDoc.body ).scrollTop();        
        }
      }
      var distanceToBottom = $( document ).height() - ( containerScrollTop + $( window ).height() );

      if ( distanceToBottom < settings.lookahead ) {  
        monocles.getPostsWithComments( { offsetDoc: monocles.oldestDoc } );
      }
    });
  }
}