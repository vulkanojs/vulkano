/* global Utils */

const _ = require('underscore');

module.exports = {

  // Array of elements
  items: [],

  // Current cursor or records
  cursor: 1,

  // Page number
  page: 1,

  // Items per page
  perPage: 20,

  // Next page
  next: false,

  // Prev page
  prev: false,

  // Total pages
  totalPages: 0,

  // Total items
  total_items: 0,

  serializeQuery(_props, query) {

    const props = typeof _props === 'object'
      ? _props
      : { sort: null, search: [] };

    const page = query.page || 1;
    const perPage = Number(query.per_page) || Number(query.perPage) || 30;
    const fields = query.fields || props.fields || [];
    const sort = query.sort || props.sort || null;
    const search = query.search || null;

    const result = _.omit({
      page,
      perPage,
      fields,
      sort,
      search
    }, (value) => !value );

    // Filter by search
    if (search) {
      const searchBy = props.searchBy || [];
      const items = [];
      searchBy.forEach( (item) => {
        const row = {};
        row[item] = new RegExp(['.*', Utils.accentToRegex(search), '*.'].join(''), 'i');
        items.push(row);
      });
      if (items.length > 0) {
        result.search = { $or: items };
      }
    }

    return {
      ...result,
      ...props.filter || {}
    };

  },

  getPopulatedCollections(populate) {

    const optPopulate = [];

    if (populate.length > 0) {

      populate.forEach( (item) => {

        const {
          virtual,
          collection,
          path,
          model
        } = item;

        let populateProps = null;

        if (virtual) {
          populateProps = virtual;
        } else {

          populateProps = {
            path: collection || path || model
          };

          if (item.fields) {
            populateProps.select = item.fields;
          }
          if (item.select) {
            populateProps.select = item.select;
          }
          if (item.match) {
            populateProps.match = item.match;
          }

        }

        optPopulate.push(populateProps);

      });

    }

    return optPopulate;

  },

  // Convert records to paginate
  get(Model, query, hasPopulate) {

    const populate = hasPopulate || [];

    let criteria = query || {};

    // Setup
    this.page = criteria.page === 'all' ? 'all' : ( parseInt(criteria.page, 10) || 1);
    this.perPage = +criteria.per_page || +criteria.perPage || 50;

    delete criteria.page;
    delete criteria.per_page;
    delete criteria.perPage; // Fallback

    const fields = [];
    if (Array.isArray(criteria.fields)) {
      criteria.fields.forEach( (f) => {
        fields.push(f);
      });
    } else if (typeof criteria.fields === 'string') {
      const tmpFields = (criteria.fields) ? criteria.fields.split(',') : [];
      tmpFields.fields.forEach( (f) => {
        fields.push(f);
      });
    }
    delete criteria.fields;

    const tmpSort = (criteria.sort || '').split(',');
    const sort = { sort: {} };
    tmpSort.forEach( (_part) => {
      const part = (_part || '').split('|');
      if (part.length > 1) {
        sort.sort[part[0].trim()] = part[1].trim().toLowerCase();
      }
    });

    delete criteria.sort;

    if (criteria.search) {
      criteria = _.extend(criteria, criteria.search);
      delete criteria.search;
    }

    const optPopulate = this.getPopulatedCollections(populate || []);
    const queryModel = _.extend(criteria, {});

    if (this.page === 'all') {

      const optsModel = _.extend(sort, { populate: optPopulate });
      return Model.find(queryModel, fields.join(' '), optsModel);

    }

    return Model
      .countDocuments(criteria)
      .then( (total) => {

        const opts = {
          page: this.page,
          limit: this.perPage
        };

        if (fields.length > 0) {
          opts.select = fields.join(' ');
        }

        opts.populate = optPopulate;

        const optsModel = _.extend(opts, sort);

        return Model
          .paginate(queryModel, optsModel)
          .then( (data) => this._set(total, data.docs) );

      });

  },

  _set(total, items) {

    this.items = items;
    this.cursor = (this.page > 1) ? ((this.page * this.perPage) - (this.perPage - 1)) : 1;
    this.current = this.page;

    const tmpNext = (((this.perPage * (this.page - 1)) + this.perPage) <= total);
    this.next = tmpNext ? (this.page + 1) : false;
    this.prev = (this.page > 1) ? (this.page - 1) : false;
    this.totalPages = Math.ceil(total / this.perPage);

    if ((this.totalPages < this.current) && (total > 0)) {
      this.prev = false;
    }

    this.cursor = (total >= this.cursor) ? this.cursor : 1;
    this.total_items = total;

    return {
      items: this.items,
      cursor: this.cursor,
      page: this.current,
      perPage: this.perPage,
      next: this.next,
      prev: this.prev,
      totalPages: this.totalPages,
      totalItems: this.total_items
    };

  }

};
