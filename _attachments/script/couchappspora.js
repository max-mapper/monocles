var CouchAppspora = (function() {
  
  var dbName = "couchappspora",
      attachments = [];

  function cloneHeader(e) { 
    e.preventDefault();
    $("#headertemplate").clone().appendTo($("#headers")).show();    
  };

  function removeHeader(e) {
    if (e.target.getAttribute("data-action") === "delete") { 
      e.preventDefault();
      $(e.target).closest("li").remove();
    }
  };

  function removeAttachment(e) { 

    if (e.target.getAttribute("data-action") === "delete") { 
      e.preventDefault();
      
      var i, attach = [], 
      $parent = $(e.target).closest("li"),
      text = $parent.find("span").text();
      
      for (i = 0; i < attachments.length; i += 1) {
        if (attachments[i].file.name !== text) { 
          attach.push(attachments[i]);
        }
      }
      attachments = attach;
      renderAttachments();      
    }
  };

  function hasStupidChromeBug() { 
    return typeof(FileReader.prototype.addEventListener) !== "function";
  };

  function isImage(type) { 
    return type === "image/png" || type === "image/jpeg";
  };

  function renderAttachments() { 

    var i, tmp, html = "";
	window.files = [];
    for (i = 0; i < attachments.length; i += 1) {
	  var dude = {};
      var file = attachments[i];
	  dude.match = /data:image\/(.*);/.exec(file.result)[1];
	  
	  dude.theGoodPart = file.result.split(",")[1];
	  
	  window.files.push(dude);
	  
      html += "<div style='float:left' id='imgDiv"+i+"'>" 
        + (isImage(file.file.type) 
           ? "<img  class='preview' src='" + file.result + "' />" : "")
       // + "<br>" + file.file.name 
        + "<br><a class='deleteattachment' data-action='delete' style='position:relative; top:0px; left:0px' href='#' id='image_"+i+"'><img src='image/x.png'></a></li></div>";
		
		
    }
	
    $("#attachments").html(html);
	if($("img.preview").height() > 200){
		$("img.preview").height(200);
	}
	$("a.deleteattachment").css("top", -1 * $("img.preview").height());
	$("a.deleteattachment").bind('click', function(){ 
		var fileNumber = this.id.split("_")[1];
		attachments.splice(fileNumber,1);
		$("#imgDiv"+fileNumber).remove();
	});
  };
  
  function fileLoaded(event) { 

    var file                = event.target.file,
        getBinaryDataReader = new FileReader(); 

    attachments.push(event.target);    
    renderAttachments();
  };

  function drop(e) { 

    var i, len, files, file;

    e.stopPropagation();  
    e.preventDefault();  

    files = e.dataTransfer.files;  

    for (i = 0; i < files.length; i++) {
      
      file = files[i];

      reader = new FileReader();
      reader.index = i;
      reader.file = file;
      
      if (!hasStupidChromeBug()) {
        reader.addEventListener("loadend", fileLoaded, false); //Custom or built-in event?
      } else {
        reader.onload = fileLoaded;
      }
      reader.readAsDataURL(file);
    }
  };

  function doNothing(e) {  
    e.stopPropagation();  
    e.preventDefault();  
  };

  function sendMessage(e) { 
    var doc = {}, attach = {}, headers = [];
    $("#headers li:not(#headertemplate)").each(function () { 
      doc[$(this).find(".key").val() || $(this).find(".key").text()] = 
        $(this).find(".val").val();      
    });
    
    for (i = 0; i < attachments.length; i += 1) {
      file = attachments[i];
      attach[file.file.name] = {
        "content_type" : file.file.type,
        "data" : file.result.split(",")[1]
      };
    }
    
    doc["_id"] = $("#name").val();
    doc["_attachments"] = $("#name").val();
    
    $("#sendbutton")[0].setAttribute("disabled", "disabled");
    
    $.couch.db(dbName).saveDoc(doc, {
      success: function() { 
        $("#sendbutton").removeAttr("disabled").val("Send"); 
        $("#feedback").text("Saved...").show();
        setTimeout(function () { $("#feedback").fadeOut(); }, 3000);
      }
    });  
    e.preventDefault();
  };

  $("#addheader").bind("mousedown", cloneHeader);
  $("#headers").bind("mousedown", removeHeader);
  $("#attachments").bind("mousedown", removeAttachment);
  $("#createmessage").bind("submit", sendMessage);

  document.addEventListener("dragenter", doNothing, false);  
  document.addEventListener("dragover", doNothing, false);  
  document.addEventListener("drop", drop, false);  
  
  $.couch.app(function(app) {        
    $("#account").evently("account", app);
    $("#profile").evently("profile", app);
    $.evently.connect("#account","#profile", ["loggedIn","loggedOut"]);
    $(".items").evently("items", app);
  });
 
})();