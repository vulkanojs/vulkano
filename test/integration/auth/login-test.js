/* global chai, expect */

const constants = require('../constants');

describe('Authentication', function () {

  describe('Login', function () {

    console.log(constants.settings.host);

    it('User can log in', function (done) {
      chai.request(constants.settings.host).
      post('/auth/login').
      send({ email: constants.email, password: constants.password }).
      end(function (err, res) {
        expect(err).to.be.falsy;
        expect(res.status).to.equal(200);
        expect(res.body).to.be.a('object');
        expect(res.body).to.have.property('data').that.is.a('object');
        expect(res.body.data).to.have.property('token').that.is.a('string');
      done();
      });
    });

    it('Invalid Login', function (done) {
        chai.request(constants.settings.host).
        post('/auth/login').
        send({ email: 'test@invalid.com', password: '123455x' }).
        end(function (err, res) {
          expect(err).to.be.falsy;
          expect(res.status).to.equal(401);
          expect(res.body).to.be.a('object');
          expect(res.body).to.have.property('error').that.is.a('object');
          expect(res.body.error).to.have.property('detail').that.is.a('string');
        done();
      });
    });

  });

});
