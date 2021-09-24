/* global Cloud */

const Promise = require('bluebird');
const S3 = require('s3-uploader');
const fs = require('fs');
const AWS = require('aws-sdk');
const mime = require('mime');

module.exports = {

  clientImage: () => {

    const {
      aws
    } = app.config;

    const client = new S3(aws.bucket, {
      aws: {
        path: `${Filter.get(aws.path, 'trim', '/')}/`,
        region: aws.region,
        acl: aws.acl,
        accessKeyId: aws.accessKeyId,
        secretAccessKey: aws.secretAccessKey
      },
      cleanup: {
        versions: true,
        original: true
      },
      versions: [
        {
          quality: 100
        }
      ]
    });
    return client;

  },

  image: (file, ext) => {

    const {
      aws
    } = app.config;

    const {
      adapter
    } = aws || {};

    if (adapter === 'DigitalOcean') {
      const mimeType = mime.getType(file);
      return Cloud.file(file, { mimeType });
    }

    const client = Cloud.clientImage((ext || 'jpg').toLowerCase());
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

  file: (file, props) => {

    const {
      aws
    } = app.config;

    const {
      customFolder,
      mimeType
    } = props || {};

    const {
      adapter,
      region
    } = aws;

    AWS.config.region = aws.region;
    AWS.config.accessKeyId = aws.accessKeyId;
    AWS.config.secretAccessKey = aws.secretAccessKey;

    let s3;

    if (adapter === 'DigitalOcean') {
      s3 = new AWS.S3({
        endpoint: new AWS.Endpoint(`${region}.digitaloceanspaces.com`)
      });
    } else {
      s3 = new AWS.S3();
    }

    const tempName = file.split('/').pop();
    const name = customFolder ? `${Filter.get(customFolder, 'trim', '/')}/${tempName}` : tempName;

    return new Promise((resolve, reject) => {
      fs.readFile(file, (err, data) => {
        if (err) {
          reject(err);
        }
        const params = {
          Bucket: aws.bucket,
          Key: `${Filter.get(aws.path, 'trim', '/')}/${name}`,
          ACL: aws.acl,
          Body: data,
          ContentType: mimeType || 'binary/octet-stream '
        };
        s3.putObject(params, (err2) => {

          if (err2) {
            reject(err2);
            return;
          }

          if (adapter === 'DigitalOcean') {
            resolve(`https://${aws.bucket}.${aws.region}.digitaloceanspaces.com/${aws.path}/${name}`);
          } else {
            resolve(`https://s3-${aws.region}.amazonaws.com/${aws.bucket}/${aws.path}/${name}`);
          }

        });
      });
    });

  }

};
