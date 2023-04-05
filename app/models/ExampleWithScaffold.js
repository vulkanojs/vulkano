/**
 * ExampleWithScaffold.js
 */

module.exports = {

  /**
   * Fields
   */
  attributes: {
    name: {
      type: String,
      required: true
    },
    age: {
      type: Number,
      required: false,
      validate: {
        validator: (value) => {
          const isValid = (value >= 21) ? true : false;
          return isValid;
        },
        message: 'Invalid Age: Must be +21.',
      }
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
