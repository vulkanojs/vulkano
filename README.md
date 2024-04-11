<p align="center">
  <img src="https://avatars.githubusercontent.com/u/42077334?s=200&v=4" alt="Nodemon Logo">
</p>

# Vulkano

Vulkano is a small, simple, and fast framework for creating web applications using NodeJS.
Inspired by KumbiaPHP.

[![Backers on Open Collective](https://opencollective.com/vulkanojs/backers/badge.svg)](#backers)
[![Sponsors on Open Collective](https://opencollective.com/vulkanojs/sponsors/badge.svg)](#sponsors)

## Backers

Thank you to all [our backers](https://opencollective.com/vulkanojs#backer)! 🙏

[![vulkano backers](https://opencollective.com/vulkanojs/tiers/backer.svg?avatarHeight=50)](https://opencollective.com/vulkanojs#backers)


## Stack

### @vulkano/core

- Node.js
- [Express](http://expressjs.com)
- [Mongoose](http://mongoosejs.com/)
- [Nunjucks](http://mozilla.github.io/nunjucks/) (Template Engine)
- [Nodemon](http://nodemon.io/) (Reload automatically for dev mode)
- [PM2](http://pm2.keymetrics.io/) (Deployment)

## Install

### System

- Unix or WSL v2
- Node.js v20+

### Packages

```bash
$ bun install
```

## Workflow

| Command                         | Description                               |
| :------------------------------	| :---------------------------------------- |
| `bun run dev`                   | Run development server and watch changes	|

## Structure

- `app/`
  - `config/`
    - `env/`
    - `express/`
    - `locales/`
    - `views/`
  - `controllers/`
  - `models/`
  - `services/`
  - `views/`
- `public/` - HTTP Public folder
  - `css/` - HTTP Public folder
  - `files/` - HTTP Public folder
  - `fonts/` - HTTP Public folder
  - `img/` - HTTP Public folder
  - `js/` - HTTP Public folder
- `Procfile` - Heroku entry point
- `README.md`
- `app.js` - Server entry point
- `nodemon.json` - Nodemon entry point


## Your App Folder

Coming soon...
