import React from 'react';
import './App.css';
import Login from './login-page';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';

function App() {
    return (<Router>
        <header className="App-header">
            <p>IGO Login</p>
        </header>
        <body>
            <Switch>
                <Route path="/:redirect" component={Login}/>
                <Route path="/" component={Login}/>
            </Switch>
        </body>
    </Router>);
}

export default App;
