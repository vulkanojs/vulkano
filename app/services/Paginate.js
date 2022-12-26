const _ = require('underscore');

module.exports = {

  serializeQuery(_props, query) {

    const props = typeof _props === 'object'
      ? _props
      : { sort: null, search: [] };

    const page = query.page || 1;
    const perPage = Number(query.per_page) || Number(query.perPage) || 30;
    const fields = query.fields || props.fields || [];
    const sort = query.sort || props.sort || null;
    const search = query.search || props.search || null;
    const searchType = (query.searchType || '').toLowerCase().replace('-', '');

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

        if (searchType === 'startwith' || searchType === 'start') {
          row[item] = new RegExp(['^', Utils.accentToRegex(search), '*.'].join(''), 'i');
        } else if (searchType === 'endwith' || searchType === 'end') {
          row[item] = new RegExp(['.*', Utils.accentToRegex(search)].join(''), 'i');
        } else {
          row[item] = new RegExp(['.*', Utils.accentToRegex(search), '*.'].join(''), 'i');
        }

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
    const page = criteria.page === 'all' ? 'all' : ( parseInt(criteria.page, 10) || 1);
    const perPage = +criteria.per_page || +criteria.perPage || 50;

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
      tmpFields.forEach( (f) => {
        fields.push(f);
      });
    }
    delete criteria.fields;

    const tmpSort = (criteria.sort || '').split(',');
    const sort = { sort: {} };
    tmpSort.forEach( (_part) => {
      const part = (_part || '').split('|');
      if (part.length > 1) {
        const desc = part[1].trim().toLowerCase() === 'descending' ? 'desc' : '';
        const asc = part[1].trim().toLowerCase() === 'ascending' ? 'asc' : '';
        sort.sort[part[0].trim()] = asc || desc || part[1].trim().toLowerCase();
      }
    });

    delete criteria.sort;

    if (criteria.search) {
      criteria = _.extend(criteria, criteria.search);
      delete criteria.search;
    }

    const optPopulate = this.getPopulatedCollections(populate || []);
    const queryModel = _.extend(criteria, {});

    if (page === 'all') {

      const optsModel = _.extend(sort, { populate: optPopulate });
      return Model.find(queryModel, fields.join(' '), optsModel);

    }

    return Model
      .countDocuments(criteria)
      .then( (total) => {

        const opts = {
          page,
          limit: perPage
        };

        if (fields.length > 0) {
          opts.select = fields.join(' ');
        }

        opts.populate = optPopulate;

        const optsModel = _.extend(opts, sort);

        return Model
          .paginate(queryModel, optsModel)
          .then( (data) => this._set(total, data.docs, page, perPage) );

      });

  },

  _set(total, items, _page, _perPage) {

    const page = _page || 1;
    const perPage = _perPage || 30;

    let cursor = (page > 1) ? ((page * perPage) - (perPage - 1)) : 1;

    const tmpNext = (((perPage * (page - 1)) + perPage) <= total);
    const next = tmpNext ? (page + 1) : false;
    let prev = (page > 1) ? (page - 1) : false;
    const totalPages = Math.ceil(total / perPage);

    if ( (totalPages < page) && (total > 0) ) {
      prev = false;
    }

    cursor = (total >= cursor) ? cursor : 1;

    return {
      items,
      cursor,
      page,
      perPage,
      next,
      prev,
      totalPages,
      totalItems: total
    };

  }

};
