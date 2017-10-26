const Rihand = require('../../../../index.js');

const sampleConstraint = function (request, response, callback) {
  callback(true);
};
const sampleConstraint2 = function (request, response, callback) {
  callback(true);
};
module.exports.loadRoutes = () => {
  Rihand.Route.getInstance().constraint(sampleConstraint).setup(function () {
    this.Get('/ => landing#home').constraint(sampleConstraint2);
    this.Get('/ => landing#home2');
    this.namespace('api').json().setup(function () {
      this.namespace('v1').setup(function () {
        this.Get('/subscribers => subscribers#register').json();
      });
    });
  });
};

