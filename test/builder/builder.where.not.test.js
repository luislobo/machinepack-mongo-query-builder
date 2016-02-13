var Builder = require('../../index').builder;
var analyze = require('../support/analyze');
var assert = require('assert');

describe('Builder ::', function() {
  describe('WHERE NOT statements', function() {
    it('should generate a query', function(done) {
      var tree = analyze({
        select: ['id'],
        from: 'users',
        where: {
          not: {
            firstName: 'Test',
            lastName: 'User'
          }
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
            firstName: { '$ne': 'Test' },
            lastName: { '$ne': 'User' }
          },
          sort: {},
          projection: {
            id: 1
          },
          skip: 0,
          limit: 0
        });

        return done();
      });
    });

    it('should generate a query when operators are used', function(done) {
      var tree = analyze({
        select: '*',
        from: 'users',
        where: {
          not: {
            votes: { '>': 100 }
          }
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
            votes: {
              '$not': {
                '$gt': 100
              }
            }
          },
          sort: {},
          projection: {},
          skip: 0,
          limit: 0
        });

        return done();
      });
    });

    it('should generate a query when multiple operators are used', function(done) {
      var tree = analyze({
        select: '*',
        from: 'users',
        where: {
          or: [
            { name: 'John' },
            {
              votes: { '>': 100 },
              not: {
                title: 'Admin'
              }
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
            '$or': [
              {
                name: 'John'
              },
              {
                votes: {
                  '$gt': 100
                },
                title: {
                  '$ne': 'Admin'
                }
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
