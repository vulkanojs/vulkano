# Vulcano

## Stack

### API

- Node.js
- [Express](http://expressjs.com)
- [Mongoose](http://mongoosejs.com/)
- [Nunjucks](http://mozilla.github.io/nunjucks/) (Template Engine)
- [Nodemon](http://nodemon.io/) (Reload automatically for dev mode)
- [PM2](http://pm2.keymetrics.io/) (Deployment)

## Install

### System

- Unix
- Node.js v6+

### Packages

```bash
$ npm install install
```

## Workflow

| Command									| Description                               |
| :----------------------------------------	| :---------------------------------------- |
| `npm run dev`								| Run development server and watch changes	|
| `npm run start`							| Start development server                  |
| `npm run production`						| Start production server                   |
| `npm run pm2 --env=production`            | Start production server with PM2          |
| `npm run deploy:heroku`                   | Update Heroku app                         |
| `npm run deploy:server`                   | Deploy app into server                    |
| `npm run gulp`                            | Start browsersync & sass                  |
| `npm run webpack`                         | Start webpack                             |


## Structure

- `app/`
- `client/`
- `cms/`
- `core/`
- `public/` - HTTP Public folder
- `Procfile` - Heroku entry point
- `README.md`
- `app.js` - Server entry point
- `deploy.sh` - Script to run after deployment to set manuality your config
- `nodemon.json` - Nodemon entry point


## Your App Folder

### Config
You can create any config enviroments as needed. By default, vulcano runs with NODE_ENV=development, in development mode. In productions servers, you should change NODE_ENV to _production_.

#### connections.js

#### local.js

#### policies.js

#### routes.js

#### server.js

### Controllers

### Helpers

#### Filters

### Models

### Responses

#### vsr.js

### Services

#### ActiveRecord.js

#### AppController.js

#### Filter.js

#### Jwt.js (Json Web Token)

#### Paginate.js

#### Upload.js

#### VSError.js

### Views.js

#### _shared

##### Errors

##### Partials

##### Templates
