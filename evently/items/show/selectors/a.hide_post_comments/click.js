function hidePostComments(event) {
    $(this).closest('li').find('div.comments').trigger('hide');
	return false;
}
