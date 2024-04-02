module.exports = {

  apps: [
    {
      name: 'vulkano',
      script: 'app.js',
      max_memory_restart: '800M',
      // node_args: '--max_old_space_size=8192',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      env: {
        PORT: 5000,
        NODE_ENV: 'production'
      }
    },
    {
      name: 'vulkano-staging',
      script: 'app.js',
      max_memory_restart: '800M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      env: {
        PORT: 5100,
        NODE_ENV: 'development'
      }
    }
  ],

  deploy: {

    production: {
      user: 'SSH_USERNAME',
      port: 'SSH_PORT',
      host: ['SSH_HOSTMACHINE'],
      ref: 'origin/production',
      repo: 'GIT_REPOSITORY',
      path: 'DESTINATION_PATH',
      'pre-setup': 'echo "commands or local script path to be run on the host before the setup process starts"',
      'post-deploy': 'echo yes | npm install && pm2 startOrRestart ecosystem.config.js --only vulkano && pm2 save'
    },

    staging: {
      user: 'SSH_USERNAME',
      port: 'SSH_PORT',
      host: ['SSH_HOSTMACHINE'],
      ref: 'origin/production',
      repo: 'GIT_REPOSITORY',
      path: 'DESTINATION_PATH',
      'pre-setup': 'echo "commands or local script path to be run on the host before the setup process starts"',
      'post-deploy': 'echo yes | npm install && pm2 startOrRestart ecosystem.config.js --only vulkano-staging && pm2 save'
    }

  }

};
