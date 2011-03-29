var currentDoc, oldestDoc, streamDisabled = false, newUser = false, infiniteLoading = false;

// vhosts are when you mask couchapps behind a pretty URL
var inVhost = function() {
  var path = document.location.pathname
    , vhost = false;

  if ( path.indexOf( "_design" ) == -1 ) {
    vhost = true;
  }
  
  return vhost;
}

/** Uses mustache to render a template out to a target DOM
 *  template: camelcase ID (minus the word Template) of the DOM object containg your mustache template
 *  target: ID of the DOM node you wish to render the template into
 *  data: data object to pass into the mustache template when rendering
 *  append: whether or not to append to or replace the contents of the target
**/
function render( template, target, data, append ) {
  if ( ! data ) var data = {};
  var html = $.mustache( $( "#" + template + "Template" ).text(), data ),
      targetDom = $( "#" + target );
  if( append ) {
    targetDom.append( html );    
  } else {
    targetDom.html( html );
  }
}

// true if no admins exist in the database
function isAdminParty( userCtx ) {
  return userCtx.roles.indexOf("_admin") !== -1;
}

// binds UX interaction and form submit event handlers to the signup/login forms
function waitForLoginOrSignUp() {
  $( "a.login" ).click( function() {
    
    disableStream();
    
    // TODO: dynamic host
    render( 'login', 'stream', { host: "monocles" }, false );
    
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
        signUp( name, pass );
      } else if ( type === 'Login' ) {
        login( name, pass );
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
}

// checks if the user is logged in and responds accordingly
function fetchSession() {
  $.couch.app ( function( app ) { 
    $.couch.session({
      success : function( session ) {
        if ( session.userCtx.name ) {
          fetchProfile( session, function( profile ) {
            render( 'loggedIn', 'account', {
              nickname : profile.nickname,
              gravatar_url : profile.gravatar_url
            });
            getPostsWithComments( { reload: true } );
            // TODO sammy
            $( "a[href=#logout]" ).click (function() { logout() });
          });
        } else if ( isAdminParty( session.userCtx ) ) {
          render( 'adminParty', 'account' );
        } else {
          render( 'loginButton', 'account' );
          render( 'loggedOut', 'header' );
          waitForLoginOrSignUp();
        };
      }
    });
  }, config );
}

// gets user's stored profile info from couch
// asks them to fill out a form if it's their first login
function fetchProfile( session, callback ) {
  $.couch.userDb( function( db ) {
    db.openDoc( "org.couchdb.user:" + session.userCtx.name, {
      success : function( userDoc ) {
        var profile = userDoc[ "couch.app.profile" ];
        if ( profile ) {
          // we copy the name to the profile so it can be used later
          // without publishing the entire userdoc (roles, pass, etc)
          profile.name = userDoc.name;
          profile.base_url = config.baseURL;
          profileReady( profile );
          callback( profile );
        } else {
          render( 'newProfileForm', 'stream', session.userCtx, false );
          $( '#stream form' ).submit( function( e ) {
            saveUser( $( this ) );
            e.preventDefault();
          });
        }
      }
    });
  });
}

function saveUser(form) {
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
              render( 'loggedIn', 'account', {
                nickname : newProfile.nickname,
                gravatar_url : newProfile.gravatar_url
              });
              getPostsWithComments( { reload: true } );
              profileReady( newProfile );
            }
          });
        }
      });
    });
  }, config);
}

function profileReady( profile ) {
  $( '#header' ).data( 'profile', profile );
  render( 'profileReady', 'header', profile )
  $( 'label' ).inFieldLabels();
  $( 'form.status_message' ).submit( submitPost );
  initFileUpload();
  if ( newUser ) {
    subscribeHub();
    newUser = false;
  }
}

function addMessageToPhoto(photoDoc, callback) {
  var db = $.couch.db( config.db );
  
  var docAdditions = {
    type: "note",
    _id: photoDoc.id,
    _rev: photoDoc.rev,
    created_at : new Date(),
    profile : $( "#header" ).data( 'profile' ),
    message : $( "form.status_message [name=message]" ).val(),
    hostname : config.host
  };

  posts( db ).update( photoDoc.id, docAdditions ).addCallback( function( newDoc ) {
    callback(newDoc);
  });
}

function initFileUpload() {
  var db = $.couch.db( config.db )
    , docURL
    , currentFileName
    , uploadSequence = [ ];
  
  $.getJSON( '/_uuids', function( data ) { 
    docURL = config.baseURL + "db/" + data.uuids[ 0 ] + "/";
  });
  
  $( '.drop_instructions' ).html( "" );

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
    uploadTable: $( '.drop_instructions' ),
    downloadTable: $( '.drop_instructions' ),
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
      currentDoc = handler.response;
      var nextUpload = uploadSequence[ index + 1 ];
      if ( nextUpload ) {
        uploadSequence.start( index + 1, files[ index ].fileName, currentDoc.rev );
      } else {
        addMessageToPhoto(currentDoc, function(newDoc) {
          console.log("all done! " + JSON.stringify(newDoc));
        });
      }
    },
    onAbort: function (event, files, index, xhr, handler) {
      handler.removeNode(handler.uploadRow);
      uploadSequence[index] = null;
      uploadSequence.start(index + 1, handler.url);
    }
  });
}

