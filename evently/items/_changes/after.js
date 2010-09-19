function(){
	$("a[href=#showProf]").bind("click",function(){
		$(this).trigger("show_profile", $(this).attr("profile"));
	});
	$("a.hover").cluetip({local:true});
	$(".hover_profile").cluetip({local:true, sticky:true});
}