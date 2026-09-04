require('dotenv').config();

process.env.PORT = process.env.TEST_PORT || '8199';
process.env.NODE_ENV = 'test';

// Mandatory — never run tests against the same MONGO_URI as dev/prod. See reference/TESTING.md § Environment.
if (!process.env.TEST_MONGO_URI) {
  throw new Error(
    'TEST_MONGO_URI is not set. Refusing to run tests against MONGO_URI (dev/prod). ' +
      'Set TEST_MONGO_URI in .env to a dedicated test database first — see reference/TESTING.md § Environment.'
  );
}

process.env.MONGO_URI = process.env.TEST_MONGO_URI;

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
