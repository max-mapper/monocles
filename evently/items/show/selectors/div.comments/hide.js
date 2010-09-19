function() {
    $(this).find('*').remove();
    $(this).closest('li').find('a.hide_post_comments').hide().end().find('a.show_post_comments').show();
}
