import {LOGIN_ENDPOINT} from "../config";
import axios from 'axios';
export function sendLoginRequest(userName, password, redirect) {
    return axios.post(`${LOGIN_ENDPOINT}/login`, { userName, password, redirect }, {withCredentials: true});
}
