/*global posts jive */

function comments(db) {
  var pub = {}
    , dbPosts = posts(db);

  pub.save = function(comment) {
    var promise = new jive.conc.Promise();

    db.saveDoc(comment, {
      success : function(savedComment) {
        // Update the updated_at timestamp and comment_count attributes of the
        // parent post.
        dbPosts.update(comment.parent_id, {
          updated_at: function(post) {
            if (!post.updated_at || post.updated_at < comment.created_at) {
              return comment.created_at;
            } else {
              return post.updated_at;
            }
          },

          comment_count: function(post) {
            return (post.comment_count || 0) + 1;
          }
        });

        promise.emitSuccess(savedComment);
      },

      error : function(status, textStatus, explanation) {
        promise.emitError(status, textStatus, explanation);
      }
    });

    return promise;
  };

  return pub;
}
