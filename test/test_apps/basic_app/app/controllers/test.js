const Rihand = require('../../../../../index');

class Test extends Rihand.Controller {
  testBefore(request, response, next) {
    next(null);
  }
  testAction(request, response, next) {
    this.$var1 = 1;
    next(null);
  }

  testHtml(request, response, next) {
    this.$var1 = 1;
    this.$var2 = 2;
    next(null);
  }

  test_html_route_target(request, response, next) {
    this.$var1 = 1;
    this.$var2 = 2;
    next(null);
  }
  
  testActionJson(request, response, next) {
    this.json = {
      var1: 1,
    };
    next(null);
  }
  testAfter(request, response, next) {
    next(null);
  }

  rootValid(request, response, next) {
    next(null);
  }
}

Test.beforeFilter('testBefore');
Test.afterFilter('testAfter');

module.exports.Test = Test;
