var CouchAppspora = (function() {

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
  
  $.couch.app(function(app) {        
    $("#account").evently("account", app);
    $("#aspect_header").evently("profile", app);
    $.evently.connect("#account","#aspect_header", ["loggedIn","loggedOut"]);
    $(".items").evently("items", app);
  }, opts);
 
})();
