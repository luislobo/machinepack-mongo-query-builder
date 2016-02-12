module.exports = {


  friendlyName: 'Generate Query',


  description: 'Generate a declaritive MongoDb query from RQL',


  cacheable: true,


  sync: true,


  inputs: {

    query: {
      description: 'The RQL query to parse.',
      example: {},
      required: true
    }

  },


  exits: {

    success: {
      variableName: 'result',
      description: 'The generated Mongo statement.',
      example: {}
    },

    error: {
      variableName: 'error',
      description: 'An unexpected error occured.'
    },

    malformed: {
      variableName: 'malformed',
      description: 'Query could not be parsed due to malformed syntax.'
    }

  },


  fn: function generateQuery(inputs, exits) {
    var Pack = require('../index');
    var Parser = require('machinepack-waterline-query-parser');

    // Tokenize the values
    var tokens = Parser.tokenizer({
      expression: inputs.query
    }).execSync();

    // Analyze the tokens
    var tree = Parser.analyzer({
      tokens: tokens
    }).execSync();

    // Generate the Query
    var query = Pack.builder({
      tree: tree
    }).execSync();

    return exits.success(query);
  }

};
