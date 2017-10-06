const chai = require('chai');
const chaiHttp = require('chai-http');

global.chai = chai;
global.expect = chai.expect;
global.assert = chai.assert;

chai.use(chaiHttp);
