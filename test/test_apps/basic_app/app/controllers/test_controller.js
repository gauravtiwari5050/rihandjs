const Rihand = require('../../../../../index');

class TestController extends Rihand.Controller {
  testBefore(request, response, next) {
    next(null);
  }
  testAction(request, response, next) {
    this.$var1 = 1;
    next(null);
  }

  testHtml(request, response, next) {
    this.$var1 = 1;
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

TestController.beforeFilter('testBefore');
TestController.afterFilter('testAfter');

module.exports.TestController = TestController;
