var Builder = require('../../index').builder;
var analyze = require('../support/analyze');
var assert = require('assert');

describe('Builder ::', function() {
  describe('LIMIT statements', function() {
    it('should generate a simple query with a LIMIT statement', function(done) {
      var tree = analyze({
        select: '*',
        from: 'users',
        limit: 10
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
          skip: 0,
          limit: 10
        });

        return done();
      });
    });
  });
});
