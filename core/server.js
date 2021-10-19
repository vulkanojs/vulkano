/**
 * Server.js
 */

const express = require('express');
const frameguard = require('frameguard');
const socketio = require('socket.io');
const nunjucks = require('nunjucks');
const morgan = require('morgan');
const compression = require('compression');
const multer = require('multer');
const helmet = require('helmet');
const timeout = require('connect-timeout');
const useragent = require('express-useragent');
const webp = require('webp-middleware');
const cookieParser = require('cookie-parser');

// Include all api controllers
const AllControllers = require('include-all')({
  dirname: `${APP_PATH}/controllers`,
  filter: /(.+Controller)\.js$/,
  optional: true
});
const responses = require('./responses');
const JWT = require('../app/services/Jwt');

module.exports = {

  routes: {},

  start: function loadServerApplication(cb) {

    const jwtMiddleware = JWT;

    const {
      cors,
      jwt,
      settings,
      sockets,
      cookies
    } = app.config;

    const {
      express: expressUserConfig
    } = settings || {};

    const expressConfig = expressUserConfig || {};
    const views = app.server.views || {};
    const port = process.env.PORT || settings.port || expressConfig.port || 5000;

    // Middleware
    const middleware = app.config.middleware || ((req, res, next) => {
      next();
    });

    const server = express();

    // Settings
    server.enable('trust proxy');

    // ---------------
    // PORT
    // ---------------
    server.set('port', port);

    // ---------------
    // MULTER
    // ---------------
    const multerDefault = { dest: expressConfig.uploadPath || 'public/files' };
    const multerCustom = expressConfig.multer ? expressConfig.multer : {};
    const upload = multer({ ...multerDefault, ...multerCustom });

    // ---------------
    // MORGAN
    // ---------------
    const morganDefault = {
      format: 'dev',
      skip: ((req, res) => res.statusCode < 400)
    };

    const morganCustom = expressConfig.morgan ? expressConfig.morgan : {};
    const morganConfig = { ...morganDefault, ...morganCustom };
    server.use(morgan(morganConfig.format, morganConfig));

    // ---------------
    // USER AGENT
    // ---------------
    server.use(useragent.express());

    // ---------------
    // COMPRESSION
    // ---------------
    server.use(compression( expressConfig.compression || {} ));

    // ---------------
    // COOKIES
    // ---------------
    if (cookies && cookies.enabled) {
      const cookiesSecretKey = cookies && cookies.secret ? cookies.secret : '';
      server.use(cookieParser(cookiesSecretKey));
    }

    // ---------------
    // EXPRESS JSON
    // ---------------
    const expressJSONDefault = {};
    const expressJSONCustom = expressConfig.json ? expressConfig.json : {};
    server.use(express.json( { ...expressJSONDefault, ...expressJSONCustom } ));

    // ---------------
    // EXPRESS FORM DATA
    // ---------------
    const urlencodedDefault = { extended: true };
    const urlencodedCustom = expressConfig.urlencoded ? expressConfig.urlencoded : {};
    server.use(express.urlencoded({ ...urlencodedDefault, ...urlencodedCustom }));

    // ---------------
    // HELMET
    // ---------------
    const helmetDefault = { contentSecurityPolicy: false };
    const helmetCustom = expressConfig.helmet ? expressConfig.helmet : {};
    server.use(helmet( { ...helmetDefault, ...helmetCustom } ));

    // ---------------
    // RESPONSES
    // ---------------
    server.use(responses);

    // ---------------
    // WEBP MIDDLEWARE (PUBLIC PATH)
    // ---------------
    if ( app.config.webp.enabled) {
      const cacheDir = `${process.cwd()}/public/cache-webp`;
      const webpConfig = {
        quality: app.config.webp.quality || 80,
        preset: app.config.webp.preset || 'photo',
        cacheDir: app.config.webp.cacheDir || cacheDir
      };
      server.use(webp(`${process.cwd()}/public`, webpConfig));
    }

    // ---------------
    // PUBLIC PATH
    // ---------------
    server.use(express.static(`${process.cwd()}/public`));

    // ---------------
    // FRAMEGUARD
    // ---------------
    if (expressConfig.frameguard) {
      if (Array.isArray(expressConfig.frameguard)) {
        expressConfig.frameguard.forEach( (frame) => {
          server.use(frameguard(frame));
        });
      } else {
        server.use(frameguard(expressConfig.frameguard));
      }
    }

    // ---------------
    // PROTOCOL & POWERED BY
    // ---------------
    server.use( (req, res, next) => {

      const proto = req.secure ? 'https' : 'http';
      const forwarded = req.headers['x-forwaded-proto'] || null;
      const currentProtocol = (forwarded || proto).split('://')[0];
      req.protocol = currentProtocol;

      if (expressConfig.poweredBy) {
        res.setHeader('X-Powered-By', expressConfig.poweredBy);
      }

      next();

    });

    // ---------------
    // REQUEST OPTIONS
    // ---------------
    server.options('*', (req, res) => {

      // ---------------
      // CORS
      // ---------------
      if (cors.enabled) {
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

    // ---------------
    // VIEWS
    // ---------------
    server.set('views', views.path);

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

    // ---------------
    // TIMEOUT
    // ---------------
    server.use(timeout( expressConfig.timeout || 120000 ));
    server.use( (req, res, next) => {
      if (!req.timedout) {
        next();
      }
    });

    // ---------------
    // JWT
    // ---------------
    if (jwt.enabled) {

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

    // ---------------
    // CORS
    // ---------------
    if (cors.enabled) {

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

    // ---------------
    // ROUTES
    // ---------------

    const {
      routes
    } = app;

    let method;
    let pathToRoute;
    let handler;

    Object.keys(routes).forEach((route) => {

      const parts = route.split(' ');

      const [
        methodToRun,
        pathToRun
      ] = parts;

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

      const [
        moduleToRun,
        controllerToRun,
        actionToRun
      ] = fullPath;

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

      let toExecute = null;

      try {
        toExecute = module
          ? (AllControllers[module][controller][action])
          : AllControllers[controller][action];
      } catch (e) {
        toExecute = null;
      }

      if (toExecute) {
        if (option === 'post') {
          server[option](pathToRun || '/', upload.any(), middleware, toExecute);
        } else {
          server[option](pathToRun || '/', middleware, toExecute);
        }
      } else {
        console.error('\x1b[31mError:', 'Controller not found in', (module) ? `${module}.${controller}.${action}` : `${controller}.${action}`, '\x1b[0m');
      }

    });

    // ---------------
    // ERROR 404
    // ---------------
    server.use((req, res) => {
      if (+res.statusCode >= 500 && +res.statusCode < 600) {
        throw new Error();
      }
      res.status(404).render(`${views.path}/_shared/errors/404.html`);
    });

    // ---------------
    // ERROR 5XX
    // ---------------
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

    // ---------------
    // SOCKETS
    // ---------------
    if (sockets.enabled) {

      const io = socketio.listen(server.listen(port));

      io.set('heartbeat timeout', +sockets.timeout || 4000);
      io.set('heartbeat interval', +sockets.interval || 2000);

      if (sockets.cors) {
        io.origins( sockets.cors);
      }

      // next line is the money
      global.io = io;
      server.set('socketio', io);
      io.on('connection', (socket) => {

        if ( typeof sockets.onConnect === 'function') {
          sockets.onConnect(socket);
        }

        const socketEvents = sockets.events || {};

        Object.keys(socketEvents).forEach( (i) => {

          const checkPath = socketEvents[i] || '';

          let toExecute = null;
          let module = null;
          let controller = null;
          let action = null;

          if (typeof checkPath === 'function') {

            toExecute = checkPath;

          } else {

            const fullPath = checkPath.split('.');

            if (fullPath.length > 2) { // Has folder

              [
                module,
                controller,
                action
              ] = fullPath;

            } else {

              [
                controller,
                action
              ] = fullPath;

            }

            try {
              toExecute = module
                ? (AllControllers[module][controller][action])
                : AllControllers[controller][action];
            } catch (e) {
              toExecute = null;
            }

          }

          if (toExecute) {
            socket.on(i, (body) => {
              toExecute({ socket, body: body || {} });
            });
          } else {
            console.error('\x1b[31mError:', 'Controller not found in', (module) ? `${module}.${controller}.${action}` : `${controller}.${action}`, '\x1b[0m', 'to socket event', i);
          }

        });

        server.set('socket', socket);
        app.socket = socket;

      });

      app.server = server;

      cb();
      return;
    }

    // ---------------
    // START SERVER
    // ---------------
    server.listen(server.get('port'), () => {
      app.server = {
        ...app.server,
        ...server
      };
      cb();
    });

  }

};
