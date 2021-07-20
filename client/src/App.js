import React from "react";
import "./App.css";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import Home from "./Home";
import "antd/dist/antd.css";
import "font-awesome/css/font-awesome.min.css";
import 'bootstrap/dist/css/bootstrap.min.css';
import Footer from "./components/Footer/Footer";
import MyComponent from "./components/MyComponent/MyComponent";
import FileUpload from './components/FileUpload';
import ClientWindow from "./components/ClientWindow/ClientWindow";

const App = () => {
  return (
    <Router>      
      <Switch>     
        <Route exact path="/" component={Home} />   
        <Route exact path="/client/:id" render={(props) => (
            <ClientWindow id={props.match.params.id}/>
        )}/>
      </Switch>
    </Router>
  );
};

export default App;
