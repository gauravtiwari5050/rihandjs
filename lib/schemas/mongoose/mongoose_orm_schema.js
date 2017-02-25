'use strict';
var _ = require('lodash');
var mongoose = require('mongoose');

mongoose.plugin(require('mongoose-timestamp'),  {
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

class MongooseOrmSchema extends require('../orm_schema').OrmSchema {

  constructor(modelName,fields) {
    super();
    if(_.isNil(modelName) || _.isNil(fields)) {
      throw new Error('modelName and fields are required while create a mongoose schema');
    }
    this.modelName = modelName;
    this.fields = fields;
    this.required_fields = [];
  }

  getModel() {
    var self = this;
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
    schema.pre('validate',function(next){
      var missing_fields = [];
      for(var field of self.required_fields){
        if(this[field]=== null || this[field] === undefined){
          missing_fields.push(field);
        }
      }
      if(missing_fields.length > 0){
        next(`The object is missing fields: ${missing_fields.join(',')}`);
      } else {
        next(null);
      }
    });
    
    var model = mongoose.model(this.modelName,schema);
    this.attachCreateOrUpdateByMethod(model);
    return model;
  }

  attachCreateOrUpdateByMethod(model){
    model.createOrUpdateBy = function(find_by,params_object,callback){
      model.findOne(find_by).exec(function(err,model_object){
        /* There was an error in querying */
        if(err){
          callback(err);
        } else {
          if(model_object === null || model_object === undefined){
            model_object =  new model()
          }

          for(var key of Object.keys(params_object)){
            model_object[key] = params_object[key];
          }
          model_object.save(function(err){
            if(err){
              callback(err);
            } else {
              callback(null,model_object);
            }
          });
        } 
      });
    }
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
      this.required_fields.push(member);
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

module.exports.MongooseOrmSchema = MongooseOrmSchema;