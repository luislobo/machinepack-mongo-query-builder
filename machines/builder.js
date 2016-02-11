module.exports = {


  friendlyName: 'Builder',


  description: 'Uses MQuery to build up a Mongo query',


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
      this._criteria = {};
      this._options = {};
      this._fields = {};
      return this;
    };

    // Construct a Query object
    // @return {this}
    Query.prototype.toObject = function toObject() {
      var query = {
        collection: this._collection,
        criteria: this._criteria,
        options: this._options,
        fields: this._fields,
        fn: this._fn
      };

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
        self._fields[field] = 1;
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

      var criteria = this._criteria[attributeName] || {};
      criteria['$exists'] = true;
      this._criteria[attributeName] = criteria;

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
      this._options = _.merge({}, this._options, values);
      return this;
    };

    // Where
    // @param {Dictionary} criteria
    Query.prototype.where = function where(attribute, modifier, value) {
      if (_.isUndefined(value)) {
        value = modifier;
      }

      // TODO: normalize modifier
      if (modifier) {
        var criteria = this._criteria[attribute] || {};
        criteria[modifier] = value;
      } else {
        this._criteria[attribute] = value;
      }

      return this;
    };

    // Distinct
    Query.prototype.distinct = function distinct() {
      var values = _.map(arguments);

      // If only a single value was used, an optimized `distinct` query should
      // be used.
      if (values.length === 1) {
        this._fn = 'distinct';
        this._options = {
          val: _.first(values)
        };

        // Otherwise, an aggregation must be done
      } else {
        this._fn = 'aggregate';

        var condition = {};
        _.each(values, function buildAggregateCondition(attr) {
          condition[attr] = '$' + attr;
        });

        this._options = {
          val: [
            { '$group': { '_id': condition } }
          ]
        };
      }

      return this;
    };

    // Limit
    // @param {Number} count
    Query.prototype.limit = function limit(count) {
      this._options.limit = count;
      return this;
    };

    // Skip
    // @param {Number} count
    Query.prototype.skip = function limit(count) {
      this._options.skip = count;
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
        //
        // case 'GROUPBY':
        //   buildQueryPiece('groupBy', expr.value, options.query);
        //   break;
        //
        //
        case 'LIMIT':
          buildQueryPiece('limit', expr.value, options.query);
          break;

        case 'OFFSET':
          buildQueryPiece('skip', expr.value, options.query);
          break;
        //
        // case 'ORDERBY':
        //
        //   // Look ahead and see if the next expression is an Identifier.
        //   // If so or if there is no next identifier, add the insert statments.
        //   options.nextExpr = undefined;
        //   options.nextExpr = options.tokenGroup[idx + 1];
        //   if (!options.nextExpr || options.nextExpr.type === 'IDENTIFIER') {
        //     _.each(options.expression, function processOrderBy(ordering) {
        //       buildQueryPiece('orderBy', ordering, options.query);
        //     });
        //   }
        //   break;
        //
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
        //
        // case 'UPDATE':
        //
        //   // Look ahead and see if the next expression is an Identifier.
        //   // If so or if there is no next identifier, add the update statments.
        //   options.nextExpr = undefined;
        //   options.nextExpr = options.tokenGroup[idx + 1];
        //   if (!options.nextExpr || options.nextExpr.type === 'IDENTIFIER') {
        //     // Flatten the expression
        //     options.expression = _.fromPairs(options.expression);
        //     buildQueryPiece('update', options.expression, options.query);
        //
        //     // Also add a 'returning' value
        //     buildQueryPiece('returning', 'id', options.query);
        //   }
        //   break;
        //
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
          // options.query.returning('id');
        }

        return;
      }

      // NOT Modifier
      // if (expr.type === 'CONDITION' && expr.value === 'NOT') {
      //   options.modifier = options.modifier || [];
      //   options.modifier.push(expr.value);
      //   return;
      // }

      // IN Modifier
      // if (expr.type === 'CONDITION' && expr.value === 'IN') {
      //   options.modifier = options.modifier || [];
      //   options.modifier.push(expr.value);
      //   return;
      // }

      // Handle sets of values being inserted
      if (options.identifier === 'INSERT' && (expr.type === 'KEY' || expr.type === 'VALUE')) {
        options.expression = insertBuilder(expr, options.expression, options.query);
      }

      // Handle sets of values being update
      // if (options.identifier === 'UPDATE' && (expr.type === 'KEY' || expr.type === 'VALUE')) {
      //   options.expression = updateBuilder(expr, options.expression, options.query);
      // }

      // Handle clauses in the WHERE value
      if (options.identifier === 'WHERE' && (expr.type === 'KEY' || expr.type === 'OPERATOR' || expr.type === 'VALUE')) {
        options.expression = whereBuilder(expr, options.expression, options.modifier, options.query);
      }

      // Handle ORDER BY statements
      // if (options.identifier === 'ORDERBY' && (expr.type === 'KEY' || expr.type === 'VALUE')) {
      //   options.expression = orderByBuilder(expr, options.expression, options.query);
      // }

      // Handle AS statements
      // if (options.identifier === 'AS' && expr.type === 'VALUE') {
      //   options.query.as(expr.value);
      //   return;
      // }

      // Handle UNION statements
      // if (expr.type === 'UNION') {
      //   options.union = true;
      //   options.unionType = expr.value;
      //   return;
      // }

      // Process value and use the appropriate Knex function
      if (expr.type === 'VALUE') {
        processValue(expr, idx, options);
        return;
      }

      // Handle SUBQUERY keys
      // if (expr.type === 'SUBQUERY') {
      //   options.subQuery = true;
      //   return;
      // }

      //  ╔═╗╦═╗╔═╗╦ ╦╔═╗╦╔╗╔╔═╗
      //  ║ ╦╠╦╝║ ║║ ║╠═╝║║║║║ ╦
      //  ╚═╝╩╚═╚═╝╚═╝╩  ╩╝╚╝╚═╝
      //
      // If the expression is an array then the values should be grouped. Unless
      // they are describing join logic.
      // if (_.isArray(expr)) {
      //   var joinTypes = [
      //     'JOIN',
      //     'INNERJOIN',
      //     'OUTERJOIN',
      //     'CROSSJOIN',
      //     'LEFTJOIN',
      //     'LEFTOUTERJOIN',
      //     'RIGHTJOIN',
      //     'RIGHTOUTERJOIN',
      //     'FULLOUTERJOIN'
      //   ];
      //
      //   // If the expression is an array of UNION subqueries, process each
      //   // one and toggle the UNION flag.
      //   if (options.union) {
      //     processUnion(expr, options.query, options.unionType);
      //     options.union = false;
      //     options.unionType = undefined;
      //     return;
      //   }
      //
      //   // If the expression is a subQuery then process it standalone query
      //   // and pass it in as the expression value
      //   if (options.subQuery) {
      //     // Build a standalone knex query builder and pass it the expression
      //     var subQueryBuilder = knex.queryBuilder();
      //     tokenParser(subQueryBuilder, expr);
      //
      //     // Toggle off the subquery flag
      //     options.subQuery = false;
      //
      //     // Build the query using the subquery object as the value
      //     if (options.identifier === 'WHERE') {
      //       options.expression.push(subQueryBuilder);
      //
      //       // If not a WHERE clause, just stick the subquery on the value
      //     } else {
      //       expr.value = subQueryBuilder;
      //     }
      //
      //     // Process the value
      //     processValue(expr, idx, options);
      //
      //     return;
      //   }
      //
      //   var isJoin = _.indexOf(joinTypes, options.identifier);
      //   if (isJoin === -1) {
      //     processGroup(expr, false, options.expression, undefined, options.query);
      //     return;
      //   }
      //
      //   // Otherwise process the array of join logic
      //   processJoinGroup(expr, options.identifier, options.query);
      // }
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
    // console.log('MQuery', MQuery);
    return exits.success(MQuery);
  }

};
