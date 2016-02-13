var Builder = require('../../index').builder;
var analyze = require('../support/analyze');
var assert = require('assert');

describe('Builder ::', function() {
  describe('DISTINCT statements', function() {
    it('should generate a distinct query', function(done) {
      var tree = analyze({
        select: {
          distinct: ['firstName']
        },
        from: 'customers'
      });

      Builder({
        tree: tree
      })
      .exec(function(err, result) {
        assert(!err);
        assert.deepEqual(result, {
          distinct: 'customers',
          key: 'firstName',
          query: {}
        });

        return done();
      });
    });

    it('should generate an aggregate query', function(done) {
      var tree = analyze({
        select: {
          distinct: ['firstName', 'lastName']
        },
        from: 'customers'
      });

      Builder({
        tree: tree
      })
      .exec(function(err, result) {
        assert(!err);
        assert.deepEqual(result, {
          aggregate: 'customers',
          pipeline: [
            {
              '$group': {
                '_id': {
                  firstName: '$firstName',
                  lastName: '$lastName'
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
