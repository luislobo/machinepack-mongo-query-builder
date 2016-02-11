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
          collection: 'books',
          fn: 'update',
          update: {
            '$set': {
              status: 'archived'
            }
          },
          options: {
            multi: true
          },
          criteria: {
            publishedDate: { '$gt': 2000 }
          }
        });

        return done();
      });
    });

    it('should generate a query with multiple values being inserted', function(done) {
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
          collection: 'books',
          fn: 'update',
          update: {
            '$set': {
              status: 'archived',
              active: false
            }
          },
          options: {
            multi: true
          },
          criteria: {
            publishedDate: { '$gt': 2000 }
          }
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
          collection: 'books',
          fn: 'update',
          update: {
            '$set': {
              status: null
            }
          },
          options: {
            multi: true
          },
          criteria: {}
        });

        return done();
      });
    });
  });
});
