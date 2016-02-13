var Builder = require('../../index').builder;
var analyze = require('../support/analyze');
var assert = require('assert');

describe('Builder ::', function() {
  describe('UPDATE statements', function() {
    it('should generate a simple query with an UPDATE statement', function(done) {
      var tree = analyze({
        update: {
          status: 'archived'
        },
        where: {
          publishedDate: { '>': 2000 }
        },
        using: 'books'
      });

      Builder({
        tree: tree
      })
      .exec(function(err, result) {
        assert(!err);
        assert.deepEqual(result, {
          update: 'books',
          updates: [
            {
              q: {
                publishedDate: {
                  '$gt': 2000
                }
              },
              u: {
                '$set': {
                  status: 'archived'
                }
              },
              multi: true
            }
          ]
        });

        return done();
      });
    });

    it('should generate a query with multiple values being updated', function(done) {
      var tree = analyze({
        update: {
          status: 'archived',
          active: false
        },
        where: {
          publishedDate: { '>': 2000 }
        },
        using: 'books'
      });

      Builder({
        tree: tree
      })
      .exec(function(err, result) {
        assert(!err, err);
        assert.deepEqual(result, {
          update: 'books',
          updates: [
            {
              q: {
                publishedDate: {
                  '$gt': 2000
                }
              },
              u: {
                '$set': {
                  status: 'archived',
                  active: false
                }
              },
              multi: true
            }
          ]
        });

        return done();
      });
    });

    it('should generate a query with a NULL value for input', function(done) {
      var tree = analyze({
        update: {
          status: null
        },
        using: 'books'
      });

      Builder({
        tree: tree
      })
      .exec(function(err, result) {
        assert(!err, err);
        assert.deepEqual(result, {
          update: 'books',
          updates: [
            {
              q: {},
              u: {
                '$set': {
                  status: null
                }
              },
              multi: true
            }
          ]
        });

        return done();
      });
    });
  });
});
