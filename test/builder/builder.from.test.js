var Builder = require('../../index').builder;
var analyze = require('../support/analyze');
var assert = require('assert');

describe('Builder ::', function() {
  describe('FROM statements', function() {
    it('should generate a simple query with a FROM statement', function(done) {
      var tree = analyze({
        select: '*',
        from: 'books'
      });

      Builder({
        tree: tree
      })
      .exec(function(err, result) {
        assert(!err);
        assert.deepEqual(result, {
          collection: 'books',
          fn: 'find',
          fields: {},
          options: {},
          criteria: {}
        });

        return done();
      });
    });

    it('should ignore schemas in the FROM statement', function(done) {
      var tree = analyze({
        select: ['title', 'author', 'year'],
        from: { table: 'books', schema: 'foo' }
      });

      Builder({
        tree: tree
      })
      .exec(function(err, result) {
        assert(!err);
        assert.deepEqual(result, {
          collection: 'books',
          fn: 'find',
          fields: {
            title: 1,
            author: 1,
            year: 1
          },
          options: {},
          criteria: {}
        });

        return done();
      });
    });
  });
});
