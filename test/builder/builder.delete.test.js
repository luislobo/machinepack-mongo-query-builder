var Builder = require('../../index').builder;
var analyze = require('../support/analyze');
var assert = require('assert');

describe('Builder ::', function() {
  describe('DELETE statements', function() {
    it('should generate a simple query with an DELETE statement', function(done) {
      var tree = analyze({
        del: true,
        from: 'accounts',
        where: {
          activated: false
        }
      });

      Builder({
        tree: tree
      })
      .exec(function(err, result) {
        assert(!err);
        assert.deepEqual(result, {
          delete: 'accounts',
          deletes: [
            {
              q: {
                activated: false
              },
              limit: 0
            }
          ]
        });

        return done();
      });
    });
  });
});
