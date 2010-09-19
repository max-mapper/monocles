function getComments(callback, event, post_id) {
    $$(this).app.db.view('couchappspora/comments', {
        startkey: [post_id],
        endkey: [post_id + "\u9999"], // why not do key: ?
        success: function(data) {
            callback(data, post_id);
        }
    });
}
