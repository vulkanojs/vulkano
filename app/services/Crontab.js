const Cron = require('cron').CronJob;
const Promise = require('bluebird');

module.exports = {

  schedule: function (start, task, end) {

    const config = {
      cronTime: start,
      onTick: task || ( () => {} ),
      onComplete: end || ( () => {} ),
      timeZone: 'America/Bogota',
      start: true
    };

    return new Cron(config);

  }

};
