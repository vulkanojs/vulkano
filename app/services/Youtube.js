/* global VSError, __dirname */

const Promise = require('bluebird');
const moment = require('moment');
const google = require('googleapis');
const googleAuth = require('google-auth-library');
const path = require('path');
const fs = require('fs');
const SCOPES = ['https://www.googleapis.com/auth/youtube'];
const CREDENTIALS_DIR = path.resolve(__dirname, '../config/credentials/');
const TOKEN = CREDENTIALS_DIR + '/youtube_token.json';
const CREDENTIALS = require(CREDENTIALS_DIR + '/client_secret.json');

module.exports = {

  auth: function () {

    const oauth2Client = this._getOAuthClient();
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      include_granted_scopes: true,
      scope: SCOPES
    });
    return authUrl;

  },

  getToken: function (code) {

    const oauth2Client = this._getOAuthClient();
    return new Promise( (resolve, reject) => {
      oauth2Client.getToken(code, (err, tokens) => {
        return (err) ? reject(err) : resolve(tokens);
      });
    }).then( (tokens) => {
      return this.saveToken(tokens);
    });

  },

  saveToken: function (tokens) {

    return Promise.try( () => {
      console.log(tokens);
      fs.writeFile(TOKEN, JSON.stringify(tokens));
    });

  },

  upload: function (props) {

    const {video, title, description} = props;

    return this._connect().then( (oauth2Client) => {

      const youtube = google.youtube({
        version: 'v3',
        auth: oauth2Client
      });

      const options = {
        part: 'id,snippet,status',
        notifySubscribers: false,
        resource: {
          snippet: {
            title: title || 'Tmp title - ' + moment().format('x'),
            description: description || ''
          },
          status: {
            privacyStatus: 'unlisted',
            embeddable: true
          }
        },
        media: {
          body: fs.createReadStream(video)
        }
      };

      return new Promise( (resolve, reject) => {
        youtube.videos.insert(options, (err, data) => {
          if (err) {
            console.error('Error: ' + err);
            return reject('Error to upload file: ' + err);
          }
          return resolve(data);
        });
      });

    });

  },

  update: function (props) {

    const {id, title, description, visibility} = props;

    return this._connect().then( (oauth2Client) => {

      const youtube = google.youtube({
        version: 'v3',
        auth: oauth2Client
      });

      const options = {
        fields: 'snippet,status',
        part: 'snippet,status',
        resource: {
          id: String(id),
          snippet: {
            title: title || ('Tmp title ' + moment().format('x')),
            description: description || '',
            categoryId: '24'
          },
          status: {
            privacyStatus: visibility || 'unlisted',
            embeddable: true
          }
        }
      };

      return new Promise( (resolve) => {
        youtube.videos.update(options, (err, response) => {
          if (err) {
            console.log(err);
          }
          resolve(true);
        });
      });

    });

  },

  checkVideo: function (id) {

    return this._connect().then( (oauth2Client) => {

      const youtube = google.youtube({
        version: 'v3',
        auth: oauth2Client
      });

      const options = {
        part: 'snippet,status',
        id: String(id)
      };

      return new Promise( (resolve) => {
        youtube.videos.list(options, (err, response) => {
          if (err) {
            console.log(err);
            return resolve(false);
          }
          const item = response.items && response.items[0];
          const snippet = item ? (item.snippet || {}) : {};
          const status = item && item.status ? (item.status.uploadStatus || 'pending') : 'pending';
          const embeddable = item && item.status && item.status.embeddable;
          const title = snippet.title || '';
          const description = snippet.description || '';
          const publishedAt = snippet.publishedAt || '';
          resolve({title, description, status, embeddable, publishedAt});
        });
      });

    });

  },

  _connect: function () {

    let token;
    try {
      token = require(TOKEN);
    } catch (e) {
      token = null;
    }

    return Promise.try( () => {
      if (!token) {
        throw new VSError('Invalid Token', 400);
      }
      const oauth2Client = this._getOAuthClient();
      const expiryToken = {
        expiry_date: true
      };
      oauth2Client.credentials = Object.assign(token, expiryToken);
      return Promise.try( () => {
        return oauth2Client;
      });
    });

  },

  _getOAuthClient: function () {

    const clientSecret = CREDENTIALS.web.client_secret;
    const clientId = CREDENTIALS.web.client_id;
    const redirectUrl = CREDENTIALS.web.redirect_uris[0];
    const auth = new googleAuth();
    const oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);
    return oauth2Client;

  }

};
