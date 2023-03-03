/**
 * ExampleWithScaffold.js
 */

module.exports = {

  attributes: {
    name: {
      type: String,
      required: true
    },
    age: {
      type: Number,
      required: false
    },
    // the fields:
    // active, createdAt, updatedAt
    // was created automatically
  }

  // Scaffold (ModelName) - Allowed Methods:
  // ExampleWidthScaffold.getAllExampleWidthScaffold(props)
  // ExampleWidthScaffold.getAll(props) (alias)
  // ExampleWidthScaffold.create(payload)
  // ExampleWidthScaffold.getExampleWidthScaffold(id)
  // ExampleWidthScaffold.getByField(email, 'email') (alias)
  // ExampleWidthScaffold.getById(id) (alias)
  // ExampleWidthScaffold.update(id, payload)
  // ExampleWidthScaffold.delete(id)

};
