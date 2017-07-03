class Middleware {
  call(){
    return function(request, response, next){
      next();
    };
  }
  priority(){
    return 0;
  }
  enabled(){
    return true;
  }
}

module.exports.Middleware =  Middleware;