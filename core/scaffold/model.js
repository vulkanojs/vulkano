module.exports = (modelName) => {

  // console.log(modelName);
  const getModelName = `get${modelName}`;
  const getAllModelName = `getAll${modelName}`;

  return {

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

      const toSearch = {};
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

      return this.getById(_id)
        .then( (record) => {

          // Merge current info with incoming values
          const merged = {
            ...record,
            ...data,
            updatedAt: Date.now()
          };

          return this
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
     * ALIAS: getModelName
     * @param {ObjectID} id
     * @returns {Promise}
     */
    [getModelName](id) {

      return this.getByField(id);

    },

    /**
     * ALIAS: getById
     * @param {ObjectID} id
     * @returns {Promise}
     */
    getById(id) {

      return this.getByField(id);

    },

    /**
     * ALIAS: getAllModelName
     * @param {Object} props
     * @returns {Promise}
     */
    [getAllModelName](props) {

      return this.getAll(props);

    },

  };

};
