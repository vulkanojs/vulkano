/**
 *
 * AWS Config
 *
 */

module.exports = {

  enabled: false,

  accessKeyId: process.env.AWS_ACCESS_KEY_ID || null,

  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || null,

  bucket: process.env.AWS_S3_BUCKET || null,

  region: process.env.AWS_S3_REGION || null,

  path: process.env.AWS_S3_PATH || null,

  acl: process.env.AWS_S3_ACL || 'public-read',

  adapter: process.env.AWS_S3_ADAPTER || null,

};
