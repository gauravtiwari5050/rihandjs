const Rihand = require('../../../../index.js');

const sampleConstraint = function (request) {
  return false;
};
module.exports.loadRoutes = () => {
  Rihand.Route.getInstance().setup(function () {
    this.Get('/ => landing#home').constraint(sampleConstraint);
    this.Get('/ => landing#home2');
    this.namespace('api').json().setup(function () {
      this.namespace('v1').setup(function () {
        this.Get('/subscribers => subscribers#register').json();
      });
    });
  });
};

