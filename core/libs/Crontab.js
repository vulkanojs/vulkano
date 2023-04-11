const Cron = require('cron').CronJob;

module.exports = {

  schedule(start, task, end, timeZone) {

    const config = {
      cronTime: start,
      onTick: task || ( () => {} ),
      onComplete: end || ( () => {} ),
      timeZone: timeZone || 'America/New_York',
      start: true
    };

    return new Cron(config);

  }

};
