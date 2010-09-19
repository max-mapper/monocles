function renderComments(data, post_id) {
    var comments = data.rows.map(function(r) {
        return $.extend({
            id : r.id,
            message : r.value.message
        }, r.value.profile);
    });

    return {
        id : post_id,
        empty : comments.length === 0,
        comments : comments
    };
}
