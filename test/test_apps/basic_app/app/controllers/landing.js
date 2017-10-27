const Rihand = require('../../../../../index');

class Landing extends Rihand.Controller {
  home(request, response, next) {
    next(null);
  }
  home2(request, response, next) {
    next(null);
  }
}

module.exports.Landing = Landing;
