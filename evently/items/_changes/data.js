function(data) {
  $.log(data)
  var p;
  var db = $$(this).app.db.name;
  
  return {
    items : data.rows.map(function(r) {
      p = r.value.profile;
	  p.rand = parseInt(Math.random()*1000);
      p.message = r.value.message;
      p.created_at = r.value.created_at;
	  p.id = r.id
	  var attachments =[];
	  for (file in r.value._attachments){
		var dude = {};
		dude.file = file;
		dude.rand = parseInt(Math.random()*1000);
		attachments.push(dude);
	  }
	  p.attachments = attachments;
      return p;
    }),
	db: db
  }
};
