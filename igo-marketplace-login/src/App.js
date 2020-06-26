import React from 'react';
import './App.css';
import Login from './login-page';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import image from './igo-logo.png';

function App() {
  return (
    <Router>
      <header className='App-header'>
        <img alt='mskcc logo' src={image} className='App-header-logo' />
        <span>IGO Login</span>
      </header>
      <body>
        <Switch>
          <Route path='/:redirect' component={Login} />
          <Route path='/' component={Login} />
        </Switch>
      </body>
    </Router>
  );
}

export default App;
