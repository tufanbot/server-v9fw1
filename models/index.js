var Sequelize = require('sequelize');
var requireDir = require('require-dir');
var models = requireDir('.');

module.exports = function(app, dbconfig) {
  try {
    var sequelize = new Sequelize(
      dbconfig.dbname, dbconfig.username, dbconfig.password, {
      host: dbconfig.host,
      port: dbconfig.port,
      dialect: dbconfig.dialect,
      storage: dbconfig.storage // for sqlite only
    });
    app.set('sequelize', sequelize);

    for (var model in models) {
      if (model === 'index') {
        continue;
      }
      app.configure(models[model]);
    }
    app.set('models', sequelize.models);
    Object.keys(sequelize.models).forEach(function(modelName) {
      if ("associate" in sequelize.models[modelName]) {
        sequelize.models[modelName].associate(sequelize.models);
      }
    });
    console.log('Done configuring models');
  } catch (err) {
    console.log(err);
  }
};
