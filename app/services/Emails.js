/* global app */

const helper = require('sendgrid').mail;
const sg = require('sendgrid')(app.config.sendgrid ? app.config.sendgrid.apiKey || '' : '');
const nunjucks = require('nunjucks');
const moment = require('moment');
const Promise = require('bluebird');
module.exports = {

  example: function (payload) {
    let msg = {};
    msg.to = payload.to || 'argordmel@gmail.com';
    msg.subject = payload.subject || 'This is a email test';
    return new Promise(function (resolve, reject) {
      nunjucks.render('emails/example.html', payload.data || {}, (err, data) => {
        return (err) ? reject(err) : resolve(data);
      });
    }).then((data) => {
      msg.content = data;
      return this._send(msg);
    }).catch((err) => {
      console.log(err);
    });
  },

  // builds a new message
  _build: function (msg) {

    if (!msg.mailtype) {
      msg.mailtype = "text/html";
    }

    if (!msg.from) {
      msg.from = app.config.sendgrid.fromEmail;
    }

    if (!msg.fromname) {
      msg.fromname = app.config.sendgrid.fromName;
    }

    const fromEmail = new helper.Email(msg.from, msg.fromname);
    const toEmail = new helper.Email(msg.to);
    const subject = msg.subject;
    const content = new helper.Content(msg.mailtype, msg.content);
    const personalization = new helper.Personalization();
    if (msg.cc) {
      if (Array.isArray(msg.cc)) {
        msg.cc.forEach(function (email) {
          personalization.addCc(email);
        });
      } else {
        personalization.addCc(msg.cc);
      }
    }
    const mail = new helper.Mail(fromEmail, subject, toEmail, content);
    if (msg.attachments && Array.isArray(msg.attachments)) {
      msg.attachments.forEach(function (file) {
        mail.addAttachment(file || {});
      });
    }
    const message = mail.toJSON();
    return message;

  },

  // sends a mail/send request to sendgrid
  _send: function (msg) {

    const request = sg.emptyRequest({
      method: 'POST',
      path: '/v3/mail/send',
      body: this._build(msg)
    });
    return new Promise((resolve, reject) => {
      sg.API(request, (err, response) => {
        return (err) ? reject(err) : resolve(response);
      });
    });

  }

};
