/* global app, VSError, Youtube, Cloud */

const _ = require('underscore');
const path = require('path');
const Promise = require('bluebird');
const rename = Promise.promisify(require('fs').rename);
const sharp = require('sharp');
const uuid = require('uuid');

module.exports = {

    file: function (f, opts) {

        const { title, description, localPath, uploadToCloud, allowed } = opts || {};
        let fileName = opts && opts.name ? opts.name : null;
        let file = this.isUploaded(f, fileName);
        let type = 'file';
        const ext = this.getExtension(file);
        let name = (fileName || file.originalname || '').replace('.' + ext, '');
        let enableCloud = (app.config.aws && app.config.aws.isEnabled) ? true : false;
        if (uploadToCloud === false) {
          enableCloud = false;
        }

        return Promise.try( () => {

            // Check if file is uploaded
            if (!file) {
                throw new VSError('The file could not be uploaded', 400);
            }

            // Check if the folder is writable
            if (!this.isWritable()) {
                throw new VSError('The folder don\'t have permission to save the file', 500);
            }

            // Check mimetype
            if (!this.isValidMimeType(file.mimetype, 'file')) {
                throw new VSError('The MIME type of the selected file is not allowed: ' + file.mimetype, 400);
            }

            if (allowed && Array.isArray(allowed)) {
              if (!_.contains(allowed, ext)) {
                throw new VSError('The extension file is not allowed: ' + ext, 400);
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
            file.originalname = name.replace(/\s/g, '_') + '.' + ext;

            let filePath = path.normalize(process.cwd() + '/' + file.path);
            let filePublic = path.normalize(process.cwd() + '/public/files/' + file.originalname);

            return rename(filePath, filePublic).then( () => {

                if (enableCloud) {
                    if (type === 'image') {
                        return this.uploadImageS3(file, ext);
                    } else if (type === 'video') {
                        return this.uploadYoutube(file, title, description);
                    } else {
                        return this.uploadFileS3(file, ext);
                    }
                } else if (type === 'image') {
                    return this.processImage(file, ext);
                } else {
                    return this.processFile(file, ext);
                }

            }).then( (r) => {

                let result = {
                    name: file.originalname,
                    url: r.url
                };

                if (localPath === true) {
                  result.path = path.normalize(process.cwd() + '/public/files/' + file.originalname);
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

    isUploaded: function (file, fieldname) {

        let tmp = (file && file[0]) || null;
        if (!tmp) {
            return false;
        }
        return (tmp.fieldname === 'file' || tmp.fieldname === '' + fieldname || tmp.originalname === '' + fieldname) ? tmp : false;

    },


    /**
     * Check if a path is writable
     *
     * @param {type} path
     * @returns {Boolean}
     */
    isWritable: function (_path) {

        // TODO: Check if the folder has permissions
        return true;

    },

    /**
     * Method to get the file extension
     *
     * @param {type} file
     * @param {type} name
     * @returns {String}
     */
    getExtension: function (file, name) {

        let ext = (file.originalname || '').split('.').pop();
        let extTemporal = (name || '').split('.').pop();
        if (!ext || ext === 'blob') {
            let extMimeType = (this.isValidMimeType(file.mimetype) || '').split('/').pop();
            if (!extMimeType) {
                ext = extTemporal || extMimeType;
            }
        }
        return ext.toLowerCase();

    },

    /**
     * Check mimetype image
     *
     * @param {string} mimetype
     * @returns {string}
     */
    isValidMimeType: function (mimetype) {

        // jpe?g, png, gif
        const images = ['image/jpeg', 'image/jpg', 'image/pjpeg', 'image/gif', 'image/png'];

        // quicktime, ogg, webm, mp4, 3gp, mov, m4v, avi, mpg
        const videos = ['video/quicktime', 'video/ogg', 'video/webm', 'video/mp4', 'video/x-mp4', 'video/3gp', 'video/x-3gp', 'video/mov', 'video/x-mov', 'video/m4v', 'video/x-m4v', 'video/avi', 'video/x-avi', 'video/mpg', 'video/x-mpg'];

        // pdf, doc, docx, xls, xlsx, xlsb, ppt, pptx, csv
        const files = ['application/pdf', 'application/x-pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'text/csv', 'application/vnd.ms-excel.sheet.binary.macroenabled.12'];

        // zip, rar, txt
        const zip = ['application/zip', 'application/x-rar', 'application/gzip', 'text/plain'];

        const validType = [...images, ...videos, ...files, ...zip];
        return _.find( validType, (item) => {
            return item === mimetype;
        });

    },

    /**
     * Process Images
     *
     * @param {object} file
     * @param {string} ext
     * @returns {object}
     */
    processImage: function (file, ext) {

        let filePublic = path.normalize(process.cwd() + '/public/files/' + file.originalname);
        let thumbnailPublic = filePublic.replace('.' + ext, '-thumbnail.' + ext);
        let largePublic = filePublic.replace('.' + ext, '-large.' + ext);
        let mediumPublic = filePublic.replace('.' + ext, '-medium.' + ext);
        return Promise.props({
            thumbnail: sharp(filePublic).resize(200, 200).toFile(thumbnailPublic),
            medium: sharp(filePublic).resize(640, 640).max().toFile(mediumPublic),
            large: sharp(filePublic).resize(1200, 1200).max().toFile(largePublic)
        }).then( () => {
            return {
                name: file.orinalname,
                url: `//${app.config.settings.host}/files/${file.originalname}`,
                thumbnail: `//${app.config.settings.host}/files/${ (file.originalname).replace('.' + ext, '-thumbnail.' + ext)}`,
                medium: `//${app.config.settings.host}/files/${ (file.originalname).replace('.' + ext, '-medium.' + ext) }`,
                large: `//${app.config.settings.host}/files/${ (file.originalname).replace('.' + ext, '-large.' + ext) }`
            };
        });

    },

    /**
     * Process Files
     *
     * @param {object} file
     * @returns {object}
     */
    processFile: function (file) {

        return Promise.resolve({
            name: file.orinalname,
            url: `//${app.config.settings.host}/files/${file.originalname}`
        });

    },

    /**
     * Upload image to s3
     *
     * @param {type} file
     * @param {string} ext
     * @returns {Object}
     */
    uploadImageS3: function (file, ext) {

        let filePublic = path.normalize(process.cwd() + '/public/files/' + file.originalname);
        return Cloud.image(filePublic, ext).then( (r) => {
            return {
                name: file.originalname,
                url: r.original || '',
                thumbnail: r.thumbnail || '',
                medium: r.medium || '',
                large: r.large || ''
            };
        });

    },

    /**
     * Upload file to s3
     *
     * @param {type} file
     * @param {string} ext
     * @returns {Object}
     */
    uploadFileS3: function (file, ext) {

        let filePublic = path.normalize(process.cwd() + '/public/files/' + file.originalname);
        return Cloud.file(filePublic).then( (r) => {
            return {
                name: file.originalname,
                url: r
            };
        });

    },

    /**
     * Upload to Youtube
     *
     * @param {type} file
     * @param {string} title
     * @param {string} description
     * @returns {Object}
     */
    uploadYoutube: function (file, title, description) {

        let result = {
            name: file.originalname,
            url: '',
            youtubeId: ''
        };
        let filePublic = path.normalize(process.cwd() + '/public/files/' + file.originalname);
        return Youtube.upload({video: filePublic, title, description}).then( (upload) => {
            result.url = 'https://www.youtube.com/watch?v=' + upload.id;
            result.youtubeId = upload.id;
            return result;
        });

    }

};

