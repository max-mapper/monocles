function(event) {
  var form = this;
  var date = new Date();
  var id = date.valueOf()+"a";
  var doc = {
    created_at : date,
        _id : id,
    profile : $$("#profile").profile,
    message : $("[name=message]", form).val(),
    _attachments : {}
  };
  
  window.files = window.files || [];
  $.each(window.files, function(i, file) {
    doc._attachments["image" + i + "." + file.match] = {
      "content_type": "image\/" + file.match,
      "data": file.theGoodPart
    };
  });
  
  $$(this).app.db.saveDoc(doc, {
    success : function(newDoc) {
      // Clear post entry form
      $("[name=message]", form).val("");

      // Remove image attachments from entry form
      $('a.deleteattachment').trigger('click');

      // Reload posts
      $('.items').trigger('show');
    }
  });

  event.preventDefault();
}
