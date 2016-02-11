var Builder = require('../../index').builder;
var analyze = require('../support/analyze');
var assert = require('assert');

describe('Builder ::', function() {
  describe('COUNT statements', function() {
    it('should generate a count query', function(done) {
      var tree = analyze({
        count: [
          'active'
        ],
        from: 'users'
      });

      Builder({
        tree: tree
      })
      .exec(function(err, result) {
        assert(!err);
        assert.deepEqual(result, {
          collection: 'users',
          fn: 'count',
          fields: {},
          options: {},
          criteria: {
            active: {
              '$exists': true
            }
          }
        });

        return done();
      });
    });
  });
});
