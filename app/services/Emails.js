const sgMail = require('@sendgrid/mail');
const nunjucks = require('nunjucks');
const Promise = require('bluebird');

sgMail.setApiKey(app.config.sendgrid ? app.config.sendgrid.apiKey || '' : '');

module.exports = {

  /**
   * Send Example email
   *
   * @param {Object} payload
   * @returns Promise
   */
  example(payload) {

    const defaultProps = {
      to: payload.to || 'your@email.com',
      subject: payload.subject || 'This is a email test',
      data: {}
    };

    const msg = { ...defaultProps, ...payload };

    return this._template('example', msg.data || {})
      .then( (html) => this._send({ ...msg, html }) );

  },

  /**
   * Render html template and return it as string
   *
   * @param {String} template
   * @param {Object} data
   * @returns String
   */
  _template(template, data) {

    return new Promise( (resolve, reject) => {
      nunjucks.render(`${APP_PATH}/views/_shared/emails/${template}.html`, data || {}, (err, html) => {
        if (err) {
          return reject(err);
        }
        return resolve(html);
      });
    });

  },

  /**
   * Send email
   *
   * @param {Object} props { from, to, subject, html, cc, cco, attachments }
   * @returns Promise
   */
  _send: (props) => {

    const {
      sendgrid
    } = app.config || {};

    const defaultProps = {
      from: sendgrid.fromEmail,
      fromname: sendgrid.fromName
    };

    const merged = { ...defaultProps, ...props };

    return sgMail.send(merged);

  }

};
