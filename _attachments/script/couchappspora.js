var DateHelper = {
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

var currentDoc = null, opts = {};
if (document.location.pathname.indexOf("_design") == -1) {
  // we are in a vhost
  opts.db = "couchappspora";
  opts.design = "couchappspora";
};

function initializeProfile(userCtx) {
  $.couch.userDb(function(db) {
    var userDocId = "org.couchdb.user:"+userCtx.name;
    db.openDoc(userDocId, {
      success : function(userDoc) {
        var profile = userDoc["couch.app.profile"];
        if (profile) {
          // we copy the name to the profile so it can be used later
          // without publishing the entire userdoc (roles, pass, etc)
          profile.name = userDoc.name;
          profileReady(profile)
        } else {
          $('#aspect_header').html($.mustache($('#profileFormTemplate').text(), userCtx));
          $('#aspect_header form').submit(function(e) {
            saveUser($(this));
            e.preventDefault();
          });
        }
      }
    });
  });
}

function saveUser(form) {
  var opts = {};
  opts.db = "couchappspora";
  opts.design = "couchappspora";

  $.couch.app(function(app) {     
    var md5 = app.require("vendor/md5");
    
    // TODO this can be cleaned up with docForm?
    // it still needs the workflow to edit an existing profile
    var name = $("input[name=userCtxName]", form).val();
    var newProfile = {
      rand : Math.random().toString(), 
      nickname : $("input[name=nickname]", form).val(),
      email : $("input[name=email]", form).val(),
      url : $("input[name=url]", form).val()
    };
    
    // setup gravatar_url
    if (md5) {
      newProfile.gravatar_url = 'http://www.gravatar.com/avatar/'+md5.hex(newProfile.email || newProfile.rand)+'.jpg?s=40&d=identicon';    
    }
    
    // store the user profile on the user account document
    $.couch.userDb(function(db) {
      var userDocId = "org.couchdb.user:"+name;
      db.openDoc(userDocId, {
        success : function(userDoc) {
          userDoc["couch.app.profile"] = newProfile;
          db.saveDoc(userDoc, {
            success : function() {
              newProfile.name = userDoc.name;
              profileReady(newProfile);
            }
          });
        }
      });
    });
  }, opts);
}


function profileReady(profile) {
  $('#aspect_header').data('profile', profile);
  $('#aspect_header').html($.mustache($('#profileReadyTemplate').text(), profile));
  $('label').inFieldLabels();
  $('form.status_message').submit(submitPost);
  
  initFileUpload();
}

function initFileUpload() {
  var db = $.couch.db(opts.db);
  
  var newId, currentUrl, uploadSequence = [];
  
  $.getJSON('/_uuids', function(data) { newId = data.uuids[0] });
  
  uploadSequence.start = function (index) {
    var next = this[index];
    if (next) {
      next({url: currentUrl});
      this[index] = null;
    } else {
      var doc = {
        _id: currentDoc.id,
        _rev: currentDoc.rev,
        created_at : new Date(),
        profile : $("#aspect_header").data('profile'),
        message : $("form.status_message [name=message]").val(),
        hostname : window.location.href.split("/")[2]
      };
      posts(db).update(doc._id, doc).addCallback(function(newDoc) {
        currentDoc = newDoc;
      });
    }
  };
  
  $('.drop_instructions').html("");
  $('#file_upload').fileUploadUI({
    uploadTable: $('.drop_instructions'),
    downloadTable: $('.drop_instructions'),
    buildUploadRow: function (files, index) {
      return $($.mustache($('#uploaderTemplate').text(), {name: files[index].name}));
    },
    buildDownloadRow: function (file) {
      return $('<tr><td>' + file.id + '<\/td><\/tr>');
    },
    beforeSend: function (event, files, index, xhr, handler, callBack) {
      handler.url = opts.db + "/" + newId + "/" + files[index].fileName;
      uploadSequence.push(callBack);
      if (index === 0) {
        uploadSequence.splice(0, uploadSequence.length - 1);
      }
      if (index + 1 === files.length) {
        uploadSequence.start(0);
      }
    },
    onComplete: function (event, files, index, xhr, handler) {
      currentDoc = handler.response;
      handler.url = currentUrl = opts.db + "/" + newId + "/" + files[index].fileName + "?rev=" + currentDoc.rev;
      uploadSequence.start(index + 1);
    },
    onAbort: function (event, files, index, xhr, handler) {
      handler.removeNode(handler.uploadRow);
      uploadSequence[index] = null;
      uploadSequence.start(index + 1);
    },
    multipart: false
  });
}

function submitPost(e) {
  var form = this;
  var date = new Date();
  var db = $.couch.db(opts.db);
  var doc = {
    created_at : date,
    profile : $("#aspect_header").data('profile'),
    message : $("[name=message]", form).val(),
    hostname : window.location.href.split("/")[2]
  };
  
  // $.post("http://couchappspora.superfeedr.com",{ 
  //   "hub.mode":"publish", "hub.url":"http://"+doc.hostname+"/feeds/"+doc.profile.name
  // });
  
  if (currentDoc) {
    posts(db).update(currentDoc.id, {message: doc.message}).addCallback(afterPost);
  } else {
    posts(db).save(doc).addCallback(afterPost);    
  }
  
  e.preventDefault();
  return false;
}

function afterPost(newDoc) {
  // Clear post entry form
  $("form.status_message [name=message]").val("");
  $('.drop_instructions').html("");
  currentDoc = null;

  // Reload posts
  getPostsWithComments();
}

function randomToken() {
  return String(Math.floor(Math.random() * 1000));
}

function login(name, pass) {
  $.couch.login({
    name : name,
    password : pass,
    success : function(r) {
      initSession();
    }
  });
}

function logout() {
  $.couch.logout({
    success : function() {
      initSession();
    }
  });
}

function signUp(name, pass) {
  $.couch.signup({
    name : name
  }, pass, {
    success : function() {
      login(name, pass);
    }
  });
}

function getPostsWithComments() {
  var posts;
  var comments;

  // Renders only when posts and comments are both loaded.
  function render() {
    if (posts && comments) {
      $('.items').html($.mustache($('#streamTemplate').text(), renderPostsWithComments(posts, comments)));
      decorateStream();
    }
  }

  $.couch.db(opts.db).view('couchappspora/recent-items', {
    "descending" : true,
    "limit" : 20,
    success: function(data) {
      posts = data;
      render();
    }
  });

  $.couch.db(opts.db).view('couchappspora/comments', {
    "descending" : true,
    "limit" : 250,
    success: function(data) {
      comments = data;

      // Reverse order of comments
      comments.rows = comments.rows.reduceRight(function(list, c) {
        list.push(c);
        return list;
      }, []);

      render();
    }
  });
}

function renderPostsWithComments(posts, comments) {
  var data = {
    items : posts.rows.map(function(r) {
      var postComments = comments.rows.filter(function(cr) {
            return cr.value.parent_id === r.id;
          }).map(function(cr) {
            return $.extend({
              id : cr.id,
              message : cr.value.message
            }, cr.value.profile);
          })

        , attachments = Object.keys(r.value._attachments || {}).map(function(file) {
            return {
              file : file,
              randomToken : randomToken()
            };
          });

      return $.extend({
        comments : postComments,
        latestComments: postComments.slice(-2),  // grab the last 2 comments
        hasComments : postComments.length > 0,
        hasHiddenComments : postComments.length > 2,
        commentCount : postComments.length,
        hiddenCommentCount : postComments.length - 2,
        randomToken : randomToken(),
        message : r.value.message,
        id: r.id,
        created_at : r.value.created_at,
    		hostname : r.value.hostname || "unknown",
        attachments : attachments
      }, r.value.profile);
    }),
    
    db : opts.db
  };
  data['id'] = data['items'][0]['id'];
  return data;
}

function getComments(post_id, callback) {
  $.couch.db(opts.db).view('couchappspora/comments', {
    startkey: [post_id],
    endkey: [post_id + "\u9999"],
    success: function(data) {
      callback(post_id, data);
    }
  });
}

function formatComments(post_id, data) {
  var comments = data.rows.map(function(r) {
    return $.extend({
      id : r.id,
      message : r.value.message,
			hostname : r.value.hostname || "unknown",
			randomToken : randomToken()
    }, r.value.profile);
  });

  return {
    id : post_id,
    empty : comments.length === 0,
    comments : comments
  };
}

function showComments(post_id, post) {
  getComments(post_id, function(post_id, data) {
     post.html($.mustache($('#commentsTemplate').text(), formatComments(post_id, data)));
     post.show().find('*').show();
     post.closest('li').find('a.show_post_comments').hide().end().find('a.hide_post_comments').show();
     post.find('label').inFieldLabels();
     $('form', post).submit(submitComment);
     $(".hover_profile", post).cluetip({local:true, sticky:true, activation:"click"});
  });
}

function submitComment(e) {
  var form = $(this)
    , date = new Date()
    , parent = form.closest('li.message')
    , parent_id = parent.attr('data-post-id')
    , parent_created_at = parent.attr('data-created-at')
    , db = $.couch.db(opts.db)
    , doc = {
        created_at : date,
        profile : $('#aspect_header').data('profile'),
        message : form.find('[name=message]').val(),
    	  hostname : window.location.href.split("/")[2],
        parent_id : parent_id,
        parent_created_at : parent_created_at
    };

  comments(db).save(doc).addCallback(function(savedComment) {
    form.find('[name=message]').val('');
    showComments(parent_id, form.closest('div.comments'));
  });

  e.preventDefault();
}

function decorateStream() {
  $("a.hover").cluetip({local:true});
	$(".hover_profile").cluetip({local:true, sticky:true, activation:"click"});

	$('a.hide_post_comments').click(function(e) {
    var comment = $(this).closest('li').find('div.comments');
    comment.find('*').remove();
    comment.closest('li').find('a.hide_post_comments').hide().end().find('a.show_post_comments').show();
    e.preventDefault();
	})

	$('a.show_post_comments').click(function(e) {
	  var postComments = $(this);
    var post = postComments.closest('li.message').find('div.comments')
      , post_id = postComments.closest('li.message').attr('data-post-id');
    showComments(post_id, post);
    e.preventDefault();
	})
}

function initSession() {
  $.couch.app(function(app) { 
  
    $.couch.session({
      success : function(r) {
        var userCtx = r.userCtx;
        if (userCtx.name) {
          var data = {
            name : r.userCtx.name,
            uri_name : encodeURIComponent(r.userCtx.name),
            auth_db : encodeURIComponent(r.info.authentication_db)
          }
          $("#account").html($.mustache($("#loginTemplate").text(), data))
            .attr("data-name", r.userCtx.name);
          $("a[href=#logout]").click(function() { logout() });

          initializeProfile(r.userCtx);
        
        } else if (userCtx.roles.indexOf("_admin") != -1) {
          $("#account").html($("#adminPartyTemplate").text());
        } else {
          $("#account").html($("#signUpTemplate").text());
          $("#aspect_header").html($("#loggedOutTemplate").text());
          $('label').inFieldLabels();
          $("input[name=name]").focus();
          $("a[href=#signup]").click(function() {
            $("#account").html($('#signupFormTemplate').text());
            $('label').inFieldLabels();
            $("input[name=name]").focus();
            $("#account form").submit(function(e) {
              var name = $('input[name=name]', this).val(),
                pass = $('input[name=password]', this).val();              
              signUp(name, pass);
              e.preventDefault();
            })
          })
          $("a[href=#login]").click(function() {
            $("#account").html($('#loginFormTemplate').text());
            $('label').inFieldLabels();
            $("input[name=name]").focus();
            $("#account form").submit(function(e) {
              var name = $('input[name=name]', this).val(),
                pass = $('input[name=password]', this).val();
              login(name, pass);
              e.preventDefault();
            })
          })
        };
      }
    });
  }, opts);
}


$(function() {
  
  // $("#attachments").bind("mousedown", imgDrop.removeAttachment);
  // document.addEventListener("dragenter", imgDrop.doNothing, false);  
  // document.addEventListener("dragover", imgDrop.doNothing, false);  
  // document.addEventListener("drop", imgDrop.drop, false);  
  
  initSession();
  getPostsWithComments();
  
});