// pubsubhubbubb notification functions
function subscribeHub() {
  var callbackURL = "http://" + config.host + config.baseURL + "push"
    , topicURL = "http://" + config.host + config.baseURL + "feeds/" + $( "#header" ).data( 'profile' ).name;
  $.post(config.hubURL, { 
    "hub.mode": "subscribe", "hub.verify": "sync", "hub.topic": topicURL, "hub.callback": callbackURL
  })
}

function pingHub() {
  var publishURL = "http://" + config.host + config.baseURL + "feeds/" + $( "#header" ).data( 'profile' ).name;
  $.post(config.hubURL, { 
    "hub.mode": "publish", "hub.url": publishURL
  })
}

function submitPost( e ) {
  var form = this;
  var date = new Date();
  var db = $.couch.db( config.db );
  var doc = {
    type: "note",
    created_at : date,
    profile : $( "#header" ).data( 'profile' ),
    message : $( "[name=message]", form ).val(),
    hostname : config.host
  };
    
  if ( currentDoc ) {
    posts( db ).update( currentDoc.id, { message: doc.message }).addCallback( afterPost );
  } else {
    posts( db ).save( doc ).addCallback( afterPost );
  }
  
  e.preventDefault();
  return false;
}

function afterPost( newDoc ) {
  // Clear post entry form
  $( "form.status_message [name=message]" ).val( "" );
  $( '.drop_instructions' ).html( "" );
  currentDoc = null;

  // Reload posts
  getPostsWithComments( { reload: true } );
  
  // notify the pubsubhubbub hub
  pingHub();
}

function randomToken() {
  return String( Math.floor( Math.random() * 1000 ) );
}

function login( name, pass ) {
  $.couch.login({
    name : name,
    password : pass,
    success : function( r ) {
      fetchSession();
    }
  });
}

function logout() {
  $.couch.logout({
    success : function() {
      $( '#header' ).data( 'profile', null );
      getPostsWithComments( { reload: true } );
      fetchSession();
    }
  });
}

function signUp( name, pass ) {
  $.couch.signup({
    name : name
  }, pass, {
    success : function() {
      login( name, pass );
      newUser = true;
    }
  });
}

function disableStream() {
  if ( streamDisabled === false ) {
    $( 'header' ).fadeOut( 200 );
    $( '#stream' ).hide();
    streamDisabled = true;
  }
}

function enableStream() {
  if ( streamDisabled ) {
    $( 'header' ).fadeIn( 200 );
    $( '#stream' ).show();
    streamDisabled = false;
  }
}

function showLoader() {
  $( '.loader' ).removeClass( 'hidden' );
}

function hideLoader() {
  $( '.loader' ).addClass( 'hidden' );
}

function loaderShowing() {
  var showing = false;
  if( $( '.loader' ).css( 'display' ) !== "none" ) showing = true;
  return showing;
}

function getPostsWithComments( opts ) {
  if(infiniteLoading) return;
  infiniteLoading = true;
  enableStream();
  var opts = opts || {};
  if( opts.offsetDoc === false ) return;
  var posts, comments;
  showLoader();

  // Renders only when posts and comments are both loaded.
  function renderStream() {
    if ( posts && comments ) {
      hideLoader();
      
      var append = true;
      if ( opts.reload ) append = false;
      render( 'stream', 'stream', renderPostsWithComments( posts, comments ), append );
      infiniteLoading = false;
      decorateStream();
	  hideLoader();
    }
  }

  var query = {
    "descending" : true,
    "limit" : 20,
    success: function( data ) {
      if( data.rows.length === 0 ) {
        oldestDoc = false;
        hideLoader();
      } else {
        oldestDoc = data.rows[ data.rows.length - 1 ];
        posts = data;
        renderStream(); 
      }
	  hideLoader();
    }
  }
  
  if ( opts.offsetDoc ) {
    $.extend( query, {
      "startkey": opts.offsetDoc.key,
      "startkey_docid": opts.offsetDoc.id,
      "skip": 1
    })
  }
  
  $.couch.db( config.db ).view( config.design + '/stream', query );

  $.couch.db( config.db ).view( config.design + '/comments', {
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
	  hideLoader();
    }
  });
}

