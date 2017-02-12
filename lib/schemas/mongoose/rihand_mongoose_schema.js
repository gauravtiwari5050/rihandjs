'use strict';
var _ = require('lodash');
var mongoose = require('mongoose');

class RihandMongooseSchema extends require('../rihand_orm_schema').RihandOrmSchema {

  constructor(modelName,fields) {
    super();
    if(_.isNil(modelName) || _.isNil(fields)) {
      throw new Error('modelName and fields are required while create a mongoose schema');
    }
    this.modelName = modelName;
    this.fields = fields;
  }

  getModel() {
    var schema = new mongoose.Schema(this.fields,{strict: false});
    for(let key of Object.keys(this.pre_hooks)){
      let hooks = this.pre_hooks[key];
      for(let hook of hooks) {
        schema.pre(key, hook);
      }

    }
    for(let key of Object.keys(this.post_hooks)){
      let hooks = this.post_hooks[key];
      for(let hook of hooks) {
        schema.post(key, hook);
      }

    }
    
    var model = mongoose.model(this.modelName,schema);
    return model;
  }

  validatesPresenceOf(members) {
    if(_.isNil(members)){
      return;
    }
    members = _.castArray(members);
    for(var member of members){

      if(_.isNil(this.fields[member])){
        throw new Error(`${member} is not a part of schema`);
      }

      this.fields[member]['required'] = true;
    }
  }
  validatesUniquenessOf(members) {
    if(_.isNil(members)){
      return;
    }
    members = _.castArray(members);
    for(var member of members){
      if(_.isNil(this.fields[member])){
        throw new Error(`${member} is not a part of schema`);
      }

      this.fields[member]['unique'] = true;
    }
  }

  
  validate(members,message,validator) {
    if(_.isNil(members)){
      return;
    }
    members = _.castArray(members);
    for(var member of members) {
      if(_.isNil(this.fields[member])){
        throw new Error(`${member} is not a part of schema`);
      }

      var validators = this.fields[member]['validate'] || [];
      validators.push({validator: validator, message: message});
      this.fields[member]['validate'] = validator;

    }
  }

  insertPreHook (verb,hook_method) {
    this.pre_hooks[verb] = this.pre_hooks[verb] || [];
    this.pre_hooks[verb].push(hook_method);
  }

  insertPostHook (verb, hook_method) {
    this.post_hooks[verb] = this.post_hooks[verb] || [];
    this.post_hooks[verb].push(hook_method);
  }


  before_init (hook_method) {
    this.insertPreHook('init',hook_method);
  }

  after_init (hook_method) {
    this.insertPostHook('init',hook_method);
  }

  before_validate (hook_method) {
    this.insertPreHook('validate',hook_method);
  }

  after_validate (hook_method) {
    this.insertPostHook('validate',hook_method);
  }

  before_save (hook_method) {
    this.insertPreHook('save',hook_method);
  }

  after_save (hook_method) {
    this.insertPostHook('save',hook_method);
  }

  before_remove (hook_method) {
    this.insertPreHook('remove',hook_method);
  }

  after_remove (hook_method) {
    this.insertPostHook('remove',hook_method);
  }


}

module.exports.RihandMongooseSchema = RihandMongooseSchema;