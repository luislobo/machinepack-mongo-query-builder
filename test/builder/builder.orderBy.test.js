var Builder = require('../../index').builder;
var analyze = require('../support/analyze');
var assert = require('assert');

describe('Builder ::', function() {
  describe('ORDER BY statements', function() {
    it('should generate a simple query with ORDER BY statements', function(done) {
      var tree = analyze({
        select: '*',
        from: 'users',
        orderBy: [{ name: 'desc' }, { age: 'asc' }]
      });

      Builder({
        tree: tree
      })
      .exec(function(err, result) {
        assert(!err);
        assert.deepEqual(result, {
          find: 'users',
          filter: {},
          sort: {
            name: -1,
            age: 1
          },
          projection: {},
          skip: 0,
          limit: 0
        });

        return done();
      });
    });
  });
});
