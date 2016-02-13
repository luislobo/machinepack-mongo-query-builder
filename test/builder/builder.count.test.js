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
          aggregate: 'users',
          pipeline: [
            {
              '$group': {
                _id: '$active',
                count: {
                  '$sum': 1
                }
              }
            }
          ]
        });

        return done();
      });
    });

    it('should generate a count query with multiple values', function(done) {
      var tree = analyze({
        count: [
          'active',
          'inactive'
        ],
        from: 'users'
      });

      Builder({
        tree: tree
      })
      .exec(function(err, result) {
        assert(!err);
        assert.deepEqual(result, {
          aggregate: 'users',
          pipeline: [
            {
              '$group': {
                _id: {
                  active: '$active',
                  inactive: '$inactive'
                },
                count: {
                  '$sum': 1
                }
              }
            }
          ]
        });

        return done();
      });
    });
  });
});
