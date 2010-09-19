function getComments(callback, event, post_id) {
	var obj = {};
	var spora = $$(this);
	spora.app.db.view('couchappspora/recent-items', {
		"descending" : true,
		"limit" : 50,
		success: function(posts) {
            $.log(posts);
			obj.posts = posts;
			spora.app.db.view('couchappspora/comments', {
				success: function(comments) {
					obj.comments = comments
					callback(obj);
				}
			});
        }
    });
}