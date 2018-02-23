/* global app */

const Promise = require('bluebird');
const S3 = require('s3-uploader');
const fs = require('fs');
const AWS = require('aws-sdk');

module.exports = {

  clientImage: (ext) => {
    const client = new S3(app.config.aws.bucket, {
      aws: {
        path: `${app.config.aws.path}/`,
        region: app.config.aws.region,
        acl: 'public-read',
        accessKeyId: app.config.aws.accessKeyId,
        secretAccessKey: app.config.aws.secretAccessKey
      },
      cleanup: {
        versions: false,
        original: false
      },
      versions: [
        {
          format: ext === 'png' ? 'png' : 'jpg',
          quality: 95
        },
        {
          maxHeight: 1200,
          maxWidth: 1200,
          format: ext === 'png' ? 'png' : 'jpg',
          suffix: '-large',
          quality: 90
        },
        {
          maxWidth: 640,
          format: ext === 'png' ? 'png' : 'jpg',
          suffix: '-medium'
        },
        {
          maxHeight: 200,
          maxWidth: 200,
          format: ext === 'png' ? 'png' : 'jpg',
          aspect: '1:1',
          suffix: '-thumbnail'
        }
      ]
    });
    return client;

  },

  image: (file, ext) => {

    const client = this.clientImage((ext || 'jpg').toLowerCase());
    return new Promise((resolve, reject) => {
      client.upload(file, {}, (err, versions) => {
        if (err) {
          return reject(err);
        }
        const result = {
          original: '',
          large: '',
          medium: '',
          thumbnail: ''
        };
        versions.forEach((image) => {
          if (image.url.indexOf('-large') !== -1) {
            result.large = image.url;
          } else if (image.url.indexOf('-medium') !== -1) {
            result.medium = image.url;
          } else if (image.url.indexOf('-thumb') !== -1) {
            result.thumbnail = image.url;
          } else {
            result.original = image.url;
          }
        });
        return resolve(result);
      });
    });

  },

  file: (file) => {

    AWS.config.region = app.config.aws.region;
    AWS.config.accessKeyId = app.config.aws.accessKeyId;
    AWS.config.secretAccessKey = app.config.aws.secretAccessKey;

    const s3 = new AWS.S3();
    const name = file.split('/').pop();

    return new Promise((resolve, reject) => {
      fs.readFile(file, (err, data) => {
        if (err) {
          reject(err);
        }
        const params = {
          Bucket: app.config.aws.bucket,
          Key: `${app.config.aws.path}/${name}`,
          ACL: 'public-read',
          Body: data
        };
        s3.putObject(params, (err2) => {
          if (err2) {
            reject(err2);
          } else {
            resolve(`https://s3-${app.config.aws.region}.amazonaws.com/${app.config.aws.bucket}/${app.config.aws.path}/${name}`);
          }
        });
      });
    });

  }
};
