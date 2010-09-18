function(data) {
  $.log(data)
  var p;
  var db = $$(this).app.db.name;
  
  return {
    items : data.rows.map(function(r) {
      p = r.value.profile;
      p.message = r.value.message;
	  p.id = r.id
	  var attachments =[];
	  for (file in r.value._attachments){
		var dude = {}
		dude.file = file
		attachments.push(dude)
	  }
	  p.attachments = attachments;
      return p;
    }),
	db: db
  }
};