function renderComments(data, post_id) {
	$.log(data);
	 function randomToken() {
      return String(Math.floor(Math.random() * 1000));
  }
    var comments = data.rows.map(function(r) {
        return $.extend({
            id : r.id,
            message : r.value.message,
			hostname : r.value.hostname || "unknown",
			randomToken : randomToken()
        }, r.value.profile);
    });

    return {
        id : post_id,
        empty : comments.length === 0,
        comments : comments
    };
}
