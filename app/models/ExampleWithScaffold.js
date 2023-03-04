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
  },

  // Scaffold (ModelName) - Allowed Methods:
  // ExampleWidthScaffold.getAllExampleWidthScaffold(props)
  // ExampleWidthScaffold.getAll(props) (alias to getAllModelName)
  // ExampleWidthScaffold.create(payload)
  // ExampleWidthScaffold.getByField(email, 'email') (alias)
  // ExampleWidthScaffold.getExampleWidthScaffold(id)
  // ExampleWidthScaffold.update(id, payload)
  // ExampleWidthScaffold.delete(id)

};
