var Builder = require('../../index').builder;
var analyze = require('../support/analyze');
var assert = require('assert');

describe('Builder ::', function() {
  describe('WHERE Simple statements', function() {
    it('should generate a query with a simple WHERE statement', function(done) {
      var tree = analyze({
        select: ['id'],
        where: {
          firstName: 'Test',
          lastName: 'User'
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
            firstName: 'Test',
            lastName: 'User'
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

    it('should generate a valid query when operators are used', function(done) {
      var tree = analyze({
        select: '*',
        where: {
          votes: { '>': 100 }
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
            votes: {
              '$gt': 100
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

    it('should generate a valid query when multiple operators are used', function(done) {
      var tree = analyze({
        select: '*',
        where: {
          votes: {
            '>': 100,
            '<': 200
          }
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
            votes: {
              '$gt': 100,
              '$lt': 200
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

    it('should generate a valid query when multiple columns and operators are used', function(done) {
      var tree = analyze({
        select: '*',
        where: {
          votes: { '>': 100 },
          age: { '<': 50 }
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
            votes: {
              '$gt': 100
            },
            age: {
              '$lt': 50
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
  });
});
