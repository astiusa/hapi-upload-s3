var handler = require('./handler');
var AWS = require('aws-sdk');
var path = require('path');
var uuid = require('uuid');
var datefmt = require('datefmt');

module.exports = function(plugin, options, next) {

  options = options || {};

  var endpoint = options.endpoint || '/upload';

  var s3 = new AWS.S3({
    accessKeyId: options.s3AccessKey,
    secretAccessKey: options.s3SecretAccessKey,
    region: options.s3Region
  });

  var getFileKey = function(filename) {
    var fileExtension = path.extname(filename);
    var fileKey = datefmt('%Y-%m-%d', new Date()) + '/' + uuid.v4() + fileExtension;
    return fileKey;
  };

  var getS3Url = function(fileKey) {
    var s3UrlBase = 'https://'+options.s3Bucket+'.s3.amazonaws.com/';
    return s3UrlBase + fileKey;
  };

  var handleUpload = function(err, fileKey, s3Url, reply) {
    if(err) {
      return reply(err);
    }
    return reply(s3Url);
  };

  plugin.bind({
    options: options,
    s3: s3,
    bucketName: options.s3Bucket,
    Hapi: plugin.hapi,
    getFileKey: options.getFileKey || getFileKey,
    getS3Url: options.getS3Url || getS3Url,
    handleUpload: options.handleUpload || handleUpload
  });

  plugin.route([
    { path: endpoint, method: 'POST', config: handler.upload },
    { path: endpoint + '/image/{type}/{width}/{height}', method: 'POST', config: handler.image }
  ]);
  next();
};

module.exports.attributes = {
  name: 'hapi-upload-s3',
  pkg: require('../package.json')
};
