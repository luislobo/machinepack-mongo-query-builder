var Builder = require('../../index').builder;
var analyze = require('../support/analyze');
var assert = require('assert');

describe('Builder ::', function() {
  describe('WHERE IN statements', function() {
    it('should generate a query', function(done) {
      var tree = analyze({
        select: ['name'],
        from: 'users',
        where: {
          id: {
            in: [1, 2, 3]
          }
        }
      });

      Builder({
        tree: tree
      })
      .exec(function(err, result) {
        assert(!err);
        assert.deepEqual(result, {
          collection: 'users',
          fn: 'find',
          criteria: {
            id: {
              '$in': [1, 2, 3]
            }
          },
          options: {},
          fields: {
            name: 1
          }
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
              id: {
                in: [1, 2, 3]
              }
            },
            {
              id: {
                in: [4, 5, 6]
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
          collection: 'users',
          fn: 'find',
          criteria: {
            '$or': [
              {
                id: {
                  '$in': [1, 2, 3]
                }
              },
              {
                id: {
                  '$in': [4, 5, 6]
                }
              }
            ]
          },
          options: {},
          fields: {
            name: 1
          }
        });

        return done();
      });
    });
  });
});
