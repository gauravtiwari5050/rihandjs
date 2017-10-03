const Rihand = require('../../../../index');

class TestController extends Rihand.Controller {
  testBefore(request, response, next) {
    next(null);
  }
  testAction(request, response, next) {
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
