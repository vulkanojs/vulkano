module.exports = {

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
      searchBy: [],
      filter: {
        active: true
      },
    };

    // Query to Run
    const query = Paginate.serializeQuery(defaultProps, props);

    // Pagination
    return Paginate.get(this, query);

  },

  /**
   * Method to get a record by id
   *
   * @param {ObjectID} id
   * @returns {Promise}
   */
  getByField(value, field) {

    // This is to prevent error while run the findOne
    if (!(/^[a-fA-F0-9]{24}$/).test(value) && !field) {
      return VSError.reject('Invalid ID. Record not found.', 404);
    }

    const toSearch = { active: true };
    toSearch[field || '_id'] = value;

    return this.findOne(toSearch)
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

    const obj = new this(data);
    return obj.save();

  },

  /**
   * Method to update a record
   * @param {ObjectID} id
   * @param {Object} data
   * @returns {Promise}
   */
  update(_id, data) {

    return this.getByField(_id)
      .then( (record) => {

        // Merge current info with incoming values
        const merged = {
          ...record,
          ...data,
          updatedAt: Date.now()
        };

        return this.findOneAndUpdate({ _id }, merged, { new: true })
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

    // Scaffold Model
    // const Model = global[modelName];

    // Soft delete
    return this.update(id, { active: false });

  }

};
