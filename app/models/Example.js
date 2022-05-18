/* global Example */

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
    },
    active: {
      type: Boolean,
      default: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },

  // Custom Index
  indexes: [
    {
      name: 'text'
    }
  ],

  /**
   * Method to get all records by page
   *
   * @param {Object} props (page, perPage, search, sort)
   * @returns {Promise}
   */
  getAll(props) {

    // Props to Query
    const defaultProps = {
      sort: 'createdAt|DESC',
      searchBy: ['name'],
      filter: {
        active: true
      },
    };

    // Populate
    const populate = [];

    // Query to Run
    const query = Paginate.serializeQuery(defaultProps, props);

    // Pagination
    return Paginate.get(Example, query, populate);

  },

  /**
   * Method to get a record by id
   *
   * @param {ObjectID} id
   * @returns {Promise}
   */
  getExample(_id) {

    // This is to prevent error while run the findOne
    if (!(/^[a-fA-F0-9]{24}$/).test(_id)) {
      return VSError.reject('Invalid ID. Record not found', 404);
    }

    return Example.findOne({ _id })
      .then( (r) => {

        if (!r) {
          return VSError.notFound();
        }

        return r.toObject({ transform: true });

      });

  },

  /**
   * Method to create a new record
   * @param {Promise} data
   */
  create(data) {

    const obj = new Example(data);
    return obj.save();

  },

  /**
   * Method to update a record
   * @param {ObjectID} id
   * @param {Object} data
   * @returns {Promise}
   */
  update(_id, data) {

    return Example.getExample(_id)
      .then( (record) => {

        // Merge current info with incoming values
        const merged = { ...record, ...data };

        return Example
          .findOneAndUpdate({ _id }, merged, { new: true })
          .then( (r) => {

            const tmp = r.toObject({ transform: true });
            return tmp;

          });

      });

  },

  /**
   * Method to delete a record
   * @param {ObjectID} id
   * @returns {Promise}
   */
  delete(id) {

    // Soft delete
    return this.update(id, { active: false });

  },

  /**
   * Before save callback
   * @param {Callback} cb
   */
  beforeSave(cb) {

    const data = this;

    console.log('Running callback before save');
    console.log(data);

    // All good!
    cb();

  },

  /**
   * Callback after save
   * @param {Callback} cb
   */
  afterSave(data, cb) {

    console.log('Running callback after save');
    console.log(data);

    // All good!
    cb();

  },

};
