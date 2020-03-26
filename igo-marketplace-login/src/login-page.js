import React, {useState} from 'react';
import TextField from '@material-ui/core/TextField';
import { makeStyles } from '@material-ui/core/styles';
import './App.css';
import Button from "@material-ui/core/Button";
import {sendLoginRequest, testGetEndpoint} from "./services/login";

const useStyles = makeStyles(theme => ({
    root: {
        '& .MuiTextField-root': {
            margin: theme.spacing(1),
            width: '25ch',
        },
    },
}));

function LoginPage({match}) {
    // Take redirect prop, which should be a url that the login page will reroute to
    const classes = useStyles();

    const redirect = match.params.redirect;

    const [username, setUserName] = useState('streidd');
    const [password, setPassword] = useState('Lucky3gg');

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
        sendLoginRequest(username, password, redirect).then(() => {
            window.location.href = 'https://www.youtube.com/watch?v=w9uWPBDHEKE';
        })
    };

    return (<form className={classes.root} noValidate autoComplete="off">
                <div>
                    <TextField required
                               id="standard-required"
                               label="Required"
                               value={username} onChange={changeUserName}
                    />
                    <TextField required
                               id="standard-password-input"
                               label="Password"
                               type="password"
                               autoComplete="current-password"
                               value={password} onChange={changePassword}/>
                    <Button variant="contained" disabled={validInputs()}
                            onClick={login}>
                        Submit
                    </Button>
                    <Button variant="contained"
                            onClick={testRedirect}>
                        Redirect
                    </Button>

                </div>
            </form>
    );
}

export default LoginPage;
