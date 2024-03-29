var Builder = require('../../index').builder;
var analyze = require('../support/analyze');
var assert = require('assert');

describe('Builder ::', function() {
  describe('WHERE NOT IN statements', function() {
    it('should generate a query', function(done) {
      var tree = analyze({
        select: ['name'],
        from: 'users',
        where: {
          not: {
            id: {
              in: [1, 2, 3]
            }
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
            id: {
              '$nin': [1, 2, 3]
            }
          },
          sort: {},
          projection: {
            name: 1
          },
          skip: 0,
          limit: 0
        });

        return done();
      });
    });

    it('should generate a query when in an OR statement', function(done) {
      var tree = analyze({
        select: ['name'],
        from: 'users',
        where: {
          or: [
            {
              not: {
                id: {
                  in: [1, 2, 3]
                }
              }
            },
            {
              not: {
                id: {
                  in: [4, 5, 6]
                }
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
                id: {
                  '$nin': [1, 2, 3]
                }
              },
              {
                id: {
                  '$nin': [4, 5, 6]
                }
              }
            ]
          },
          sort: {},
          projection: {
            name: 1
          },
          skip: 0,
          limit: 0
        });

        return done();
      });
    });

    it('should generate a query when in an OR statement with multiple criteria', function(done) {
      var tree = analyze({
        select: ['name'],
        from: 'users',
        where: {
          or: [
            {
              not: {
                id: {
                  in: [1, 2, 3]
                }
              },
              age: 21
            },
            {
              not: {
                id: {
                  in: [4, 5, 6]
                }
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
                id: {
                  '$nin': [1, 2, 3]
                },
                age: 21
              },
              {
                id: {
                  '$nin': [4, 5, 6]
                }
              }
            ]
          },
          sort: {},
          projection: {
            name: 1
          },
          skip: 0,
          limit: 0
        });

        return done();
      });
    });
  });
});
