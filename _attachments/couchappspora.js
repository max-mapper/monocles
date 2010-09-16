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

    var i, tmp, html = "<ul>";

    for (i = 0; i < attachments.length; i += 1) {
      file = attachments[i];

      html += "<li>" 
        + (isImage(file.file.type) 
           ? "<img class='preview' src='" + file.result + "' />" : "")
        + "<span>" + file.file.name + "</span>"
        + "<a class='deleteattachment' data-action='delete'>x</a></li>";
    }
    $("#attachments").empty().append(html);
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
        reader.addEventListener("loadend", fileLoaded, false);
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
 
})();