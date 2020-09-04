const { chai } = require('./config');
const app = require('../app.js');

const LOGIN_ENDPOINT='/api/auth/login'
const login_data = {
    userName: 'user',
    password: 'password ;)'
};

describe('AuthController', () => {
    describe('POST: login', () => {
        it('it should respond with Failed Login', (done) => {
            chai.request(app)
                .post(LOGIN_ENDPOINT)
                .send({
                    userName: login_data.userName,
                    password: login_data.password,
                })
                .end((err, res) => {
                    res.should.have.status(401);
                    res.body.should.have.property('message').eql('Failed login');
                    done();
                });
        });
        it('it should respond with validation error (validationErrorWithData) and invalid param warning.', (done) => {
            chai.request(app)
                .post(LOGIN_ENDPOINT)
                .send({
                    password: login_data.password,
                })
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.have.property('message').eql('Invalid userName/password');
                    done();
                });
        });
    });
});
