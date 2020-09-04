let chai = require('chai');
let chaiHttp = require('chai-http');
let should = chai.should();
chai.use(chaiHttp);

//Export this to use in multiple files
module.exports = {
    chai: chai,
    should: should
};
