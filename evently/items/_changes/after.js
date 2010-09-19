function(){
	$("a[href=#showProf]").bind("click",function(){
		$(this).trigger("show_profile", $(this).attr("data-profile"));
	});
}
