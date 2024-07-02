import React, { useEffect, useState } from 'react';
import { BuildSummary } from '../../models/types';
import { useParams, useNavigate } from 'react-router-dom';
import { Breadcrumb, Container, Nav, Row } from 'react-bootstrap';
import { FaRegCheckCircle, FaRegTimesCircle } from 'react-icons/fa';

const BuildList = () => {

  const [data, setData] = useState<BuildSummary[] | null>(null);

  const navigate = useNavigate();
  const { project } = useParams();

  useEffect(() => {
    fetch(`/api/projects/${project}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        setData(data);
      })
      .catch(error => {
        console.error('There has been a problem with your fetch operation:', error);
      });
  }, [project]);

  return (
    <Container>

      <Nav className="navbar navbar-dark bg-dar justify-content-between">
        <Breadcrumb>
          <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
          <Breadcrumb.Item active>{project}</Breadcrumb.Item>
        </Breadcrumb>

      </Nav>
        <table className='table table-hover'>
          <thead>
            <tr>
              <th></th>
              <th>Project</th>
              <th>Build</th>
              <th>Repository</th>
              <th>Revision</th>
              <th>Tags</th>
              <th>Date</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((buildSummary, index) => (
              <tr key={index} onClick={() => navigate(`/projects/${buildSummary.buildInfo.project}/${buildSummary.buildInfo.build}`)} className="build-card" style={{ textDecoration: 'none' }}
              >
                <td>{buildSummary.buildInfo.buildSuccess ? (
                  <div><FaRegCheckCircle size={"1.8rem"} color="green" /></div>
                ) : (
                  <div><FaRegTimesCircle size={"1.8rem"} color="red" /></div>
                )}</td>
                <td>{buildSummary.buildInfo.project}</td>
                <td>{buildSummary.buildInfo.build}</td>
                <td>{buildSummary.buildInfo.repository}</td>
                <td>{buildSummary.buildInfo.revision}</td>
                <td>{buildSummary.buildInfo.tags}</td>
                <td>{buildSummary.buildInfo.date}</td>
                <td>{buildSummary.buildInfo.time}</td>
                </tr>
            ))}
          </tbody>
        </table>
    </Container>
  );
};

export default BuildList;