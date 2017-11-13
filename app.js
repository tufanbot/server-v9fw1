var path = require('path');
var feathers = require('feathers');
var rest = require('feathers-rest');
var socketio = require('feathers-socketio');
var service = require('feathers-sequelize');
var bodyParser = require('body-parser');
var requireDir = require('require-dir');
var models = require('./models');
var modelsDir = requireDir('./models');
var configuration = require('feathers-configuration');
var rp = require('request-promise');
var config = require('config');
var AWS = require('aws-sdk');

var app;
var serverReady = false;
var dbconfig = {};

var getConfig = function() {
  console.log('getConfig');
  var s3 = new AWS.S3();
  return new Promise(function(resolve,reject) {
    console.log(config);
    var bucket = process.env.TufanExchange || config.bucket;
    var path = process.env.xchangePath;
    var key = path + '/' + config.key;
    console.log('Bucket - ' + bucket);
    console.log('path - ' + path);
    console.log('key - ' + key);
    s3.getObject({Bucket: bucket , Key: key},
      function(err, data) {
        if (err) {
          console.log(err);
          reject(err);
        }
        dbconfig = JSON.parse(data.Body).db;
        console.log(dbconfig);
        resolve(dbconfig);
      }
    );
  });
}

function init(dbconfig) {
  // Configure feathers
  app = feathers()
        .configure(configuration(__dirname, '.'))
        // Enable REST services
        .configure(rest())
        // Enable Socket.io services
        .configure(socketio())
        // Turn on JSON parser for REST services
        .use(bodyParser.json())
        .use(function _f(req, res, next) {
          res.header('Access-Control-Allow-Origin', '*');
          res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
          res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
          next();
        })
        // Turn on URL-encoded parser for REST services
        .use(bodyParser.urlencoded({ extended: true }));
  // Configure models
  models(app, dbconfig);
  // Create a feathers instance.
  for (var model in modelsDir) {
    if (model === 'index') {
      continue;
    }
    var svc = service({ Model: app.get('models')[model] });
    var pathStr = '/' + model.toLowerCase() + 's';
    app.use(pathStr, svc);
  };
}

var sendReq = function _sendReq(reqOpts, context) {
  console.log('sendReq');
  rp(reqOpts)
  .then(function _then(body) {
    context.succeed({body: body});
  })
  .catch(function _catch(err) {
    console.log(err);
    context.fail(err);
  });
};

exports.handler = function _f(event, context) {
  var reqopts = {
    method: event.method,
    uri: 'http://127.0.0.1:3000' + event.resource,
    body: event.body,
    json: true
  };
  reqopts.uri = reqopts.uri.replace('{id}', event.id);
  console.log(reqopts);
  
  if (!serverReady) {
    try {
      getConfig().then(function(dbconfig) {
        init(dbconfig);
        app.get('sequelize').sync()
        .then(function _then() {
          app.listen(3000, function() {
            console.log(`Feathers server listening on port 3000`);
            serverReady = true;
            if (event.resource) {
              sendReq(reqopts, context);
            }
          });
        });
      })
    } catch (err) {
      console.log(err);
    }
  } else {
    if (event.resource) {
      sendReq(reqopts, context);
    } else {
      context.succeed('Done with init');
    }
  }
};
