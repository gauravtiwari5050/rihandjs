'use strict';
class OrmSchema {
  constructor() {
    this.pre_hooks = {};
    this.post_hooks =  {};
    this.has_one =  [];
    this.has_many =  [];
    this.belongs_to = [];
    this.modelName = null;
    this.fields = {};
  }

  getModel() {
    throw new Error('Not implemented');
  }

  validatesPresenceOf(members) {
    members;
    throw new Error('Not implemented');
  }

  validatesUniquenessOf(members) {
    members;
    throw new Error('Not implemented');
  }

  validate(members,message,validator) {
    members;
    message;
    validator;
    throw new Error('Not implemented');
  }

  addIndex(members) {
    members;
    throw new Error('Not implemented');
  }

}
module.exports.OrmSchema = OrmSchema;