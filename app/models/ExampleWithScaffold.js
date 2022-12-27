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

  // Scaffold - Allowed Methods:
  // ModelName.getAll(props)
  // ModelName.create(payload)
  // ModelName.getModelName(id)
  // ModelName.update(id, payload)
  // ModelName.delete(id)

};
