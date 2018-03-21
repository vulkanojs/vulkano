/**
 * Example.js
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
    }
  },

  indexes: [
    {
      name: 'text'
    }
  ]

};
