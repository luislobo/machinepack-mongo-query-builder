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
          collection: 'users',
          fn: 'find',
          fields: {},
          options: {
            limit: 10
          },
          criteria: {}
        });

        return done();
      });
    });
  });
});
