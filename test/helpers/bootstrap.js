require('dotenv').config();

process.env.PORT = process.env.TEST_PORT || '8199';
process.env.NODE_ENV = 'test';

// The @vulkano/core's loadDatabaseApplication()
// skips mongoose.connect() entirely when settings.database.connection is
// falsy (see node_modules/@vulkano/core/database/mongodb.js), so tests boot
// with no database by default. If a model is added later and needs one,
// set TEST_MONGO_URI to a dedicated test database — never MONGO_URI
// (dev/prod) — see references/AGENTS/TESTING.md § Environment.
if (process.env.TEST_MONGO_URI) {
  process.env.MONGO_URI = process.env.TEST_MONGO_URI;
} else {
  delete process.env.MONGO_URI;
}

const vulkano = require('@vulkano/core');

// Shared across every test file: with `isolate: false` (vitest.config.mjs)
// all files run in one module registry, so this state survives between them.
if (!global.__vulkanoBootState) {
  global.__vulkanoBootState = {
    bootPromise: null,
    ready: false
  };
}

module.exports.waitForReady = () => {
  if (global.__vulkanoBootState.ready) {
    return Promise.resolve();
  }

  if (!global.__vulkanoBootState.bootPromise) {
    // startVulkano() takes no arguments — it's an `async function`, so the
    // promise it returns is the actual readiness signal. DB connection and
    // global model registration (loadDatabase/loadControllers) happen
    // before that promise resolves, which is everything model tests need.
    global.__vulkanoBootState.bootPromise = vulkano().then(() => {
      global.__vulkanoBootState.ready = true;
    });
  }

  return global.__vulkanoBootState.bootPromise;
};

module.exports.default = module.exports.waitForReady;
