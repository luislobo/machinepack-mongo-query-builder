var Builder = require('../../index').builder;
var analyze = require('../support/analyze');
var assert = require('assert');

describe('Builder ::', function() {
  describe('WHERE NOT NULL statements', function() {
    it('should generate a query with a simple WHERE statement', function(done) {
      var tree = analyze({
        select: '*',
        from: 'users',
        where: {
          not: {
            updatedAt: null
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
            updatedAt: { '$ne': null }
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
