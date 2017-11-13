var Sequelize = require('sequelize');
module.exports = function(app) {
  if (app === undefined) {
    app = this;
  }
  var sequelize = app.get('sequelize');
  var User = sequelize.define('User', {
    name: {
      type: Sequelize.STRING
    }
  }, {
    classMethods: {
      associate: function(models) {
        models.User.hasMany(models.Todo);
      }
    }
  });
  return User;
};