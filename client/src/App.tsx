import React, { useEffect, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import { Container, Navbar, Nav } from 'react-bootstrap';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LinkContainer } from 'react-router-bootstrap';
import { Projects } from './Projects';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Build } from './Build';
import ReportBrowser from './ReportBrowser';
import BuildList from './BuildList';

const App = () => {

  const [version, setVersion] = useState<string | null>(null);
  
  useEffect(() => {
    fetch('/api/version')
      .then((res) => res.json())
      .then((data) => setVersion(data.version));
  }, []);

  return (

    <Router>
      <Navbar bg="primary" data-bs-theme="dark" expand="lg">

        <Container>
          <Navbar.Brand>Build Dashboard</Navbar.Brand>
          <Nav className="me-auto">
          <LinkContainer to="/">
            <Navbar.Brand>Home</Navbar.Brand>
          </LinkContainer>
          <LinkContainer to="/files">
            <Navbar.Brand>Browse Reports</Navbar.Brand>
          </LinkContainer>
          </Nav>
          <Nav className='ml-auto'>
          <Nav.Item>
              Build: {version}
          </Nav.Item>
          </Nav>

        </Container>
      </Navbar>
      <Container fluid data-bs-theme="dark">
        <Routes>
          <Route path="/projects/:project/:build" element={<Build />} />
          <Route path="/projects/:project" element={<BuildList />} />
          <Route path="/files/*" element={<ReportBrowser />} />
          <Route path="/" element={<Projects />} />  
        </Routes>
      </Container>
    </Router >

  );
};

export default App;