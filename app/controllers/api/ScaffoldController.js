/*
 * This endpoint is protected by JWT, please disabled it to test
 */

module.exports = {

  // Extend methods of Scaffold Controller
  scaffold: true,

  // Allowed methods
  allowedMethods: ['get', 'post', 'put', 'delete'],

  // Model to CRUD (create, read, update and delete) records
  model: 'ExampleWithScaffold'

};
