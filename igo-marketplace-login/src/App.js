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

function App() {
    const classes = useStyles();

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
        sendLoginRequest(username, password);
    };

    const getBook = () => {
        testGetEndpoint();
    };

  return (
    <div className="App">
      <header className="App-header">
        <p>
          IGO Login
        </p>
      </header>
      <body>
      <form className={classes.root} noValidate autoComplete="off">
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
                    onClick={getBook}>
                Get Book
            </Button>
        </div>
      </form>
      </body>
    </div>
  );
}

export default App;
