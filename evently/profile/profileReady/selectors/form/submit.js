function() {
  var that = $$(this);
  var form = this;
  var host = window.location.href.split("/")[2]
  var date = new Date();
  var id = date.valueOf()+"a";
  var doc = {
    created_at : date,
	_id: id,
    profile : $$("#profile").profile,
    message : $("[name=message]", form).val(),
	_attachments:{}
  };
  
  window.files = window.files || [];
  $.each(window.files, function(i, file) {
    doc._attachments["image" + i + "." + file.match] = {
  		"content_type": "image\/" + file.match,
  		"data": file.theGoodPart
  	}
  })
  
  $$(this).app.db.saveDoc(doc, {
    success : function(newDoc) {
      $("[name=message]", form).val("");
	  window.location.reload();
    }
  });
  return false;
};
