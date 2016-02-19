var Builder = require('../../index').builder;
var analyze = require('../support/analyze');
var assert = require('assert');

describe('Builder ::', function() {
  describe('Grouping statements with OR', function() {
    it('should generate a query when an OR statement is used', function(done) {
      var tree = analyze({
        select: '*',
        where: {
          or: [
            {
              id: { '>': 10 }
            },
            {
              name: 'Tester'
            }
          ]
        },
        from: 'users'
      });

      Builder({
        tree: tree
      })
      .exec(function(err, result) {
        assert(!err);
        assert.deepEqual(result, {
          find: 'users',
          filter: {
            '$or': [
              {
                id: { '$gt': 10 }
              },
              {
                name: 'Tester'
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
        select: '*',
        where: {
          or: [
            {
              or: [
                { id: 1 },
                { id: { '>': 10 } }
              ]
            },
            {
              name: 'Tester'
            }
          ]
        },
        from: 'users'
      });

      Builder({
        tree: tree
      })
      .exec(function(err, result) {
        assert(!err);
        assert.deepEqual(result, {
          find: 'users',
          filter: {
            '$or': [
              {
                '$or': [
                  {
                    id: 1
                  },
                  {
                    id: {
                      '$gt': 10
                    }
                  }
                ]
              },
              {
                name: 'Tester'
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
