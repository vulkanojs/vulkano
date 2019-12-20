/* global __dirname, app */

/**
 * Server.js
 */

const express = require('express');
const frameguard = require('frameguard');
const socketio = require('socket.io');
const _ = require('underscore');
const nunjucks = require('nunjucks');
const path = require('path');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const compression = require('compression');
const multer = require('multer');
const helmet = require('helmet');
const timeout = require('connect-timeout');
const useragent = require('express-useragent');
const webp = require('webp-middleware');

// Include all api controllers
const AllControllers = require('include-all')({
  dirname: path.normalize(path.join(__dirname, '../app/controllers')),
  filter: /(.+Controller)\.js$/,
  optional: true
});
const responses = require('./responses');
const JWT = require('../app/services/Jwt');

module.exports = {

  port: 5000,

  routes: {},

  start: function loadServerApplication(cb) {

    const jwtMiddleware = JWT;
    const { cors, jwt, settings } = app.config;
    const views = app.server.views || {};
    const port = process.env.PORT || app.server.port || 5000;
    const sockets = app.server.sockets || {};

    // Middleware
    const middleware = app.config.middleware || ((req, res, next) => {
      next();
    });

    // Uploader
    const upload = multer({ dest: app.server.uploadPath });
    const cacheDir = `${process.cwd()}/public/cache-webp`;

    const server = express();

    const webpConfig = {
      quality: 80,
      preset: 'photo',
      cacheDir
    };

    // Settings
    server.enable('trust proxy');
    server.use(morgan('dev', {
      skip: ((req, res) => res.statusCode < 400)
    }));
    server.use(useragent.express());
    server.use(compression());
    server.use(bodyParser.json());
    server.use(bodyParser.urlencoded({ extended: true }));
    server.use(helmet());
    server.use(responses);
    server.use(webp(`${process.cwd()}/public`, webpConfig));
    server.use(express.static(`${process.cwd()}/public`));
    server.use((req, res, next) => {
      const proto = req.connection.encrypted ? 'https' : 'http';
      const forwarded = req.headers['x-forwaded-proto'] || null;
      const currentProtocol = (forwarded || proto).split(/\s*,\s*/)[0];
      req.protocol = currentProtocol;
      next();
    });

    if (settings.config) {
      if (!settings.config.poweredBy) {
        server.disable('x-powered-by');
      }
      if (settings.config.frameguard) {
        if (Array.isArray(settings.config.frameguard)) {
          settings.config.frameguard.forEach( (frame) => {
            server.use(frameguard(frame));
          });
        } else {
          server.use(frameguard(settings.config.frameguard));
        }
      }
    }

    server.options('*', (req, res) => {

      /**
       * CORS
       */
      if (cors.enable) {
        let tmpCustomHeaders = ['X-Requested-With', 'X-HTTP-Method-Override', 'Content-Type', 'Accept'];
        tmpCustomHeaders = tmpCustomHeaders.concat(cors.headers || []);
        res.header('Access-Control-Allow-Origin', cors.origin);
        res.header('Access-Control-Allow-Headers', tmpCustomHeaders.join(', '));
      } else {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');
      }
      res.header('Allow', 'GET,PUT,POST,DELETE,OPTIONS');
      res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');

      res.status(200).end();

    });

    // Set Port
    server.set('port', port);

    // Set Views
    server.set('views', views.path);
    if (views.engine === 'nunjucks') {
      const envNunjucks = nunjucks.configure(views.path, {
        express: server,
        autoescape: true,
        watch: !app.PRODUCTION
      });

      app.server.views._engine = envNunjucks;

      envNunjucks.addGlobal('app', app);

      if (views.globals && Array.isArray(views.globals)) {
        views.globals.forEach((global) => {
          Object.keys(global || []).forEach((i) => {
            envNunjucks.addGlobal(i, global[i]);
          });
        });
      }

      if (views.filters && Array.isArray(views.filters)) {
        views.filters.forEach((filter) => {
          Object.keys(filter || []).forEach((i) => {
            envNunjucks.addFilter(i, filter[i]);
          });
        });
      }

      if (views.extensions && Array.isArray(views.extensions)) {
        views.extensions.forEach((extension) => {
          Object.keys(extension || []).forEach((i) => {
            envNunjucks.addExtension(i, extension[i]);
          });
        });
      }
    } else {
      server.set('view engine', views.engine || 'ejs');
    }

    function haltOnTimedout(req, res, next) {
      if (!req.timedout) {
        next();
      }
    }
    server.use(timeout(app.server.timeout !== undefined ? app.server.timeout : 120000));
    server.use(haltOnTimedout);


    /**
     * Json Web Token
     */
    if (jwt.enable) {

      // JWT (secret key)
      server.use(jwt.path || '*', jwtMiddleware.init().unless({
        path: jwt.ignore || []
      }));

      // JWT  Handler error
      server.use((err, req, res, next) => {
        if (err && err.name === 'UnauthorizedError') {
          res.status(401).jsonp({ success: false, error: 'Invalid token' });
        } else {
          next();
        }
      });

    }

    /**
     * CORS
     */
    if (cors.enable) {

      server.use(cors.path, (req, res, next) => {

        // Enable CORS.
        let tmpCorsHeaders = ['X-Requested-With', 'X-HTTP-Method-Override', 'Content-Type', 'Accept'];
        tmpCorsHeaders = tmpCorsHeaders.concat(cors.headers || []);

        res.header('Access-Control-Allow-Origin', cors.origin);
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
        res.header('Access-Control-Allow-Headers', tmpCorsHeaders.join(', '));

        // Disable CACHE in API resources.
        res.header('Cache-Control', 'no-cache, no-store, must-revalidate'); // HTTP 1.1.
        res.header('Pragma', 'no-cache'); // HTTP 1.0.
        res.header('Expires', '0'); // Proxies.

        next();

      });
    }

    const { routes } = app;
    let method;
    let pathToRoute;
    let handler;
    Object.keys(routes).forEach((route) => {

      const parts = route.split(' ');
      const [methodToRun, pathToRun] = parts;
      method = methodToRun;
      if (pathToRun) {
        pathToRoute = pathToRun;
      }
      handler = routes[route];
      if (method === 'post') {
        server[method](pathToRoute, upload.any(), middleware, handler);
      } else {
        server[method](pathToRoute, middleware, handler);
      }

    });

    Object.keys(this.routes || {}).forEach((i) => {

      const fullPath = this.routes[i].split('.');
      const [moduleToRun, controllerToRun, actionToRun] = fullPath;
      let module;
      let controller;
      let action;

      if (actionToRun) { // Has folder
        module = moduleToRun;
        controller = controllerToRun;
        action = actionToRun;
      } else {
        module = null;
        controller = moduleToRun;
        action = controllerToRun;
      }

      const parts = i.split(' ');
      const pathToRun = parts.pop();
      let option = (parts[0] !== undefined) ? parts[0].toLowerCase() : 'get';
      if (option !== 'get' && option !== 'post' && option !== 'put' && option !== 'delete') {
        option = 'get';
      }

      const runWithModule = (module) ? AllControllers[module] : AllControllers;
      const toExecute = runWithModule[controller][action];
      if (toExecute) {
        if (option === 'post') {
          server[option](pathToRun || '/', upload.any(), middleware, toExecute);
        } else {
          server[option](pathToRun || '/', middleware, toExecute);
        }
      } else {
        console.log('-----');
        console.error('Warning: Controller not found:', (module) ? `${module}.${controller}.${action}` : `${controller}.${action}`);
        console.log('-----');
      }

    });

    // HTTP 404
    server.use((req, res) => {
      if (+res.statusCode >= 500 && +res.statusCode < 600) {
        throw new Error();
      }
      res.status(404).render(`${views.path}/_shared/errors/404.html`);
    });

    // HTTP 5XX
    server.use((err, req, res) => {
      const status = err.status || res.statusCode || 500;
      res.status(status);
      if (!res.xhr) {
        if (+status > 400 && +status < 500) {
          res.render(`${server.get('views')}/_shared/errors/404.html`, { content: err.stack });
        } else {
          res.render(`${server.get('views')}/_shared/errors/500.html`, { content: err.stack });
        }
      } else {
        res.jsonp({
          success: false,
          error: err.message || err.error || err.invalidAttributes || err.toString() || 'Object Not Found',
          data: (app.PRODUCTION) ? {} : (err.stack || {})
        });
      }
    });

    // Server Start
    if (sockets.enable) {
      const io = socketio.listen(server.listen(port));

      // next line is the money
      server.set('socketio', io);
      io.on('connection', (socket) => {
        server.set('socket', socket);
      });

      app.server = server;

      cb();
      return;
    }

    server.listen(server.get('port'), () => {
      app.server = _.extend(app.server, server);
      cb();
    });

  }

};
