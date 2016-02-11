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
          collection: 'customers',
          fn: 'distinct',
          fields: {},
          options: {
            val: 'firstName'
          },
          criteria: {}
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
          collection: 'customers',
          fn: 'aggregate',
          fields: {},
          options: {
            val: [
              {
                '$group': {
                  '_id': {
                    firstName: '$firstName',
                    lastName: '$lastName'
                  }
                }
              }
            ]
          },
          criteria: {}
        });

        return done();
      });
    });
  });
});
