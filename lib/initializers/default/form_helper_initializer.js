var Formic = require('formic');
class FormHelperInitializer extends require('../initializer').Initializer {
  run(callback){
    console.log("Calling form helper initializer");
    var app = rihand.getServiceByName('web').getWebApplication();
    
    app.locals.form_for = function(name) {
      return new Formic.FormFor(name);
    };

    callback(null);
  }
}
module.exports.FormHelperInitializer = FormHelperInitializer;
