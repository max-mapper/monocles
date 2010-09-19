function(obj) {
  var data = obj.posts;
  var comments = obj.comments;
  var p;
  var app = $$(this);
  var db = $$(this).app.db.name;
  var baz = "test";
  return {
	items : data.rows.map(function(r) {
	  
	  p = r.value.profile;
	  p.comments = comments.rows.map(function(cr){
		if(cr.value.parent_id === r.id){
			return true;
		}
		
	  });
	  p.comments.clean(undefined);
	  if(p.comments.length>0){
		p.boolean = true;
	  }
	  p.commentCount = p.comments.length;
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
