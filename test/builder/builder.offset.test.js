var Builder = require('../../index').builder;
var analyze = require('../support/analyze');
var assert = require('assert');

describe('Builder ::', function() {
  describe('OFFSET statements', function() {
    it('should generate a simple query with a OFFSET statement', function(done) {
      var tree = analyze({
        select: '*',
        from: 'users',
        offset: 10
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
