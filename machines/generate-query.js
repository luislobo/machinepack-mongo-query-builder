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
    }

  },


  fn: function generateQuery(inputs, exits) {
    var Pack = require('../index');

    // Tokenize the values
    var tokens = Pack.tokenizer({
      expression: inputs.query
    }).execSync();

    // Analyze the tokens
    var tree = Pack.analyzer({
      tokens: tokens
    }).execSync();

    // Generate the Query
    var query = Pack.builder({
      tree: tree
    }).execSync();

    return exits.success(query);
  }

};
