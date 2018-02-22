const _ = require('underscore');

module.exports = {

  // Array of elements
  items: [],

  // Current cursor or records
  cursor: 1,

  // Page number
  page: 1,

  // Items per page
  per_page: 20,

  // Next page
  next: false,

  // Prev page
  prev: false,

  // Total pages
  total_pages: 0,

  // Total items
  total_items: 0,

  serializeQuery: function (_props, query) {

    const props = typeof _props === 'object' ? _props : {sort: null, search: []};
    const page = query.page || 1;
    const per_page = Number(query.per_page) || 30;
    const fields = query.fields || props.fields || [];
    const sort = query.sort || props.sort || null;
    const search = query.search || null;
    const result = _.omit({page, per_page, fields, sort, search}, (value) => {
      return !value;
    });

    // Filter by search
    if (search) {
      let searchBy = props.searchBy || [];
      let items = [];
      searchBy.forEach( (item) => {
        let row = {};
        row[item] = new RegExp(search, 'i');
        items.push(row);
      });
      if (items.length > 0) {
        result.search = { $or: items };
      }
    }

    return Object.assign(result, props.filter || {});

  },

  // Convert records to paginate
  get: function (Model, criteria, populate, cb) {

    if (typeof populate === 'function') {
      cb = populate;
      populate = [];
    } else if (populate === undefined) {
      populate = [];
    }

    // Current instance
    var _this = this;

    // Setup
    _this.page = criteria.page === 'all' ? 'all' : (parseInt(criteria.page) || 1);
    _this.per_page = parseInt(criteria.per_page) || 50;

    delete criteria.page;
    delete criteria.per_page;

    var fields = [];
    if (typeof criteria.fields === 'array') {
      fields = criteria.fields;
    } else if (typeof criteria.fields === 'string') {
      fields = (criteria.fields) ? criteria.fields.split(',') : [];
    }
    delete criteria.fields;

    var tmpSort = (criteria.sort || '').split(',');
    var sort = {sort: {}};
    _.each(tmpSort, function (part) {
      part = (part || '').split('|');
      if (part.length > 1) {
        sort.sort[part[0].trim()] = part[1].trim().toLowerCase();
      }
    });

    delete criteria.sort;

    if(criteria.search) {
      criteria = _.extend(criteria, criteria.search);
      delete criteria.search;
    }

    if (_this.page === 'all') {

      var optPopulate = [];
      if (populate.length > 0) {
        _.each(populate, function (item) {
          var tmp = {path: item.collection};
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

      return Model.find(_.extend(criteria, {}), fields.join(' '), _.extend(sort, {populate: optPopulate}));

    } else {

      return Model.count(_.extend(criteria, {})).then(function (total) {

        var opts = {page: _this.page, limit: _this.per_page};

        if (fields.length > 0) {
          opts.select = fields.join(' ');
        }
        ;

        if (populate.length > 0) {

          opts.populate = [];
          _.each(populate, function (item) {
            var tmp = {path: item.collection};
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

        return Model.paginate(_.extend(criteria, {}), _.extend(opts, sort)).then(function (data) {
          return _this._set(total, data.docs);
        });

      });
    }

  },

  _set: function (total, items) {

    var _this = this;
    _this.items = items;
    _this.cursor = (_this.page > 1) ? ((_this.page * _this.per_page) - (_this.per_page - 1)) : 1;
    _this.current = _this.page;

    _this.next = (((_this.per_page * (_this.page - 1)) + _this.per_page) <= total) ? (_this.page + 1) : false;
    _this.prev = (_this.page > 1) ? (_this.page - 1) : false;
    _this.total_pages = Math.ceil(total / _this.per_page);

    if ((_this.total_pages < _this.current) && (total > 0)) {
      _this.prev = false;
    }

    _this.cursor = (total >= _this.cursor) ? _this.cursor : 1;
    _this.total_items = total;

    return {
      items: _this.items,
      cursor: _this.cursor,
      page: _this.current,
      per_page: _this.per_page,
      next: _this.next,
      prev: _this.prev,
      total_pages: _this.total_pages,
      total_items: _this.total_items
    };

  }

};
