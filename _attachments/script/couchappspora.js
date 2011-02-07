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

var imgDrop = function() { 
  return {
    attachments: [],
    removeAttachment: function(e) { 
      if (e.target.getAttribute("data-action") === "delete") { 
        e.preventDefault();
        var i, attach = [], 
        $parent = $(e.target).closest("li"),
        text = $parent.find("span").text();
        for (i = 0; i < imgDrop.attachments.length; i += 1) {
          if (imgDrop.attachments[i].file.name !== text) { 
            attach.push(imgDrop.attachments[i]);
          }
        }
        imgDrop.attachments = attach;
        imgDrop.renderAttachments();      
      }
    },

    hasStupidChromeBug: function() { 
      return typeof(FileReader.prototype.addEventListener) !== "function";
    },

    isImage: function(type) { 
      return type === "image/png" || type === "image/jpeg";
    },

    renderAttachments: function() { 
      var i, tmp, html = "";
    	window.files = [];
      for (i = 0; i < imgDrop.attachments.length; i += 1) {
  	  var dude = {};
      var file = imgDrop.attachments[i];
  	  dude.match = /data:image\/(.*);/.exec(file.result)[1];
  	  dude.theGoodPart = file.result.split(",")[1];
  	  window.files.push(dude);
        html += "<div style='float:left' id='imgDiv"+i+"'>" 
          + (imgDrop.isImage(file.file.type) 
             ? "<img  class='preview' src='" + file.result + "' picNumber='"+i+"'>" : "")
          + "<br><a class='deleteattachment' data-action='delete' href='#' id='image_" 
          + i + "'><img src='images/x.png'></a></li></div>";
      }
      $("#attachments").html(html);
  	setTimeout(function(){
		$("#drop").show();
		$("img.preview").each(function(){
			if($(this).height() > 200){
				$(this).height(200);
			}
			var picNumber = $(this).attr("picNumber");
			$("#image_"+picNumber).css("position","relative").css("top", -1 * $(this).height());
		});
	},100);
  	  
  	  $("a.deleteattachment").bind('click', function(){ 
    		var fileNumber = this.id.split("_")[1];
    		imgDrop.attachments.splice(fileNumber,1);
    		$("#imgDiv"+fileNumber).remove();
  	  });
    },

    fileLoaded: function(event) { 
      var file                = event.target.file,
          getBinaryDataReader = new FileReader(); 

      imgDrop.attachments.push(event.target);    
      imgDrop.renderAttachments();
    },

    drop: function(e) { 
      var i, len, files, file;
      e.stopPropagation();  
      e.preventDefault();  
      files = e.dataTransfer.files;  
      for (i = 0; i < files.length; i++) {
        file = files[i];
        reader = new FileReader();
        reader.index = i;
        reader.file = file;
        if (!imgDrop.hasStupidChromeBug()) {
          reader.addEventListener("loadend", imgDrop.fileLoaded, false); //Custom or built-in event?
        } else {
          reader.onload = imgDrop.fileLoaded;
        }
        reader.readAsDataURL(file);
      }
    },

    doNothing: function(e) {  
      e.stopPropagation();  
      e.preventDefault();  
    }
  }
}();

$(function() {
  
  $("#attachments").bind("mousedown", imgDrop.removeAttachment);
  document.addEventListener("dragenter", imgDrop.doNothing, false);  
  document.addEventListener("dragover", imgDrop.doNothing, false);  
  document.addEventListener("drop", imgDrop.drop, false);  

  var opts = {};
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
            $('#aspect_header').html(Mustache.to_html($('#profileFormTemplate').text(), userCtx));
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
    $('#aspect_header').html(Mustache.to_html($('#profileReadyTemplate').text(), profile));
    $('label').inFieldLabels();
  }

  $.couch.app(function(app) { 
    function initSession() {
      $.couch.session({
        success : function(r) {
          var userCtx = r.userCtx;
          if (userCtx.name) {
            var data = {
              name : r.userCtx.name,
              uri_name : encodeURIComponent(r.userCtx.name),
              auth_db : encodeURIComponent(r.info.authentication_db)
            }
            $("#account").html(Mustache.to_html($("#loginTemplate").text(), data))
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
    }       
    
    initSession();
    
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
          $('.items').html(Mustache.to_html($('#streamTemplate').text(), renderPostsWithComments(posts, comments)))
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
  
      function randomToken() {
          return String(Math.floor(Math.random() * 1000));
      }
  
      return {
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
            created_at : r.value.created_at,
    		hostname : r.value.hostname || "unknown",
            id : r.id,
            attachments : attachments
          }, r.value.profile);
        }),
  
        db : opts.db
      };
    }
  
    function decorateStream() {
      $("a.hover").cluetip({local:true});
    	$(".hover_profile").cluetip({local:true, sticky:true, activation:"click"});
  
    	$('a.hide_post_comments').click(function() {
        $(this).closest('li').find('div.comments').trigger('hide');
      	return false;
    	})
  
    	$('a.show_post_comments').click(function() {
        var $post = $(this).closest('li.message')
          , post_id = $post.attr('data-post-id');
        $(this).closest('li.message').find('div.comments').trigger('show', post_id);
      	return false;        
    	})
  
    	$('div.comments').hide(function() {
    	  $(this).find('*').remove();
        $(this).closest('li').find('a.hide_post_comments').hide().end().find('a.show_post_comments').show();
    	})
   	
    	$('div.comments form').submit(function(e){
        var $form = $(this)
          , date = new Date()
          , id = date.valueOf()+'a'
          , $parent = $form.closest('li.message')
          , parent_id = $parent.attr('data-post-id')
          , parent_created_at = $parent.attr('data-created-at')
          , db = $.app.db
          , doc = {
              created_at : date,
              _id : id,
              profile : $$('#aspect_header').profile,
              message : $form.find('[name=message]').val(),
    		  hostname : window.location.href.split("/")[2],
              parent_id : parent_id,
              parent_created_at : parent_created_at
          };
  
        comments(db).save(doc).addCallback(function(savedComment) {
          $form.find('[name=message]').val('');
          $form.closest('div.comments').renderComments(parent_id);
        });
  
        e.preventDefault();
    	})
  
    }
  
    function getComments(callback, event, post_id) {
      $.couch.db(opts.db).view('couchappspora/comments', {
        startkey: [post_id],
        endkey: [post_id + "\u9999"], // why not do key: ?
        success: function(data) {
          renderComments(data, post_id);
          var $comments = $(this);
          $comments.show().find('*').show();
          $comments.closest('li').find('a.show_post_comments').hide().end().find('a.hide_post_comments').show();
          $comments.find('label').inFieldLabels();
        }
      });
    }
  
    function renderComments(data, post_id) {
    	 function randomToken() {
          return String(Math.floor(Math.random() * 1000));
      }
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
  
    // $("#aspect_header").evently("profile", app);
    // $.evently.connect("#account","#aspect_header", ["loggedIn","loggedOut"]);
    // $('.items').trigger('show');
    getPostsWithComments();
  
  }, opts);     
});