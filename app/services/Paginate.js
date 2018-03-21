/* global Paginate, Utils */

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
  total_pages: 0,

  // Total items
  total_items: 0,

  serializeQuery: (_props, query) => {

    const props = typeof _props === 'object' ? _props : { sort: null, search: [] };
    const page = query.page || 1;
    const perPage = Number(query.per_page) || 30;
    const fields = query.fields || props.fields || [];
    const sort = query.sort || props.sort || null;
    const search = query.search || null;
    const result = _.omit({
      page,
      perPage,
      fields,
      sort,
      search
    }, value => !value );

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

    return Object.assign(result, props.filter || {});

  },

  // Convert records to paginate
  get: (Model, query, populate) => {

    let criteria = query || {};

    // Current instance
    const _this = Paginate;

    // Setup
    _this.page = criteria.page === 'all' ? 'all' : ( parseInt(criteria.page, 10) || 1);
    _this.perPage = +criteria.per_page || 50;

    delete criteria.page;
    delete criteria.per_page;

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

    if (_this.page === 'all') {

      const optPopulate = [];
      if (populate.length > 0) {
        populate.forEach( (item) => {
          const tmp = { path: item.collection };
          if (item.fields) {
            tmp.select = item.fields;
          }
          if (item.select) {
            tmp.select = item.select;
          }
          if (item.match) {
            tmp.match = item.match;
          }
          optPopulate.push(tmp);
        });

      }

      const queryModel = _.extend(criteria, {});
      const optsModel = _.extend(sort, { populate: optPopulate });
      return Model.find(queryModel, fields.join(' '), optsModel);

    }

    return Model.count(_.extend(criteria, {})).then( (total) => {

      const opts = { page: _this.page, limit: _this.perPage };

      if (fields.length > 0) {
        opts.select = fields.join(' ');
      }

      if (populate.length > 0) {

        opts.populate = [];
        populate.forEach( (item) => {
          const tmp = { path: item.collection };
          if (item.fields) {
            tmp.select = item.fields;
          }
          if (item.select) {
            tmp.select = item.select;
          }
          if (item.match) {
            tmp.match = item.match;
          }
          opts.populate.push(tmp);
        });

      }

      const criteriaModel = _.extend(criteria, {});
      const optsModel = _.extend(opts, sort);
      return Model.paginate(criteriaModel, optsModel).then( data => _this._set(total, data.docs) );

    });

  },

  _set: (total, items) => {

    const _this = Paginate;
    _this.items = items;
    _this.cursor = (_this.page > 1) ? ((_this.page * _this.perPage) - (_this.perPage - 1)) : 1;
    _this.current = _this.page;

    const tmpNext = (((_this.perPage * (_this.page - 1)) + _this.perPage) <= total);
    _this.next = tmpNext ? (_this.page + 1) : false;
    _this.prev = (_this.page > 1) ? (_this.page - 1) : false;
    _this.total_pages = Math.ceil(total / _this.perPage);

    if ((_this.total_pages < _this.current) && (total > 0)) {
      _this.prev = false;
    }

    _this.cursor = (total >= _this.cursor) ? _this.cursor : 1;
    _this.total_items = total;

    return {
      items: _this.items,
      cursor: _this.cursor,
      page: _this.current,
      per_page: _this.perPage,
      next: _this.next,
      prev: _this.prev,
      total_pages: _this.total_pages,
      total_items: _this.total_items
    };

  }

};
