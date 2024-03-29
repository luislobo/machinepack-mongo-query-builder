var Builder = require('../../index').builder;
var analyze = require('../support/analyze');
var assert = require('assert');

describe('Builder ::', function() {
  describe('INSERT statements', function() {
    it('should generate a simple query with an INSERT statement', function(done) {
      var tree = analyze({
        insert: {
          title: 'Slaughterhouse Five'
        },
        into: 'books'
      });

      Builder({
        tree: tree
      })
      .exec(function(err, result) {
        assert(!err);
        assert.deepEqual(result, {
          insert: 'books',
          documents: [
            {
              title: 'Slaughterhouse Five'
            }
          ]
        });

        return done();
      });
    });

    it('should generate a query with multiple values being inserted', function(done) {
      var tree = analyze({
        insert: {
          title: 'Slaughterhouse Five',
          author: 'Kurt Vonnegut'
        },
        into: 'books'
      });

      Builder({
        tree: tree
      })
      .exec(function(err, result) {
        assert(!err, err);
        assert.deepEqual(result, {
          insert: 'books',
          documents: [
            {
              title: 'Slaughterhouse Five',
              author: 'Kurt Vonnegut'
            }
          ]
        });

        return done();
      });
    });
  });
});
