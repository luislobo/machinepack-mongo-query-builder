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
          find: 'books',
          filter: {},
          sort: {},
          projection: {},
          skip: 0,
          limit: 0
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
          find: 'books',
          filter: {},
          sort: {},
          projection: {
            title: 1,
            author: 1,
            year: 1
          },
          skip: 0,
          limit: 0
        });

        return done();
      });
    });
  });
});
