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
  window.files = window.files || []
  for(i=0;i<window.files.length;i++){
	doc._attachments["image"+i+"."+window.files[i].match] = {
		"content_type":"image\/"+window.files[i].match,
		"data":window.files[i].theGoodPart
	}
	console.log(i);
  }
  console.log(doc);
  
  $$(this).app.db.saveDoc(doc, {
    success : function(newDoc) {
      $("[name=message]", form).val("");
	  window.location.reload();
    }
  });
  return false;
};
