module.exports = {


  friendlyName: 'Builder',


  description: 'Build a declaritive Mongo query',


  cacheable: true,


  sync: true,


  inputs: {

    tree: {
      description: 'A tokenized tree representing the query values.',
      example: [[]],
      required: true
    }

  },


  exits: {

    success: {
      variableName: 'result',
      description: 'Done.'
    }

  },

  fn: function Builder(inputs, exits) {
    var _ = require('lodash');


    //   ██████╗ ██╗   ██╗███████╗██████╗ ██╗   ██╗
    //  ██╔═══██╗██║   ██║██╔════╝██╔══██╗╚██╗ ██╔╝
    //  ██║   ██║██║   ██║█████╗  ██████╔╝ ╚████╔╝
    //  ██║▄▄ ██║██║   ██║██╔══╝  ██╔══██╗  ╚██╔╝
    //  ╚██████╔╝╚██████╔╝███████╗██║  ██║   ██║
    //   ╚══▀▀═╝  ╚═════╝ ╚══════╝╚═╝  ╚═╝   ╚═╝
    //
    // A chainable interface that makes it easy to build complex query objects.
    var Query = function Query() {
      this._collection = '';
      this._fn = '';
      this._key = '';
      this._filter = {};
      this._sort = {};
      this._projection = {};
      this._values = {};
      this._pipeline = [];
      this._pipelineGrouping = [];
      this._skip = 0;
      this._limit = 0;

      this._options = {};
      return this;
    };

    // Construct a Query object
    // @return {this}
    Query.prototype.toObject = function toObject() {
      var query = {};

      // Find Queries
      if (this._fn === 'find') {
        query.find = this._collection;
        query.filter = this._filter;
        query.sort = this._sort;
        query.projection = this._projection;
        query.skip = this._skip;
        query.limit = this._limit;
      }

      // Distinct
      if (this._fn === 'distinct') {
        query.distinct = this._collection;
        query.key = this._key;
        query.query = this._filter;
      }

      // Aggregates
      if (this._fn === 'aggregate') {
        query.aggregate = this._collection;
        query.pipeline = this._pipeline;
      }

      // Count
      if (this._fn === 'count') {
        query.aggregate = this._collection;
        query.pipeline = [];

        // Build up the pipeline grouping
        var group = {};
        if (this._pipelineGrouping.length > 1) {
          var pipelineGrouping = {};
          _.each(this._pipelineGrouping, function buildGroup(attr) {
            pipelineGrouping[attr] = '$' + attr;
          });
          group._id = pipelineGrouping;

          // otherwise just set the _id field to the first grouping item
        } else {
          group._id = '$' + _.first(this._pipelineGrouping);
        }

        if (_.keys(this._filter).length) {
          query.pipeline.push({ '$match': this._filter });
        }

        // Add the SUM value
        group.count = { '$sum': 1 };

        // Add the grouping to the pipeline
        query.pipeline.push({ '$group': group });
      }

      // Insert
      if (this._fn === 'insert') {
        query.insert = this._collection;
        query.documents = [this._values];
      }

      // Update
      if (this._fn === 'update') {
        query.update = this._collection;
        query.updates = [];

        var update = {
          q: this._filter,
          u: { '$set': this._values },
          multi: true
        };

        query.updates.push(update);
      }

      // Delete
      if (this._fn === 'remove') {
        query.delete = this._collection;
        query.deletes = [];

        var del = {
          q: this._filter,
          limit: 0
        };

        query.deletes.push(del);
      }

      return query;
    };

    // Select
    // @param {Array} fields
    Query.prototype.select = function find(fields) {
      var self = this;

      // Set the FN
      this._fn = 'find';

      // If fields is a '*' then no projections are needed
      if (fields === '*') {
        return this;
      }

      if (!_.isArray(fields)) {
        fields = [fields];
      }

      _.each(fields, function setField(field) {
        self._projection[field] = 1;
      });

      return this;
    };

    // From
    // @param {String} collection
    Query.prototype.from = function find(collection) {
      this._collection = collection;
      return this;
    };

    // Count
    // @param {String} attributeNames
    Query.prototype.count = function count(attributeName) {
      this._fn = 'count';
      this._pipelineGrouping.push(attributeName);
      return this;
    };

    // Delete
    Query.prototype.del = function del() {
      this._fn = 'remove';
      return this;
    };

    // Insert
    // @param {Dictionary} values
    Query.prototype.insert = function insert(values) {
      this._fn = 'insert';
      this._values = _.merge({}, this._values, values);
      return this;
    };

    // Update
    // @param {Dictionary} values
    Query.prototype.update = function update(values) {
      this._fn = 'update';
      this._values = _.merge({}, this._values, values);
      return this;
    };

    // Where
    // @param {Dictionary} criteria
    Query.prototype.where = function where(attribute, modifier, value) {
      if (_.isUndefined(value)) {
        value = modifier;
        modifier = undefined;
      }

      if (modifier) {
        if (modifier !== 'like') {
          var filter = this._filter[attribute] || {};
          filter[normalizeModifier(modifier)] = normalizeValue(value, modifier);
          this._filter[attribute] = filter;

          // Else just normalize the value
        } else {
          this._filter[attribute] = normalizeValue(value, modifier);
        }
      } else {
        this._filter[attribute] = normalizeValue(value, modifier);
      }

      return this;
    };

    // Where In
    // @param {String} attribute
    // @param {Array} values
    Query.prototype.whereIn = function where(attribute, values) {
      var filter = {};
      filter[attribute] = { '$in': values };
      this._filter = _.merge({}, filter, this._filter);

      return this;
    };

    // Where Not
    // @param {String} attribute
    // @param {String} modifier
    // @param {String|Number} value
    Query.prototype.whereNot = function whereNot(attribute, modifier, value) {
      if (_.isUndefined(value)) {
        value = modifier;
        modifier = undefined;
      }

      if (modifier) {
        if (modifier !== 'like') {
          var filter = this._filter[attribute] || {};
          filter[normalizeModifier(modifier)] = normalizeValue(value, modifier);
          this._filter[attribute] = {
            '$not': filter
          };

          // Else just normalize the value
        } else {
          this._filter[attribute] = {
            '$not': normalizeValue(value, modifier)
          };
        }
      } else {
        this._filter[attribute] = {
          '$ne': normalizeValue(value, modifier)
        };
      }

      return this;
    };

    // Where Not In
    // @param {String} attribute
    // @param {Array} values
    Query.prototype.whereNotIn = function where(attribute, values) {
      var filter = {};
      filter[attribute] = { '$nin': values };
      this._filter = _.merge({}, filter, this._filter);

      return this;
    };

    // Distinct Aggregation
    Query.prototype.distinct = function distinct() {
      var values = _.map(arguments);

      // If only a single value was used, an optimized `distinct` query should
      // be used.
      if (values.length === 1) {
        this._fn = 'distinct';
        this._key = _.first(values);

        // Otherwise, an aggregation must be done
      } else {
        this._fn = 'aggregate';

        var condition = {};
        _.each(values, function buildAggregateCondition(attr) {
          condition[attr] = '$' + attr;
        });

        this._pipeline = [
          { '$group': { '_id': condition } }
        ];
      }

      return this;
    };

    // Group By Aggregation
    Query.prototype.groupBy = function groupBy() {
      this._fn = 'aggregate';

      var values = _.map(arguments);
      var condition = {};

      // If there is only a single group, set it on the ID
      if (values.length === 1) {
        this._options = {
          val: {
            '$group': {
              '_id': '$' + _.first(values)
            }
          }
        };

        // Otherwise make the group a dictionary
      } else {
        _.each(values, function buildAggregateCondition(attr) {
          condition[attr] = '$' + attr;
        });

        this._options = {
          val: {
            '$group': {
              '_id': condition
            }
          }
        };
      }

      return this;
    };

    // Limit
    // @param {Number} count
    Query.prototype.limit = function limit(count) {
      this._limit = count;
      return this;
    };

    // Skip
    // @param {Number} count
    Query.prototype.skip = function limit(count) {
      this._skip = count;
      return this;
    };

    // Sort
    // @param {String} attribute
    // @param {String} direction
    Query.prototype.sort = function sort(attribute, direction) {
      var sort = this._sort || {};

      // Normalize the direction to ensure it's always in the proper format
      if (direction === 'asc' || direction === 1) {
        direction = 1;
      } else if (direction === 'desc' || direction === -1) {
        direction = -1;
      } else {
        throw new Error('Syntax Error: Sort must use either asc or desc for direction');
      }

      sort[attribute] = direction;
      this._sort = sort;

      return this;
    };

    // And Where
    // @param {String} attribute
    // @param {String} attribute
    // @param {String|Number} value
    Query.prototype.andWhere = function andWhere(attribute, modifier, value) {
      var and;

      if (_.isUndefined(value)) {
        value = modifier;
        modifier = undefined;
      }

      // If passing in a nested criteria, just push it to the criteria
      if (arguments.length === 1 && _.isPlainObject(attribute)) {
        and = this._filter['$and'] || [];
        and.push(attribute);
        this._filter['$and'] = and;

        // Otherwise build up an OR clause
      } else {
        var filter = {};
        if (modifier) {
          if (modifier !== 'like') {
            var val = {};
            val[normalizeModifier(modifier)] = normalizeValue(value, modifier);
            value = val;

            // Else just normalize the value
          } else {
            value = normalizeValue(value, modifier);
          }
        }

        filter[attribute] = value;

        and = this._filter['$and'] || [];
        and.push(filter);

        this._filter['$and'] = and;
      }

      return this;
    };

    // Or Where
    // @param {String} attribute
    // @param {String} modifier
    // @param {String|Number} value
    Query.prototype.orWhere = function orWhere(attribute, modifier, value) {
      var or;

      if (_.isUndefined(value)) {
        value = modifier;
        modifier = undefined;
      }

      // If passing in a nested criteria, just push it to the criteria
      if (arguments.length === 1 && _.isPlainObject(attribute)) {
        or = this._filter['$or'] || [];
        or.push(attribute);
        this._filter['$or'] = or;

        // Otherwise build up an OR clause
      } else {
        var filter = {};
        if (modifier) {
          if (modifier !== 'like') {
            var val = {};
            val[normalizeModifier(modifier)] = normalizeValue(value, modifier);
            value = val;

            // Else just normalize the value
          } else {
            value = normalizeValue(value, modifier);
          }
        }

        filter[attribute] = value;

        or = this._filter['$or'] || [];
        or.push(filter);

        this._filter['$or'] = or;
      }

      return this;
    };

    // Or Where Not
    // @param {String} attribute
    // @param {String} modifier
    // @param {String|Number} value
    Query.prototype.orWhereNot = function orWhereNot(attribute, modifier, value) {
      var or;

      if (_.isUndefined(value)) {
        value = modifier;
        modifier = undefined;
      }

      // If passing in a nested criteria, just push it to the criteria
      if (arguments.length === 1 && _.isPlainObject(attribute)) {
        or = this._filter['$or'] || [];
        or.push(attribute);
        this._filter['$or'] = or;

        // Otherwise build up an OR clause
      } else {
        var filter = {};
        if (modifier) {
          var val = {};
          val[normalizeModifier(modifier)] = normalizeValue(value, modifier);
          value = val;
          filter[attribute] = {
            '$not': value
          };

          // Otherwise use $ne
        } else {
          filter[attribute] = {
            '$ne': value
          };
        }


        or = this._filter['$or'] || [];
        or.push(filter);

        this._filter['$or'] = or;
      }

      return this;
    };

    // Or Where Not In
    // @param {String} attribute
    // @param {String} modifier
    // @param {String|Number} value
    Query.prototype.orWhereIn = function orWhereNotIn(attribute, values) {
      var or;

      // If passing in a nested criteria, just push it to the criteria
      if (arguments.length === 1 && _.isPlainObject(attribute)) {
        or = this._filter['$or'] || [];
        or.push(attribute);
        this._filter['$or'] = or;

        // Otherwise build up an OR clause
      } else {
        var filter = {};
        filter[attribute] = { '$in': values };

        or = this._filter['$or'] || [];
        or.push(filter);

        this._filter['$or'] = or;
      }

      return this;
    };


    // Or Where Not In
    // @param {String} attribute
    // @param {String} modifier
    // @param {String|Number} value
    Query.prototype.orWhereNotIn = function orWhereNotIn(attribute, values) {
      var or;

      // If passing in a nested criteria, just push it to the criteria
      if (arguments.length === 1 && _.isPlainObject(attribute)) {
        or = this._filter['$or'] || [];
        or.push(attribute);
        this._filter['$or'] = or;

        // Otherwise build up an OR clause
      } else {
        var filter = {};
        filter[attribute] = { '$nin': values };

        or = this._filter['$or'] || [];
        or.push(filter);

        this._filter['$or'] = or;
      }

      return this;
    };


    //  ██████╗ ██╗   ██╗██╗██╗     ██████╗ ███████╗██████╗
    //  ██╔══██╗██║   ██║██║██║     ██╔══██╗██╔════╝██╔══██╗
    //  ██████╔╝██║   ██║██║██║     ██║  ██║█████╗  ██████╔╝
    //  ██╔══██╗██║   ██║██║██║     ██║  ██║██╔══╝  ██╔══██╗
    //  ██████╔╝╚██████╔╝██║███████╗██████╔╝███████╗██║  ██║
    //  ╚═════╝  ╚═════╝ ╚═╝╚══════╝╚═════╝ ╚══════╝╚═╝  ╚═╝
    //
    // Takes an analyzed tree and builds Mongo queries to fufill it.


    //  ╔╗ ╦ ╦╦╦  ╔╦╗  ╔═╗ ╦ ╦╔═╗╦═╗╦ ╦  ╔═╗╦╔═╗╔═╗╔═╗
    //  ╠╩╗║ ║║║   ║║  ║═╬╗║ ║║╣ ╠╦╝╚╦╝  ╠═╝║║╣ ║  ║╣
    //  ╚═╝╚═╝╩╩═╝═╩╝  ╚═╝╚╚═╝╚═╝╩╚═ ╩   ╩  ╩╚═╝╚═╝╚═╝
    //
    // Given a function, apply it to the query expression
    var buildQueryPiece = function buildQueryPiece(fn, expression, query) {
      // Ensure the value is always an array
      if (!_.isArray(expression)) {
        expression = [expression];
      }

      query[fn].apply(query, expression);
    };


    //  ╔╗╔╔═╗╦═╗╔╦╗╔═╗╦  ╦╔═╗╔═╗  ╔╦╗╔═╗╔╦╗╦╔═╗╦╔═╗╦═╗
    //  ║║║║ ║╠╦╝║║║╠═╣║  ║╔═╝║╣   ║║║║ ║ ║║║╠╣ ║║╣ ╠╦╝
    //  ╝╚╝╚═╝╩╚═╩ ╩╩ ╩╩═╝╩╚═╝╚═╝  ╩ ╩╚═╝═╩╝╩╚  ╩╚═╝╩╚═
    //
    // Changes RQL expression modifiers into Mongo modifiers
    var normalizeModifier = function normalizeModifier(modifier) {
      var map = {
        '>': '$gt',
        '>=': '$gte',
        '<': '$lt',
        '<=': '$lte',
        '<>': '$ne',
        '!': '$ne'
      };

      var normalizedModifier = modifier;

      if (map[modifier]) {
        normalizedModifier = map[modifier];
      }

      return normalizedModifier;
    };


    //  ╔╗╔╔═╗╦═╗╔╦╗╔═╗╦  ╦╔═╗╔═╗  ╦  ╦╔═╗╦  ╦ ╦╔═╗
    //  ║║║║ ║╠╦╝║║║╠═╣║  ║╔═╝║╣   ╚╗╔╝╠═╣║  ║ ║║╣
    //  ╝╚╝╚═╝╩╚═╩ ╩╩ ╩╩═╝╩╚═╝╚═╝   ╚╝ ╩ ╩╩═╝╚═╝╚═╝
    //
    // Modifies the value if needed to represent a mongo version based on either
    // the value type or the modifier.
    var normalizeValue = function normalizeValue(value, modifier) {
      // Start by checking the modifier. If the modifier is a LIKE then check
      // for any % signs in the value.
      var val;

      if (modifier === 'like') {
        if (value.charAt(0) === '%' && value.charAt(value.length - 1) === '%') {
          val = value.replace(/%/g, '');
        } else if (value.charAt(0) === '%' && value.charAt(value.length - 1) !== '%') {
          val = value.replace(/%/g, '') + '$';
        } else if (value.charAt(0) !== '%' && value.charAt(value.length - 1) === '%') {
          val = '^' + value.replace(/%/g, '');
        }

        value = { '$regex': val };
      }

      return value;
    };


    //  ╦ ╦╦ ╦╔═╗╦═╗╔═╗  ╔═╗═╗ ╦╔═╗╦═╗╔═╗╔═╗╔═╗╦╔═╗╔╗╔  ╔╗ ╦ ╦╦╦  ╔╦╗╔═╗╦═╗
    //  ║║║╠═╣║╣ ╠╦╝║╣   ║╣ ╔╩╦╝╠═╝╠╦╝║╣ ╚═╗╚═╗║║ ║║║║  ╠╩╗║ ║║║   ║║║╣ ╠╦╝
    //  ╚╩╝╩ ╩╚═╝╩╚═╚═╝  ╚═╝╩ ╚═╩  ╩╚═╚═╝╚═╝╚═╝╩╚═╝╝╚╝  ╚═╝╚═╝╩╩═╝═╩╝╚═╝╩╚═
    //
    // Builds up an array of values that can be passed into the where clause
    var whereBuilder = function whereBuilder(expr, expression) {
      // Handle KEY/VALUE pairs
      if (expr.type === 'KEY') {
        // Reset the expression for each new key, unless there was already a
        // modifier present.
        expression = expression.length > 1 ? [] : expression;
        expression.push(expr.value);
        return expression;
      }

      // Handle OPERATORS such as '>' and '<'
      if (expr.type === 'OPERATOR') {
        expression.push(expr.value);
        return expression;
      }

      // Set the value
      if (expr.type === 'VALUE') {
        expression.push(expr.value);
        return expression;
      }
    };


    //  ╦╔╗╔╔═╗╔═╗╦═╗╔╦╗  ╔╗ ╦ ╦╦╦  ╔╦╗╔═╗╦═╗
    //  ║║║║╚═╗║╣ ╠╦╝ ║   ╠╩╗║ ║║║   ║║║╣ ╠╦╝
    //  ╩╝╚╝╚═╝╚═╝╩╚═ ╩   ╚═╝╚═╝╩╩═╝═╩╝╚═╝╩╚═
    //
    // Builds an array of KEY/VALUE pairs to use as the insert clause.
    var insertBuilder = function insertBuilder(expr, expression) {
      var arr = [];

      // Handle KEY/VALUE pairs
      if (expr.type === 'KEY') {
        arr.push(expr.value);
        expression.push(arr);

        return expression;
      }

      // Set the VALUE pair
      if (expr.type === 'VALUE') {
        arr = _.last(expression);
        arr.push(expr.value);

        return expression;
      }
    };


    //  ╔═╗╦═╗╔╦╗╔═╗╦═╗  ╔╗ ╦ ╦  ╔╗ ╦ ╦╦╦  ╔╦╗╔═╗╦═╗
    //  ║ ║╠╦╝ ║║║╣ ╠╦╝  ╠╩╗╚╦╝  ╠╩╗║ ║║║   ║║║╣ ╠╦╝
    //  ╚═╝╩╚══╩╝╚═╝╩╚═  ╚═╝ ╩   ╚═╝╚═╝╩╩═╝═╩╝╚═╝╩╚═
    //
    // Process ORDER BY expressions
    var orderByBuilder = function orderByBuilder(expr, expression) {
      var arr = [];

      // Handle KEY/VALUE pairs
      if (expr.type === 'KEY') {
        arr.push(expr.value);
        expression.push(arr);

        return expression;
      }

      // Set the VALUE pair
      if (expr.type === 'VALUE') {
        arr = _.last(expression);
        arr.push(expr.value);

        return expression;
      }
    };


    //  ╦ ╦╔═╗╔╦╗╔═╗╔╦╗╔═╗  ╔╗ ╦ ╦╦╦  ╔╦╗╔═╗╦═╗
    //  ║ ║╠═╝ ║║╠═╣ ║ ║╣   ╠╩╗║ ║║║   ║║║╣ ╠╦╝
    //  ╚═╝╩  ═╩╝╩ ╩ ╩ ╚═╝  ╚═╝╚═╝╩╩═╝═╩╝╚═╝╩╚═
    //
    // Builds an array of KEY/VALUE pairs to use as the update clause
    var updateBuilder = function updateBuilder(expr, expression) {
      var arr = [];

      // Handle KEY/VALUE pairs
      if (expr.type === 'KEY') {
        arr.push(expr.value);
        expression.push(arr);

        return expression;
      }

      // Set the VALUE pair
      if (expr.type === 'VALUE') {
        arr = _.last(expression);
        arr.push(expr.value);

        return expression;
      }
    };


    //  ╔═╗╦ ╦╔═╗╔═╗╦╔═  ╔═╗╔═╗╦═╗  ╔╦╗╔═╗╔╦╗╦╔═╗╦╔═╗╦═╗╔═╗
    //  ║  ╠═╣║╣ ║  ╠╩╗  ╠╣ ║ ║╠╦╝  ║║║║ ║ ║║║╠╣ ║║╣ ╠╦╝╚═╗
    //  ╚═╝╩ ╩╚═╝╚═╝╩ ╩  ╚  ╚═╝╩╚═  ╩ ╩╚═╝═╩╝╩╚  ╩╚═╝╩╚═╚═╝
    //
    // Check for any embedded combinators (OR) or modifiers (NOT) in a single
    // expression set.
    var checkForModifiers = function checkForModifiers(expr, options) {
      var combinator;
      var modifiers = [];

      // Default to removing the values from the array
      // var strip = options && options.strip ? options.strip : true;
      options = _.defaults(options, { strip: true });

      // Normalize strip attibutes
      if (options.strip === true) {
        options.strip = '*';
      }

      // Check for any encoded combinators and remove them
      var cIdx = _.indexOf(expr, 'AND');
      if (cIdx > -1) {
        combinator = 'AND';
        if (options.strip && (options.strip === '*' || _.indexOf(options.strip, 'AND') > -1)) {
          _.pullAt(expr, cIdx);
        }
      }

      // Check for any modifiers added to the beginning of the expression.
      // These represent things like NOT. Pull the value from the expression
      (function checkForNot() {
        var mIdx = _.indexOf(expr, 'NOT');
        if (mIdx > -1) {
          modifiers.push('NOT');
          if (options.strip && (options.strip === '*' || _.indexOf(options.strip, 'NOT') > -1)) {
            _.pullAt(expr, mIdx);
          }
        }
      })();

      (function checkForIn() {
        var mIdx = _.indexOf(expr, 'IN');
        if (mIdx > -1) {
          modifiers.push('IN');
          if (options.strip && (options.strip === '*' || _.indexOf(options.strip, 'IN') > -1)) {
            _.pullAt(expr, mIdx);
          }
        }
      })();

      return {
        combinator: combinator,
        modifier: modifiers
      };
    };


    //  ╔╗ ╦ ╦╦╦  ╔╦╗  ╔═╗╦═╗╔═╗╦ ╦╔═╗╦╔╗╔╔═╗
    //  ╠╩╗║ ║║║   ║║  ║ ╦╠╦╝║ ║║ ║╠═╝║║║║║ ╦
    //  ╚═╝╚═╝╩╩═╝═╩╝  ╚═╝╩╚═╚═╝╚═╝╩  ╩╝╚╝╚═╝
    //
    // Given a set of expressions, create a nested expression.
    var buildGrouping = function buildGrouping(expressionGroup, modifier, query) {
      // Build a new Query object to get the nested criteria built up
      var _query = new Query();
      _query.select('*');

      // Figure out what the function should be by examining the first item
      // in the expression group. If it has any modifiers or combinators, grab
      // them. We do this so we know if the grouping should be negated or not.
      // ex: orWhereNot vs orWhere
      var modifiers = checkForModifiers(_.first(expressionGroup), {
        strip: ['NOT']
      });

      // Default the fn value to `orWhere` unless an AND modifier was
      // specifically set
      var fn = 'orWhere';

      if (modifier && _.isArray(modifier) && _.first(modifier) === 'AND') {
        fn = 'andWhere';
      }

      // Check the modifier to see if a different function other than
      // WHERE should be used. The most common is NOT.
      if (modifiers && modifiers.modifier.length) {
        if (modifiers.modifier.length === 1) {
          if (_.first(modifiers.modifier) === 'NOT') {
            fn = 'whereNot';
          }
          if (_.first(modifiers.modifier) === 'IN') {
            fn = 'whereIn';
          }
        }

        // If there are more than 1 modifier then we need to checkout
        // the combo. Usually it's a [NOT,IN] situation.
        // For now let's assume it will only ever be 2 items.
        if (modifiers.modifier.length > 1) {
          var first = _.first(_.pullAt(modifiers.modifier, 0));
          var second = _.first(_.pullAt(modifiers.modifier, 0));

          if (first === 'NOT' && second === 'IN') {
            // Push the NOT back on to the first expression
            _.first(expressionGroup).unshift('NOT');
          }
        }
      }

      // Process each expression in the group, building up a query as it goes.
      _.each(expressionGroup, function processGroupExpr(expr) {
        // default the _fn to `orWhere`
        var _fn = 'orWhere';

        // Check for any modifiers and combinators in this expression piece
        var modifiers = checkForModifiers(expr);

        // Check the modifier to see what fn to use
        if (modifiers.modifier.length) {
          if (modifiers.modifier.length === 1) {
            if (_.first(modifiers.modifier) === 'NOT') {
              // Handle WHERE NOT
              if (modifiers.combinator === 'AND') {
                _fn = 'whereNot';
              }

              // Defaults to OR when grouping
              if (modifiers.combinator === 'OR' || !modifiers.combinator) {
                _fn = 'orWhereNot';
                modifiers.combinator = 'OR';
              }
            }
          }

          // If we end up with something like [AND, NOT, IN].
          // Throw out the AND.
          if (modifiers.modifier.length > 1) {
            if (_.first(modifiers.modifier) === 'AND') {
              _.pullAt(modifiers.modifier, 0);
            }

            var first = _.first(_.pullAt(modifiers.modifier, 0));
            var second = _.first(_.pullAt(modifiers.modifier, 0));

            if (first === 'NOT' && second === 'IN') {
              _fn = 'whereNotIn';
            }
          }

          // Handle empty modifiers. Use this when not negating. Defaulting to
          // use the `orWhere` statement already set.
        } else {
          if (modifiers.combinator === 'AND') {
            _fn = 'where';
          }
        }

        buildQueryPiece(_fn, expr, _query);
      });

      // Ensure the nested query is a FIND
      _query.select(['*']);
      var nestedCriteria = _query.toObject();

      // Attach the nested conditional to the parent query
      buildQueryPiece(fn, [nestedCriteria.filter], query);
    };


    //  ╔═╗╦═╗╔═╗╔═╗╔═╗╔═╗╔═╗  ╔═╗╔═╗╔╗╔╔╦╗╦╔╦╗╦╔═╗╔╗╔╔═╗╦
    //  ╠═╝╠╦╝║ ║║  ║╣ ╚═╗╚═╗  ║  ║ ║║║║ ║║║ ║ ║║ ║║║║╠═╣║
    //  ╩  ╩╚═╚═╝╚═╝╚═╝╚═╝╚═╝  ╚═╝╚═╝╝╚╝═╩╝╩ ╩ ╩╚═╝╝╚╝╩ ╩╩═╝
    //  ╔═╗╦═╗╔═╗╦ ╦╔═╗╦╔╗╔╔═╗  ╔═╗╔╦╗╔═╗╔╦╗╔╦╗╔═╗╔╗╔╔╦╗
    //  ║ ╦╠╦╝║ ║║ ║╠═╝║║║║║ ╦  ╚═╗ ║ ╠═╣ ║ ║║║║╣ ║║║ ║
    //  ╚═╝╩╚═╚═╝╚═╝╩  ╩╝╚╝╚═╝  ╚═╝ ╩ ╩ ╩ ╩ ╩ ╩╚═╝╝╚╝ ╩
    //
    // Conditional statements are grouped into sets. This function processes
    // the tokens in a single one of those sets.
    var processConditionalSet = function processConditionalSet(tokens, nested, expression, modifier, query) {
      // Hold values that make up a nested expression group.
      var expressionGroup = [];

      // Loop through each expression in the group
      _.each(tokens, function processSet(groupedExpr) {
        // If there is a NOT condition, reset the expression and add the NOT
        // condition as the first item in the expression. The analyzer will
        // always put the NOT condition before an expression set.
        if (groupedExpr.type === 'CONDITION' && groupedExpr.value === 'NOT') {
          expression = [];
          expression.unshift(groupedExpr.value);
          return;
        }

        // If there is a IN condition, add the condition as the first item in
        // the expression.
        if (groupedExpr.type === 'CONDITION' && groupedExpr.value === 'IN') {
          expression.unshift(groupedExpr.value);
          return;
        }

        // If the grouped expression is a nested array, this represents a nested
        // OR statement. So instead of building the query outright, we want to
        // collect all the pieces that make it up and call the Query grouping
        // function at the end.
        if (_.isArray(groupedExpr)) {
          expressionGroup.push(processGroup(groupedExpr, true, expression, modifier, query));
          return;
        }

        // If there is a KEY/OPERATOR/VALUE token, process it using the where builder
        if (groupedExpr.type === 'KEY' || groupedExpr.type === 'OPERATOR' || groupedExpr.type === 'VALUE') {
          expression = whereBuilder(groupedExpr, expression);
        }

        // If the expression's type is value after we are done processing it we
        // can add it to the query. Unless we are in a nested statement in
        // which case just add it to the expression group.
        if (groupedExpr.type === 'VALUE') {
          // Look ahead in the tokens and see if there are any more VALUE
          // expressions. If so, this will need to be an expression group so
          // that we get parenthesis around it. This is commonly used where you
          // have a criteria like the following:
          // {
          //   or: [
          //     { name: 'foo' },
          //     { age: 21, username: 'bar' }
          //   ]
          // }
          // Here we need to wrap the `age` and `username` part of the
          // expression in parenthesis.
          var hasMoreValues = _.filter(tokens, { type: 'VALUE' });

          // If there are more values, add the current expression to the group.
          // Prepend an AND statement to the beginning to show that the will
          // end up as (age = 21 and username = bar). If this was an OR statement
          // it would be processed differently because the tokens would be
          // nested arrays.
          if (hasMoreValues.length > 1) {
            expression.unshift('AND');
            expressionGroup.push(expression);
            return;
          }

          // If this is a nested expression, just update the expression group
          if (nested) {
            expressionGroup = expressionGroup.concat(expression);
            return;
          }

          expressionGroup.push(expression);
        }
      });

      // Return the expression group
      return expressionGroup;
    };


    //  ╔═╗╦═╗╔═╗╔═╗╔═╗╔═╗╔═╗  ╔═╗╔═╗╔╗╔╔╦╗╦╔╦╗╦╔═╗╔╗╔╔═╗╦
    //  ╠═╝╠╦╝║ ║║  ║╣ ╚═╗╚═╗  ║  ║ ║║║║ ║║║ ║ ║║ ║║║║╠═╣║
    //  ╩  ╩╚═╚═╝╚═╝╚═╝╚═╝╚═╝  ╚═╝╚═╝╝╚╝═╩╝╩ ╩ ╩╚═╝╝╚╝╩ ╩╩═╝
    //
    // Process a group of values that make up a conditional.
    // Such as an OR statement.
    var processGroup = function processGroup(tokens, nested, expression, modifier, query) {
      // Loop through each expression in the group
      var expressionGroup = processConditionalSet(tokens, nested, expression, modifier, query);

      // If we are inside of a nested expression, return the group after we are
      // done processing all the tokens.
      if (nested) {
        return expressionGroup;
      }

      // We can examine the group and if there is only a single item, go ahead
      // and just build a normal grouping query.
      // ex. query().orWhere([name, 'foo'])
      //
      // If there are multiple items in the set, we need to process them
      // individualy.
      if (expressionGroup.length === 1) {
        // Check for any modifiers added to the beginning of the expression.
        // These represent things like NOT. Pull the value from the expression.
        var queryExpression = _.first(expressionGroup);
        var modifiers = checkForModifiers(queryExpression);

        // Default the fn value to `orWhere` unless an AND modifier was passed in
        var fn = 'orWhere';

        if (modifier && _.isArray(modifier) && _.first(modifier) === 'AND') {
          fn = 'andWhere';
        }

        // Check the modifier to see if a different function other than
        // OR WHERE should be used. The most common is OR WHERE NOT IN.
        if (modifiers.modifier.length) {
          if (modifiers.modifier.length === 1) {
            if (_.first(modifiers.modifier) === 'NOT') {
              fn = 'orWhereNot';
            }

            if (_.first(modifiers.modifier) === 'IN') {
              fn = 'orWhereIn';
            }
          }

          // If there are more than 1 modifier then we need to checkout
          // the combo. Usually it's a [NOT,IN] situation.
          // For now let's assume it will only ever be 2 items.
          if (modifiers.modifier.length > 1) {
            var first = _.first(_.pullAt(modifiers.modifier, 0));
            var second = _.first(_.pullAt(modifiers.modifier, 0));

            if (first === 'NOT' && second === 'IN') {
              fn = 'orWhereNotIn';
            }
          }
        }

        buildQueryPiece(fn, queryExpression, query);
        return;
      }

      // Otherwise build the grouping function
      buildGrouping(expressionGroup, modifier, query);
    };


    //  ╔═╗╦═╗╔═╗╔═╗╔═╗╔═╗╔═╗  ╦  ╦╔═╗╦  ╦ ╦╔═╗
    //  ╠═╝╠╦╝║ ║║  ║╣ ╚═╗╚═╗  ╚╗╔╝╠═╣║  ║ ║║╣
    //  ╩  ╩╚═╚═╝╚═╝╚═╝╚═╝╚═╝   ╚╝ ╩ ╩╩═╝╚═╝╚═╝
    //
    // Negotiates building a query piece based on the identifier
    var processValue = function processValue(expr, idx, options) {
      // Examine the identifier value
      switch (options.identifier) {
        case 'SELECT':
          buildQueryPiece('select', expr.value, options.query);
          break;

        case 'FROM':
        case 'INTO':
        case 'USING':
          buildQueryPiece('from', expr.value, options.query);
          break;

        case 'DISTINCT':
          buildQueryPiece('distinct', expr.value, options.query);
          break;

        case 'COUNT':
        // case 'MIN':
        // case 'MAX':
        // case 'SUM':
        // case 'AVG':
          if (!_.isArray(expr.value)) {
            expr.value = [expr.value];
          }

          _.each(expr.value, function processAvg(val) {
            buildQueryPiece(options.identifier.toLowerCase(), val, options.query);
          });
          break;

        case 'GROUPBY':
          buildQueryPiece('groupBy', expr.value, options.query);
          break;

        case 'LIMIT':
          buildQueryPiece('limit', expr.value, options.query);
          break;

        case 'SKIP':
          buildQueryPiece('skip', expr.value, options.query);
          break;

        case 'ORDERBY':
          // Look ahead and see if the next expression is an Identifier.
          // If so or if there is no next identifier, add the order by statments.
          options.nextExpr = undefined;
          options.nextExpr = options.tokenGroup[idx + 1];
          if (!options.nextExpr || options.nextExpr.type === 'IDENTIFIER') {
            _.each(options.expression, function processOrderBy(ordering) {
              buildQueryPiece('sort', ordering, options.query);
            });
          }
          break;

        case 'INSERT':
          // Look ahead and see if the next expression is an Identifier.
          // If so or if there is no next identifier, add the insert statments.
          options.nextExpr = undefined;
          options.nextExpr = options.tokenGroup[idx + 1];
          if (!options.nextExpr || options.nextExpr.type === 'IDENTIFIER') {
            // Flatten the expression
            options.expression = _.fromPairs(options.expression);
            buildQueryPiece('insert', options.expression, options.query);
          }
          break;

        case 'UPDATE':
          // Look ahead and see if the next expression is an Identifier.
          // If so or if there is no next identifier, add the update statments.
          options.nextExpr = undefined;
          options.nextExpr = options.tokenGroup[idx + 1];
          if (!options.nextExpr || options.nextExpr.type === 'IDENTIFIER') {
            // Flatten the expression
            options.expression = _.fromPairs(options.expression);
            buildQueryPiece('update', options.expression, options.query);
          }
          break;

        case 'WHERE':

          // Check the modifier to see if a different function other than
          // WHERE should be used. The most common is NOT.
          if (options.modifier && options.modifier.length) {
            if (options.modifier.length === 1 && _.first(options.modifier) === 'NOT') {
              options.fn = 'whereNot';
            }

            if (options.modifier.length === 1 && _.first(options.modifier) === 'IN') {
              options.fn = 'whereIn';
            }

            // If there are more than 1 modifier then we need to checkout
            // the combo. Usually it's a [NOT,IN] situation.
            // For now let's assume it will only ever be 2 items.
            if (options.modifier.length > 1) {
              var first = _.first(_.pullAt(options.modifier, 0));
              var second = _.first(_.pullAt(options.modifier, 0));

              if (first === 'NOT' && second === 'IN') {
                options.fn = 'whereNotIn';
              }
            }

            // Otherwise use the where fn
          } else {
            options.fn = 'where';
          }

          // Set the second or third item in the array to the value
          buildQueryPiece(options.fn, options.expression, options.query);

          // Clear the modifier
          options.modifier = [];
          break;

      }
    };

    //  ████████╗ ██████╗ ██╗  ██╗███████╗███╗   ██╗    ██████╗  █████╗ ██████╗ ███████╗███████╗██████╗
    //  ╚══██╔══╝██╔═══██╗██║ ██╔╝██╔════╝████╗  ██║    ██╔══██╗██╔══██╗██╔══██╗██╔════╝██╔════╝██╔══██╗
    //     ██║   ██║   ██║█████╔╝ █████╗  ██╔██╗ ██║    ██████╔╝███████║██████╔╝███████╗█████╗  ██████╔╝
    //     ██║   ██║   ██║██╔═██╗ ██╔══╝  ██║╚██╗██║    ██╔═══╝ ██╔══██║██╔══██╗╚════██║██╔══╝  ██╔══██╗
    //     ██║   ╚██████╔╝██║  ██╗███████╗██║ ╚████║    ██║     ██║  ██║██║  ██║███████║███████╗██║  ██║
    //     ╚═╝    ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝  ╚═══╝    ╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚══════╝╚═╝  ╚═╝
    //


    //  ╔═╗═╗ ╦╔═╗╦═╗╔═╗╔═╗╔═╗╦╔═╗╔╗╔  ╔═╗╔═╗╦═╗╔═╗╔═╗╦═╗
    //  ║╣ ╔╩╦╝╠═╝╠╦╝║╣ ╚═╗╚═╗║║ ║║║║  ╠═╝╠═╣╠╦╝╚═╗║╣ ╠╦╝
    //  ╚═╝╩ ╚═╩  ╩╚═╚═╝╚═╝╚═╝╩╚═╝╝╚╝  ╩  ╩ ╩╩╚═╚═╝╚═╝╩╚═
    //
    // Parses each individual token piece.
    var expressionParser = function expressionParser(expr, idx, options) {
      // Handle identifiers by storing them on the fn
      if (expr.type === 'IDENTIFIER') {
        options.identifier = expr.value;

        // If the identifier is the DELETE key, we can go ahead and process it
        if (options.identifier === 'DELETE') {
          options.query.del();
        }

        return;
      }

      // NOT Modifier
      if (expr.type === 'CONDITION' && expr.value === 'NOT') {
        options.modifier = options.modifier || [];
        options.modifier.push(expr.value);
        return;
      }

      // IN Modifier
      if (expr.type === 'CONDITION' && expr.value === 'IN') {
        options.modifier = options.modifier || [];
        options.modifier.push(expr.value);
        return;
      }

      // AND Modifier
      if (expr.type === 'CONDITION' && expr.value === 'AND') {
        options.modifier = options.modifier || [];
        options.modifier.push(expr.value);
        return;
      }

      // Handle sets of values being inserted
      if (options.identifier === 'INSERT' && (expr.type === 'KEY' || expr.type === 'VALUE')) {
        options.expression = insertBuilder(expr, options.expression, options.query);
      }

      // Handle sets of values being update
      if (options.identifier === 'UPDATE' && (expr.type === 'KEY' || expr.type === 'VALUE')) {
        options.expression = updateBuilder(expr, options.expression, options.query);
      }

      // Handle clauses in the WHERE value
      if (options.identifier === 'WHERE' && (expr.type === 'KEY' || expr.type === 'OPERATOR' || expr.type === 'VALUE')) {
        options.expression = whereBuilder(expr, options.expression, options.modifier, options.query);
      }

      // Handle ORDER BY statements
      if (options.identifier === 'ORDERBY' && (expr.type === 'KEY' || expr.type === 'VALUE')) {
        options.expression = orderByBuilder(expr, options.expression, options.query);
      }

      // Handle AS statements
      // if (options.identifier === 'AS' && expr.type === 'VALUE') {
      //   options.query.as(expr.value);
      //   return;
      // }

      // Process value and use the appropriate query function
      if (expr.type === 'VALUE') {
        processValue(expr, idx, options);
        return;
      }

      //  ╔═╗╦═╗╔═╗╦ ╦╔═╗╦╔╗╔╔═╗
      //  ║ ╦╠╦╝║ ║║ ║╠═╝║║║║║ ╦
      //  ╚═╝╩╚═╚═╝╚═╝╩  ╩╝╚╝╚═╝
      //
      // If the expression is an array then the values should be grouped. Unless
      // they are describing join logic.
      if (_.isArray(expr)) {
        // Join's are not supported in any way, this makes sure if somehow we
        // come across one, it's just ignored. It should have been validated
        // elsewhere by now.
        var joinTypes = [
          'JOIN',
          'INNERJOIN',
          'OUTERJOIN',
          'CROSSJOIN',
          'LEFTJOIN',
          'LEFTOUTERJOIN',
          'RIGHTJOIN',
          'RIGHTOUTERJOIN',
          'FULLOUTERJOIN'
        ];

        var isJoin = _.indexOf(joinTypes, options.identifier);
        if (isJoin === -1) {
          processGroup(expr, false, options.expression, options.modifier, options.query);
          return;
        }
      }
    };

    //  ╔╦╗╦═╗╔═╗╔═╗  ╔═╗╔═╗╦═╗╔═╗╔═╗╦═╗
    //   ║ ╠╦╝║╣ ║╣   ╠═╝╠═╣╠╦╝╚═╗║╣ ╠╦╝
    //   ╩ ╩╚═╚═╝╚═╝  ╩  ╩ ╩╩╚═╚═╝╚═╝╩╚═
    //
    // Parses a group of tokens in the tree
    var treeParser = function treeParser(tokenGroup, query) {
      // Build up the default options
      var options = {
        identifier: undefined,
        modifier: [],
        nextExpr: undefined,
        expression: [],
        query: query,
        tokenGroup: tokenGroup,
        subQuery: false,
        union: false
      };

      // Loop through each item in the group and build up the expression
      _.each(tokenGroup, function parseTokenGroup(expr, idx) {
        expressionParser(expr, idx, options);
      });
    };

    //  ╔╦╗╔═╗╦╔═╔═╗╔╗╔  ╔═╗╔═╗╦═╗╔═╗╔═╗╦═╗
    //   ║ ║ ║╠╩╗║╣ ║║║  ╠═╝╠═╣╠╦╝╚═╗║╣ ╠╦╝
    //   ╩ ╚═╝╩ ╩╚═╝╝╚╝  ╩  ╩ ╩╩╚═╚═╝╚═╝╩╚═
    //
    // Loop through each token group in the tree and add to the query
    var tokenParser = function tokenParser(query, tree) {
      _.forEach(tree, function parseTree(tokenGroup) {
        treeParser(tokenGroup, query);
      });
    };

    // Run the token parser
    var MQuery = (function parseTree(tree) {
      var query = new Query();
      tokenParser(query, tree);
      return query.toObject();
    })(inputs.tree);

    return exits.success(MQuery);
  }

};
