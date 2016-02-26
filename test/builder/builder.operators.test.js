var Builder = require('../../index').builder;
var analyze = require('../support/analyze');
var assert = require('assert');

describe('Builder ::', function() {
  describe('Various Operators', function() {
    it('should generate a query for LIKE operators', function(done) {
      var tree = analyze({
        select: '*',
        from: 'users',
        where: {
          or: [
            {
              name: {
                like: '%Test%'
              }
            },
            {
              not: {
                id: {
                  in: [1, 2, 3]
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
                name: {
                  '$regex': 'Test'
                }
              },
              {
                id: {
                  '$nin': [1, 2, 3]
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
