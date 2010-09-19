function submitComment(event) {
    var $form = $(this)
      , date = new Date()
      , id = date.valueOf()+'a'
      , $parent = $form.closest('li.message')
      , parent_id = $parent.attr('data-post-id')
      , parent_created_at = $parent.attr('data-created-at')
      , doc = {
          created_at : date,
          _id : id,
          profile : $$('#profile').profile,
          message : $form.find('[name=message]').val(),
          parent_id : parent_id,
          parent_created_at : parent_created_at
      };

    $$(this).app.db.saveDoc(doc, {
        success : function(newDoc) {
            $form.find('[name=message]').val('');
            $form.closest('div.comments').trigger('show', parent_id);
        }
    });

    event.preventDefault();
}
