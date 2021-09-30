<p align="center">
  <img src="https://avatars.githubusercontent.com/u/42077334?s=200&v=4" alt="Nodemon Logo">
</p>

# Vulkano

Vulkano is a small, simple, and fast framework for creating web applications using NodeJS. Inspired by KumbiaPHP.

[![Backers on Open Collective](https://opencollective.com/vulkanojs/backers/badge.svg)](#backers)
[![Sponsors on Open Collective](https://opencollective.com/vulkanojs/sponsors/badge.svg)](#sponsors)

## Backers

Thank you to all [our backers](https://opencollective.com/vulkanojs#backer)! 🙏

[![vulkano backers](https://opencollective.com/vulkanojs/tiers/backer.svg?avatarHeight=50)](https://opencollective.com/vulkanojs#backers)


## Stack

### API

- Node.js
- [Express](http://expressjs.com)
- [Mongoose](http://mongoosejs.com/)
- [Nunjucks](http://mozilla.github.io/nunjucks/) (Template Engine)
- [Nodemon](http://nodemon.io/) (Reload automatically for dev mode)
- [PM2](http://pm2.keymetrics.io/) (Deployment)
- [Gulp](https://gulpjs.com/) (Automate and enhance your workflow)
- [BrowserSync](https://www.browsersync.io/) (Time-saving synchronised browser testing)
- [WebPack](https://webpack.js.org/) (Bundle your scripts)

## Install

### System

- Unix
- Node.js v12+

### Packages

```bash
$ yarn install
```

## Workflow

| Command                         | Description                               |
| :------------------------------	| :---------------------------------------- |
| `npm run dev`                   | Run development server and watch changes	|
| `npm run start`                 | Start development server                  |
| `npm run gulp`                  | Start browsersync & sass                  |
| `npm run webpack`               | Start webpack                             |
| `npm run build`                 | Task to buils assets in production mode   |
| `npm run deploy:heroku`         | Update Heroku app                         |
| `npm run deploy:server`         | Deploy app into server                    |


## Structure

- `app/`
- `client/`
- `cms/`
- `core/`
- `public/` - HTTP Public folder
- `Procfile` - Heroku entry point
- `README.md`
- `app.js` - Server entry point
- `nodemon.json` - Nodemon entry point


## Your App Folder

### Config
You can create any config enviroments as needed. By default, vulcano runs with NODE_ENV=development, in development mode. In productions servers, you should change NODE_ENV to _production_.

#### connections.js

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
