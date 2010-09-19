function showPostComments(event) {
    var $post = $(this).closest('li.message')
      , post_id = $post.attr('data-post-id');
    $(this).closest('li').find('div.comments').trigger('show', post_id);
	return false;
}
