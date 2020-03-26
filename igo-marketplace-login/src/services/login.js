import {BOOK_ENDPOINT, LOGIN_ENDPOINT} from "../config";
import axios from 'axios';
export function sendLoginRequest(userName, password, redirect) {
    return axios.post(`${LOGIN_ENDPOINT}/login`, { userName, password, redirect }, {withCredentials: true});
}

export function getBooks() {
    return axios.get(`${BOOK_ENDPOINT}/`, {withCredentials: true});
}
