var CouchAppspora = (function() {
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
               ? "<img  class='preview' src='" + file.result + "' />" : "")
            + "<br><a class='deleteattachment' data-action='delete' href='#' id='image_" 
            + i + "'><img src='image/x.png'></a></li></div>";
        }
        $("#attachments").html(html);
    	setTimeout(function(){
			if($("img.preview").height() > 200){
				$("img.preview").height(200);
			}
			$("a.deleteattachment").css("top", -1 * $("img.preview").height());
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
  
  $.couch.app(function(app) {        
    $("#account").evently("account", app);
    $("#profile").evently("profile", app);
    $.evently.connect("#account","#profile", ["loggedIn","loggedOut"]);
    $(".items").evently("items", app);
  });
 
})();