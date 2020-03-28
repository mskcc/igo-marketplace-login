import React, {useState} from 'react';
import TextField from '@material-ui/core/TextField';
import { makeStyles } from '@material-ui/core/styles';
import './App.css';
import Button from "@material-ui/core/Button";
import {sendLoginRequest} from "./services/login";

const useStyles = makeStyles(theme => ({
    root: {
        '& .MuiButtonBase-root': {
            margin: 'auto',
            display: 'block'
        },
        '& .MuiTextField-root': {
            margin: theme.spacing(1),
            width: '25ch',
        },
        'margin-top': '50px',
        width: '275px',
        margin: 'auto',
        padding: '20px 15px',
        'background-color': '#fff',
        'border-radius': '6px',
        'box-shadow': '0 2px 3px rgba(10,10,10,.1), 0 0 0 1px rgba(10,10,10,.1)',
        color: '#4a4a4a',
        display: 'block',
    }
}));

function LoginPage({match}) {
    // Take redirect prop, which should be a url that the login page will reroute to
    const classes = useStyles();

    // Redirect-url is the path that will be routed to after a successful login
    const redirectPath = match['url'] || '/';

    const [username, setUserName] = useState('');
    const [password, setPassword] = useState('');
    const [prompt, setPrompt] = useState('Please enter your login details below');

    const changeUserName = (evt) => {
        const userName = evt.target.value;
        setUserName(userName);
    };

    const changePassword = (evt) => {
        const password = evt.target.value;
        setPassword(password);
    };

    const validInputs = () => {
        return username.length === 0 || password.length === 0;
    };

    const login = () => {
        setPrompt('Logging in...');
        sendLoginRequest(username, password).then(() => {
            setPrompt('Login Successful');
            window.location.href = redirectPath;
        }).catch((err) => {
            const resp = err.response || {};
            const data = resp.data || {};
            const msg = data.message || 'Login Failed';
            setPrompt(msg);
        })
    };

    return (<form className={classes.root} noValidate autoComplete="off">
                <div>
                    <div className={"block"}>
                        <p className={"text-align-center"}>{prompt}</p>
                    </div>
                    <div className={"block"}>
                        <TextField required
                                   id="standard-required"
                                   label="Required"
                                   value={username} onChange={changeUserName}/>
                    </div>
                    <div className={"block"}>
                        <TextField required
                                   id="standard-password-input"
                                   label="Password"
                                   type="password"
                                   autoComplete="current-password"
                                   value={password} onChange={changePassword}/>
                    </div>
                    <Button variant="contained" disabled={validInputs()}
                            onClick={login}>
                        Submit
                    </Button>
                </div>
            </form>
    );
}

export default LoginPage;
