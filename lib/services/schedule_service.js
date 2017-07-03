'use strict';
var upperCamelCase = require('uppercamelcase');
var async = require('async');
var fs = require('fs');
var _ = require('lodash');
var schedule = require('node-schedule');

/**
 * Base class for services
 */
class ScheduleService extends require('./service').Service {
  
  initialize(callback) {
    this.jobs = [];
    let scheduleSubdirectories = ['app/schedules'];
    for(var scheduleSubdirectory of scheduleSubdirectories) {
      let files = fs.readdirSync(`${this.app.applicationConfig.root()}/${scheduleSubdirectory}`);
      for(var file of files) {
        let schedule_file = file.split('.');
        if(schedule_file === null || schedule_file[0] === null) {
          continue;
        }
        let scheduleName = upperCamelCase(schedule_file[0]);
        let scheduleLoadPath = `${this.app.applicationConfig.root()}/${scheduleSubdirectory}/${schedule_file[0]}`;

        this.app.logger.log(`Loading ${scheduleName} from  ${scheduleLoadPath}.js`);
        var scheduleClass = require(scheduleLoadPath)[scheduleName];
        if(_.isUndefined(scheduleClass)){
          throw new Error(`${scheduleLoadPath} should export ${scheduleName}`);
        }
        this.jobs.push(new scheduleClass());

      }
    }
    callback(null);
  }

  start(options, callback){
    this.jobs.forEach(function(job){
      schedule.scheduleJob(job.when(), function(){
        try {
              job.run();
        } catch(e) {
            console.log(e);
        }
      });
    });

    callback(null);
  }
  
}

module.exports.ScheduleService = ScheduleService;