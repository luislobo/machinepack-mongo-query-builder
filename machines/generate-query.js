module.exports = {


  friendlyName: 'Generate Query',


  description: 'Generates the necessary mongo db queries',


  cacheable: false,


  sync: false,


  inputs: {

  },


  exits: {

    success: {
      variableName: 'result',
      description: 'Done.',
    },

  },


  fn: function(inputs, exits) {
    return exits.success();
  },

};
