function(e, data){
	var p = {};
	p.face="happy";
	p.data = data;
	var profile = JSON.parse(data);
	return profile;
}