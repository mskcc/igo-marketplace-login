import {LOGIN_ENDPOINT, TEST_ENDPOINT} from "../config";
import axios from 'axios';

const getData = (resp) => {
    const content = resp.data || {};
    const data = content.data || {};
    return data;
};

const HTTP = axios.create({
    withCredentials: true
})

export function testGetEndpoint() {
    /*
    return new Promise((resolve) => { resolve(API_PROJECT) })
        .then(resp => {return getData(resp)})
        .catch(error => {throw new Error('Unable to get Get Events: ' + error) });
     */
    return axios
        .get(`${TEST_ENDPOINT}`, { withCredentials: true })
        .then(resp => {return getData(resp) })
        .catch(error => {throw new Error('Unable to get Get Events: ' + error) });
}

export function sendLoginRequest(userName, password, redirect) {
    /*
    return new Promise((resolve) => { resolve(API_PROJECT) })
        .then(resp => {return getData(resp)})
        .catch(error => {throw new Error('Unable to get Get Events: ' + error) });
     */
    return axios
        .post(`${LOGIN_ENDPOINT}/login`, { userName, password, redirect }, {withCredentials: true})
        .then(resp => {return getData(resp) })
        .catch(error => {throw new Error('Unable to get Get Events: ' + error) });
}
