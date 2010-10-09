function(head, req){
  provides("html", function(){
    return req.headers.Host; //JSON.stringify(req.headers);
  });
}