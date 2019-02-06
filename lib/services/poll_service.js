const _ = require('lodash');
const { timeout } = require('promise-timeout');

const upperCamelCase = require('uppercamelcase');
const { File } = require('../utils/file');

/**
 * Base class for services
 */
class PollService extends require('./service').Service {
  requiredServices() {
    return ['asset_pipeline', 'view', 'route', 'web'];
  }
  async initialize() {
  }

  async loop({ Poll, action }) {
    const pollObject = new Poll();
    try {
      await timeout(pollObject[action](), pollObject.timeout());
    } catch (err) {
      console.error('Error polling:');
      console.error(err);
    }
    const interval = pollObject.interval();
    const intervalPromise = new Promise(resolve => setTimeout(resolve, interval));
    await intervalPromise;
    await this.loop({ Poll, action });
  }
  async start(options) {
    const pollName = this.application.configuration.value('name');
    if (_.isNil(pollName)) {
      throw new Error('Please provide a poll name that you want to run');
    }
    const pollAction = _.camelCase(this.application.configuration.value('action', 'poll'));
    const pollsDirectory = `${this.application.root()}/app/polls`;
    const pollFile = `${pollsDirectory}/${_.snakeCase(pollName)}.js`;
    if (await File.exists(pollFile) === false) {
      throw new Error(`No poll file found at ${pollFile}`);
    }
    const PollClass = require(`${pollFile}`)[upperCamelCase(pollName)]; //eslint-disable-line
    if (_.isNil(PollClass)) {
      throw new Error(`
        Poll file: ${pollFile} is expected to 
        export a Class named ${upperCamelCase(pollName)}
      `);
    }
    const tmpPollObject = new PollClass();
    if (_.isNil(tmpPollObject[pollAction])) {
      throw new Error(`Poll does not have action: ${pollAction}`);
    }
    await this.loop({
      Poll: PollClass,
      action: pollAction,
    });
  }
}

module.exports.PollService = PollService;