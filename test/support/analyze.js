/**
 * Given a criteria format, return the analyzed version.
 * For use with Builder tests.
 */

var Tokenizer = require('machinepack-waterline-query-parser').tokenizer;
var Analyzer = require('machinepack-waterline-query-parser').analyzer;

module.exports = function(expression) {
  var tokens = Tokenizer({
    expression: expression
  }).execSync();

  var tree = Analyzer({
    tokens: tokens
  }).execSync();

  return tree;
};
