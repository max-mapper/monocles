function() {
    var $comments = $(this);
	//$(".hover_profile").cluetip({local:true, sticky:true, activation:"click"});
    $comments.show().find('*').show();
    $comments.closest('li').find('a.show_post_comments').hide().end().find('a.hide_post_comments').show();
    $comments.find('label').inFieldLabels();
}
