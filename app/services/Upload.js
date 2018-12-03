/* global app, VSError, Youtube, Cloud, Upload */

const _ = require('underscore');
const path = require('path');
const Promise = require('bluebird');
const rename = Promise.promisify(require('fs').rename);
const sharp = require('sharp');
const uuid = require('uuid');
const mime = require('mime');
const fs = require('fs');
const moment = require('moment');

module.exports = {

  file: (f, opts) => {

    const {
      title,
      description,
      localPath,
      uploadToCloud,
      allowed
    } = opts;
    const fileName = opts && opts.name ? opts.name : null;
    const file = Upload.isUploaded(f, fileName);
    const ext = Upload.getExtension(file);
    let type = 'file';
    let name = (fileName || file.originalname || '').replace(`.${ext}`, '').replace(/\s/g, '_');
    let enableCloud = (app.config.aws && app.config.aws.enabled) ? true : false;
    if (uploadToCloud === false) {
      enableCloud = false;
    }

    return Promise.try(() => {

      // Check if file is uploaded
      if (!file) {
        throw new VSError('The file could not be uploaded', 400);
      }

      // Check if the folder is writable
      if (!Upload.isWritable(true)) {
        throw new VSError('The folder don\'t have permission to save the file', 500);
      }

      // Check mimetype
      if (!Upload.isValidMimeType(file)) {
        throw new VSError(`The MIME type of the selected file is not allowed: ${file.mimetype}`, 400);
      }

      if (allowed && Array.isArray(allowed)) {
        if (!_.contains(allowed, ext)) {
          throw new VSError(`The extension file is not allowed: ${ext}`, 400);
        }
      }

      if (_.contains(['gif', 'jpg', 'jpeg', 'png', 'jpe'], ext)) {
        type = 'image';
        name = uuid.v4();
      } else if (_.contains(['quicktime', 'ogg', 'webm', 'mp4', '3gp', 'mov', 'm4v', 'avi', 'mpg'], ext)) {
        type = 'video';
        name = uuid.v4();
      }

      // name file
      let fileTime = '';
      if (type === 'file') {
        fileTime = `_${moment().format('x')}`;
      } else if (fs.existsSync(path.normalize(`${process.cwd()}/public/files/${name}.${ext}`))) {
        fileTime = `_${moment().format('x')}`;
      }
      file.originalname = `${name}${fileTime}.${ext}`;

      const filePath = path.normalize(`${process.cwd()}/${file.path}`);
      const filePublic = path.normalize(`${process.cwd()}/public/files/${file.originalname}`);

      return rename(filePath, filePublic).then( () => {

        if (enableCloud) {
          if (type === 'image') {
            return Upload.uploadImageS3(file, ext);
          }
          if (type === 'video') {
            return Upload.uploadYoutube(file, title, description);
          }
          return Upload.uploadFileS3(file, ext);
        }

        if (type === 'image') {
          return Upload.processImage(file, ext);
        }

        return Upload.processFile(file, ext);

      }).then( (r) => {

        let result = {
          name: file.originalname,
          url: r.url
        };

        if (localPath === true) {
          result.path = path.normalize(`${process.cwd()}/public/files/${file.originalname}`);
        }

        if (type === 'image') {
          result = Object.assign(result, {
            thumbnail: r.thumbnail,
            medium: r.medium,
            large: r.large
          });

        }

        return result;
      });

    });

  },

  /**
     * Check if has a file uploaded
     *
     * @param {type} file
     * @param {type} fieldname
     * @returns {nm$_Upload.module.exports.isUploaded.tmp|Boolean}
     */

  isUploaded: (file, fieldname) => {

    const tmp = (file && file[0]) || null;
    if (!tmp) {
      return false;
    }
    return (tmp.fieldname === 'file' || tmp.fieldname === `''${fieldname}` || tmp.originalname === `''${fieldname}`) ? tmp : false;

  },


  /**
     * Check if a path is writable
     * TODO: Check if the folder has permissions
     *
     * @param {type} _path
     * @returns {Boolean}
     */
  isWritable: _path => _path,

  /**
     * Method to get the file extension
     *
     * @param {type} file
     * @param {type} name
     * @returns {String}
     */
  getExtension: (file, name) => {

    const extTemporal = (name || '').split('.').pop();
    let ext = (file.originalname || '').split('.').pop();
    if (!ext || ext === 'blob') {
      const extMimeType = Upload.isValidMimeType(file).split('/').pop();
      if (!extMimeType) {
        ext = extTemporal || extMimeType;
      }
    }
    return ext.toLowerCase();

  },

  /**
     * Check mimetype image
     *
     * @param {object} file
     * @returns {string}
     */
  isValidMimeType: (file) => {

    const mimetype = file.mimetype || mime.getType( file ? file.path || {} : '');

    // jpe?g, png, gif
    const images = ['image/jpeg', 'image/jpg', 'image/pjpeg', 'image/gif', 'image/png'];

    // quicktime, ogg, webm, mp4, 3gp, mov, m4v, avi, mpg
    const videos = ['video/quicktime', 'video/ogg', 'video/webm', 'video/mp4', 'video/x-mp4', 'video/3gp', 'video/x-3gp', 'video/mov', 'video/x-mov', 'video/m4v', 'video/x-m4v', 'video/avi', 'video/x-avi', 'video/mpg', 'video/x-mpg'];

    // pdf, doc, docx, xls, xlsx, xlsb, ppt, pptx, csv
    const files = ['application/pdf', 'application/x-pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'text/csv', 'application/vnd.ms-excel.sheet.binary.macroenabled.12'];

    // zip, rar, txt
    const zip = ['application/zip', 'application/x-rar', 'application/gzip', 'text/plain'];

    const validType = [...images, ...videos, ...files, ...zip];

    return _.find( validType, item => item === mimetype);

  },

  /**
     * Process Images
     *
     * @param {object} file
     * @param {string} ext
     * @returns {object}
     */
  processImage: (file, ext) => {

    const filePublic = path.normalize(`${process.cwd()}/public/files/${file.originalname}`);
    const thumbnailPublic = filePublic.replace(`.${ext}`, `-thumbnail.${ext}`);
    const largePublic = filePublic.replace(`.${ext}`, `-large.${ext}`);
    const mediumPublic = filePublic.replace(`.${ext}`, `-medium.${ext}`);
    return Promise.props({
      thumbnail: sharp(filePublic).resize(200, 200).toFile(thumbnailPublic),
      medium: sharp(filePublic).resize(640, 640).max().toFile(mediumPublic),
      large: sharp(filePublic).resize(1200, 1200).max().toFile(largePublic)
    }).then( () => {
      const tmpThumbnail = file.originalname.replace(`.${ext}`, `-thumbnail.${ext}`);
      const tmpMedium = file.originalname.replace(`.${ext}`, `-medium.${ext}`);
      const tmpLarge = file.originalname.replace(`.${ext}`, `-large.${ext}`);
      return {
        name: file.orinalname,
        url: `//${app.config.settings.host}/files/${file.originalname}`,
        thumbnail: `//${app.config.settings.host}/files/${tmpThumbnail}`,
        medium: `//${app.config.settings.host}/files/${tmpMedium}`,
        large: `//${app.config.settings.host}/files/${tmpLarge}`
      };
    });

  },

  /**
     * Process Files
     *
     * @param {object} file
     * @returns {object}
     */
  processFile: file => Promise.resolve({
    name: file.orinalname,
    url: `//${app.config.settings.host}/files/${file.originalname}`
  }),

  /**
     * Upload image to s3
     *
     * @param {type} file
     * @param {string} ext
     * @returns {Object}
     */
  uploadImageS3: (file, ext) => {

    const filePublic = path.normalize(`${process.cwd()}/public/files/${file.originalname}`);
    return Cloud.image(filePublic, ext).then( r => ({
      name: file.originalname,
      url: r.original || '',
      thumbnail: r.thumbnail || '',
      medium: r.medium || '',
      large: r.large || ''
    }));

  },

  /**
     * Upload file to s3
     *
     * @param {type} file
     * @param {string} ext
     * @returns {Object}
     */
  uploadFileS3: (file) => {

    const filePublic = path.normalize(`${process.cwd()}/public/files/${file.originalname}`);
    return Cloud.file(filePublic).then( r => ({
      name: file.originalname,
      url: r
    }));

  },

  /**
     * Upload to Youtube
     *
     * @param {type} file
     * @param {string} title
     * @param {string} description
     * @returns {Object}
     */
  uploadYoutube: (file, title, description) => {

    const result = {
      name: file.originalname,
      url: '',
      youtubeId: ''
    };
    const filePublic = path.normalize(`${process.cwd()}/public/files/${file.originalname}`);
    return Youtube.upload({ video: filePublic, title, description }).then( (upload) => {
      result.url = `https://www.youtube.com/watch?v=${upload.id}`;
      result.youtubeId = upload.id;
      return result;
    });

  }

};
