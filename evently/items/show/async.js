function getPostsWithComments(callback, event) {
  var posts;
  var comments;
  var spora = $$(this);

  // Runs the given callback only when posts and comments are both loaded.
  function render() {
    if (posts && comments) {
      callback(posts, comments);
    }
  }

  spora.app.db.view('couchappspora/recent-items', {
    "descending" : true,
    "limit" : 50,
    success: function(data) {
      posts = data;
      render();
    }
  });

  spora.app.db.view('couchappspora/comments', {
    "limit" : 250,
    success: function(data) {
      comments = data;
      render();
    }
  });
}
