const Cron = require('cron').CronJob;

module.exports = {

  schedule: (start, task, end) => {

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
