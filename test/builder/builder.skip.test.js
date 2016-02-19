var Builder = require('../../index').builder;
var analyze = require('../support/analyze');
var assert = require('assert');

describe('Builder ::', function() {
  describe('SKIP statements', function() {
    it('should generate a simple query with a SKIP statement', function(done) {
      var tree = analyze({
        select: '*',
        from: 'users',
        skip: 10
      });

      Builder({
        tree: tree
      })
      .exec(function(err, result) {
        assert(!err);
        assert.deepEqual(result, {
          find: 'users',
          filter: {},
          sort: {},
          projection: {},
          skip: 10,
          limit: 0
        });

        return done();
      });
    });
  });
});
