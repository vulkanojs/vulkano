/* global __dirname, app */

/**
 * Server.js
 */
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const _ = require('underscore');
const nunjucks = require('nunjucks');
const ejs = require('ejs');
const path = require('path');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const compression = require('compression');
const multer = require('multer');
const helmet = require('helmet');
const responses = require('./responses');

// Include all api controllers
const AllControllers = require('include-all')({
  dirname: path.normalize(path.join(__dirname, '../app/controllers')),
  filter: /(.+Controller)\.js$/,
  optional: true
});

module.exports = {

  port: 5000,

  routes: {},

  start: function (cb) {

    const jwtMiddleware = require('../app/services/Jwt');
    const cors = app.config.cors || {};
    const jwt = app.config.jwt || {};
    const views = app.server.views || {};
    const port = process.env.PORT || parseInt(app.server.port) || 5000;
    const sockets = app.server.sockets || {};

    // Middleware
    const middleware = app.config.middleware || function (req, res, next) {
      next();
    };

    // Uploader
    const upload = multer({dest: app.server.uploadPath});

    const server = express();

    // Settings
    server.use(morgan('dev', {
      skip: function (req, res) {
        return res.statusCode < 400;
      }
    }));
    server.use(compression());
    server.use(bodyParser.json());
    server.use(bodyParser.urlencoded({extended: true}));
    server.use(helmet());
    server.use(responses);
    server.use(express.static(`${process.cwd()}/public`));
    server.options('*', function (req, res) {

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
        watch: app.PRODUCTION ? false : true
      });

      app.server.views._engine = envNunjucks;

      envNunjucks.addGlobal('app', app);

      if (views.globals && Array.isArray(views.globals)) {
        views.globals.forEach((global) => {
          for (let i in global) {
            envNunjucks.addGlobal(i, global[i]);
          }
        });
      }

      if (views.filters && Array.isArray(views.filters)) {
        views.filters.forEach((filter) => {
          for (let i in filter) {
            envNunjucks.addFilter(i, filter[i]);
          }
        });
      }

      if (views.extensions && Array.isArray(views.extensions)) {
        views.extensions.forEach((extension) => {
          for (let i in extension) {
            envNunjucks.addExtension(i, extension[i]);
          }
        });
      }
    } else {
      server.set('view engine', views.engine || 'ejs');
    }

    /**
     * Json Web Token
     */
    if (jwt.enable) {

      // JWT (secret key)
      server.use(jwt.path || '*', jwtMiddleware.init().unless({
        path: jwt.ignore || []
      }));

      // JWT  Handler error
      server.use(function (err, req, res, next) {
        if (err && err.name === 'UnauthorizedError') {
          res.status(401).jsonp({success: false, error: 'Invalid token'});
        }
      });

    }

    /**
     * CORS
     */
    if (cors.enable) {

      server.use(cors.path, function (req, res, next) {

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

    let routes = app.routes;
    let method;
    let path;
    let handler;
    for (let route in routes) {
      let parts = route.split(' ');
      if (parts.length > 1) {
        method = parts[0];
        path = parts[1];
      } else {
        method = parts[0];
      }
      handler = routes[route];
      if (method === 'post') {
        server[method](path, upload.any(), middleware, handler);
      } else {
        server[method](path, middleware, handler);
      }
    }

    for (let i in this.routes) {

      let fullPath = this.routes[i].split('.');
      let module, controller, action;
      if (fullPath.length > 2) { // Has folder
        module = fullPath[0];
        controller = fullPath[1];
        action = fullPath[2];
      } else {
        module = null;
        controller = fullPath[0];
        action = fullPath[1];
      }

      let parts = i.split(' ');
      let path = parts.pop();
      let option = (parts[0] !== undefined) ? parts[0].toLowerCase() : 'get';
      if (option !== 'get' && option !== 'post' && option !== 'put' && option !== 'delete') {
        option = 'get';
      }

      let toExecute = (module) ? (AllControllers[module][controller][action]) : AllControllers[controller][action];
      if (toExecute) {
        if (option === 'post') {
          server[option](path || '/', upload.any(), middleware, toExecute);
        } else {
          server[option](path || '/', middleware, toExecute);
        }
      } else {
        console.log('-----');
        console.error('Warning: Controller not found:', (module) ? module + '.' + controller + '.' + action : controller + '.' + action);
        console.log('-----');
      }

    }

    // HTTP 404
    server.use(function (req, res, next) {
      if (+res.statusCode >= 500 && +res.statusCode < 600)
        throw new Error();
      res.status(404).render(views.path + '/_shared/error/404.html');
    });

    // HTTP 5XX
    server.use(function (err, req, res, next) {
      let status = err.status || res.statusCode || 500;
      res.status(status);
      if (!res.xhr) {
        if (+status > 400 && +status < 500) {
          res.render(server.get('views') + '/_shared/errors/404.html', {content: err.stack});
        } else {
          res.render(server.get('views') + '/_shared/errors/500.html', {content: err.stack});
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
      io.on('connection', function (socket) {
        server.set('socket', socket);
      });

      app.server = server;

      cb();
    } else {
      server.listen(server.get('port'), function () {
        app.server = _.extend(app.server, server);
        cb();
      });
    }

    return;

  }

};
