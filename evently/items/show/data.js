function renderPostsWithComments(posts, comments) {
  var app = $$(this);
  var db = $$(this).app.db.name;

  function randomToken() {
      return String(Math.floor(Math.random() * 1000));
  }

  return {
    items : posts.rows.map(function(r) {
      var postComments = comments.rows.filter(function(cr) {
            return cr.value.parent_id === r.id;
          })

        , attachments = Object.keys(r.value._attachments || {}).map(function(file) {
            return {
              file : file,
              randomToken : randomToken()
            };
          });

      return $.extend({
        comments : postComments,
        hasComments : postComments.length > 0,
        commentCount : postComments.length,
        randomToken : randomToken(),
        message : r.value.message,
        created_at : r.value.created_at,
		hostname : r.value.hostname || "unknown",
        id : r.id,
        attachments : attachments
      }, r.value.profile);
    }),

    db : db
  };
}
