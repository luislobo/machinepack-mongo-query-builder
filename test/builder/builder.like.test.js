var Builder = require('../../index').builder;
var analyze = require('../support/analyze');
var assert = require('assert');

describe('Builder ::', function() {
  describe('LIKE operator', function() {
    it('should generate a simple LIKE query', function(done) {
      var tree = analyze({
        select: '*',
        from: 'users',
        where: {
          name: {
            like: '%Test%'
          }
        }
      });

      Builder({
        tree: tree
      })
      .exec(function(err, result) {
        assert(!err);
        assert.deepEqual(result, {
          find: 'users',
          filter: {
            name: /Test/
          },
          sort: {},
          projection: {},
          skip: 0,
          limit: 0
        });

        return done();
      });
    });

    it('should generate a LIKE query', function(done) {
      var tree = analyze({
        select: '*',
        from: 'users',
        where: {
          or: [
            {
              name: {
                like: '%Test%'
              }
            },
            {
              not: {
                id: {
                  in: [1, 2, 3]
                }
              }
            }
          ]
        }
      });

      Builder({
        tree: tree
      })
      .exec(function(err, result) {
        assert(!err);
        assert.deepEqual(result, {
          find: 'users',
          filter: {
            '$or': [
              {
                name: /Test/
              },
              {
                id: {
                  '$nin': [1, 2, 3]
                }
              }
            ]
          },
          sort: {},
          projection: {},
          skip: 0,
          limit: 0
        });

        return done();
      });
    });

    it('should generate a startsWith query', function(done) {
      var tree = analyze({
        select: '*',
        from: 'users',
        where: {
          or: [
            {
              name: {
                like: 'Test%'
              }
            },
            {
              not: {
                id: {
                  in: [1, 2, 3]
                }
              }
            }
          ]
        }
      });

      Builder({
        tree: tree
      })
      .exec(function(err, result) {
        assert(!err);
        assert.deepEqual(result, {
          find: 'users',
          filter: {
            '$or': [
              {
                name: /^Test/
              },
              {
                id: {
                  '$nin': [1, 2, 3]
                }
              }
            ]
          },
          sort: {},
          projection: {},
          skip: 0,
          limit: 0
        });

        return done();
      });
    });

    it('should generate an endsWith query', function(done) {
      var tree = analyze({
        select: '*',
        from: 'users',
        where: {
          or: [
            {
              name: {
                like: '%Test'
              }
            },
            {
              not: {
                id: {
                  in: [1, 2, 3]
                }
              }
            }
          ]
        }
      });

      Builder({
        tree: tree
      })
      .exec(function(err, result) {
        assert(!err);
        assert.deepEqual(result, {
          find: 'users',
          filter: {
            '$or': [
              {
                name: /Test$/
              },
              {
                id: {
                  '$nin': [1, 2, 3]
                }
              }
            ]
          },
          sort: {},
          projection: {},
          skip: 0,
          limit: 0
        });

        return done();
      });
    });
  });
});
