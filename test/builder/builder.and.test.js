var Builder = require('../../index').builder;
var analyze = require('../support/analyze');
var assert = require('assert');

describe('Builder ::', function() {
  describe('Grouping statements with AND', function() {
    it('should generate a query when AND is used as an array', function(done) {
      var tree = analyze({
        select: '*',
        from: 'users',
        where: {
          and: [
            {
              firstName: 'foo'
            },
            {
              lastName: 'bar'
            }
          ]
        }
      });

      Builder({
        tree: tree
      })
      .exec(function(err, result) {
        assert(!err);
        assert.deepEqual(result, {
          find: 'users',
          filter: {
            '$and': [
              {
                firstName: 'foo'
              },
              {
                lastName: 'bar'
              }
            ]
          },
          sort: {},
          projection: {},
          skip: 0,
          limit: 0
        });

        return done();
      });
    });

    it('should generate a query when nested OR statements are used', function(done) {
      var tree = analyze({
        select: ['*'],
        from: 'users',
        where: {
          and: [
            {
              or: [
                {
                  firstName: 'John'
                },
                {
                  lastName: 'Smith'
                }
              ]
            },
            {
              or: [
                {
                  qty: {
                    '>': 100
                  }
                },
                {
                  price: {
                    '<': 10.00
                  }
                }
              ]
            }
          ]
        }
      });

      Builder({
        tree: tree
      })
      .exec(function(err, result) {
        assert(!err);
        assert.deepEqual(result, {
          find: 'users',
          filter: {
            '$and': [
              {
                '$or': [
                  {
                    firstName: 'John'
                  },
                  {
                    lastName: 'Smith'
                  }
                ]
              },
              {
                '$or': [
                  {
                    qty: {
                      '$gt': 100
                    }
                  },
                  {
                    price: {
                      '$lt': 10.00
                    }
                  }
                ]
              }
            ]
          },
          sort: {},
          projection: {},
          skip: 0,
          limit: 0
        });

        return done();
      });
    });
  });
});
