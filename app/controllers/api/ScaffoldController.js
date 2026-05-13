/*
 * This endpoint is protected by JWT, please disable it to test
 */

module.exports = {

  // Extend methods of Scaffold Controller and Scaffold Model
  scaffold: true,

  // Allowed methods
  allowedMethods: ['get', 'post', 'put', 'delete'],

  // Model to CRUD (create, read, update, and delete) records
  model: 'ExampleWithScaffold'

};
