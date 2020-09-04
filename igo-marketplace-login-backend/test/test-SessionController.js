const { chai } = require('./config');
const app = require('../app.js');

const SESSION_ENDPOINT='/api/session/user';
describe('Session', () => {
    describe('GET: user session', () => {
        it('it should respond with unauthorized w/o validated cookie', (done) => {
            chai.request(app)
                .get(SESSION_ENDPOINT)
                .end((err, res) => {
                    res.should.have.status(401);
                    res.body.should.have.property('message').eql('Not authorized - please log in');
                    done();
                });
        });
    });
});