function renderPostsWithComments( posts, comments ) {
  var data = {
    items : posts.rows.map( function( r ) {
      var postComments = comments.rows.filter( function( cr ) {
            return cr.value.parent_id === r.id;
          }).map( function( cr ) {
            return $.extend({
              id : cr.id,
              message : linkSplit( cr.value.message )
            }, cr.value.profile );
          })

        , attachments = Object.keys( r.value._attachments || {} ).map( function( file ) {
            return {
              file : file,
              randomToken : randomToken()
            };
          });

      return $.extend({
        comments : postComments,
        latestComments: postComments.slice( -2 ),  // grab the last 2 comments
        hasComments : postComments.length > 0,
        hasHiddenComments : postComments.length > 2,
        commentCount : postComments.length,
        hiddenCommentCount : postComments.length - 2,
        randomToken : randomToken(),
        message : linkSplit( r.value.message ),
        id: r.id,
        created_at : r.value.created_at,
    		hostname : r.value.hostname || "unknown",
        attachments : attachments
      }, r.value.profile );
    }),
    profile: $( '#header' ).data( 'profile' ),
    db : config.db
  };
  data[ 'notid' ] = data[ 'items' ][ 0 ][ 'id' ];
  return data;
}

//splits message into an array of tagged links or text
function linkSplit( string )
{
	//from http://snipplr.com/view/6889/regular-expressions-for-uri-validationparsing
	var regexUri = /([a-z0-9+.-]+):(?:\/\/(?:((?:[a-z0-9-._~!$&'()*+,;=:]|%[0-9A-F]{2})*)@)?((?:[a-z0-9-._~!$&'()*+,;=]|%[0-9A-F]{2})*)(?::(\d*))?(\/(?:[a-z0-9-._~!$&'()*+,;=:@\/]|%[0-9A-F]{2})*)?|(\/?(?:[a-z0-9-._~!$&'()*+,;=:@]|%[0-9A-F]{2})+(?:[a-z0-9-._~!$&'()*+,;=:@\/]|%[0-9A-F]{2})*)?)(?:\?((?:[a-z0-9-._~!$&'()*+,;=:\/?@]|%[0-9A-F]{2})*))?(?:#((?:[a-z0-9-._~!$&'()*+,;=:\/?@]|%[0-9A-F]{2})*))?/i;
	var res = [];
	if(string) {
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
    }
	return res;
}

function getComments( post_id, callback ) {
  $.couch.db( config.db ).view( config.design + '/comments', {
    startkey: [ post_id ],
    endkey: [ post_id + "\u9999" ],
    success: function( data ) {
      callback( post_id, data );
    }
  });
}

function formatComments( post_id, data ) {
  var comments = data.rows.map( function( r ) {
    return $.extend({
      id : r.id,
      message : linkSplit( r.value.message ),
			hostname : r.value.hostname || "unknown",
			randomToken : randomToken()
    }, r.value.profile );
  });

  return {
    id : post_id,
    empty : comments.length === 0,
    comments : comments
  };
}

function showComments( post_id, post ) {
  getComments( post_id, function( post_id, data ) {
    post.html( $.mustache( $( '#commentsTemplate' ).text(), formatComments( post_id, data ) ) );
    post.show().find( '*' ).show();
    post.closest( 'li' ).find( 'a.show_post_comments' ).hide().end().find( 'a.hide_post_comments' ).show();
    post.find( 'label' ).inFieldLabels();
    $( 'form', post ).submit( submitComment );
    $( ".hover_profile", post ).cluetip( { local: true, sticky: true, activation: "click" } );
  });
}

function submitComment( e ) {
  var form = $(this)
    , date = new Date()
    , parent = form.closest( '.stream_element' )
    , parent_id = parent.attr( 'data-post-id' )
    , parent_created_at = parent.attr( 'data-created-at' )
    , db = $.couch.db( config.db )
    , doc = {
        created_at : date,
        profile : $( '#header' ).data( 'profile' ),
        message : form.find( '[name=message]' ).val(),
    	  hostname : config.host,
        parent_id : parent_id,
        parent_created_at : parent_created_at
    };

  comments( db ).save( doc ).addCallback( function( savedComment ) {
    form.find( '[name=message]' ).val( '' );
    showComments( parent_id, form.closest( 'div.comments' ) );
  });

  e.preventDefault();
}

function decorateStream() {
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
  	  
    showComments( post_id, post );
    e.preventDefault();
	})
}

function bindInfiniteScroll() {
  var settings = {
    lookahead: 400,
    container: $( document )
  };
    
  $( window ).scroll( function( e ) {
    if ( loaderShowing() || streamDisabled ) {
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
      getPostsWithComments( { offsetDoc: oldestDoc } );
    }
  });
}


// by default use the relative vhost links defined in rewrites.json
var config = {
    db: "db"
  , design: "ddoc"
  , vhost: true
  , baseURL: "/"
  , host: window.location.href.split( "/" )[ 2 ]
  , hubURL: "http://www.psychicwarlock.com"
};

$(function() {
  if ( !inVhost() ) {
    config.vhost = false
    // grab info on db + ddoc paths from the current url
    config.db = document.location.href.split( '/' )[ 3 ];
    config.design = unescape( document.location.href ).split( '/' )[ 5 ];
    config.baseURL = "/" + config.db + "/_design/" + config.design + "/_rewrite/";
  }
  fetchSession();
  getPostsWithComments();
  bindInfiniteScroll();
});