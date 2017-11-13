var Sequelize = require('sequelize');
module.exports = function(app) {
  if (app === undefined) {
    app = this;
  }
  var sequelize = app.get('sequelize');
  var Todo = sequelize.define('Todo', {
    text: {
      type: Sequelize.STRING
    },
    completed: {
      type: Sequelize.BOOLEAN,
      defaultValue: "false"
    }
  });
  return Todo;
};