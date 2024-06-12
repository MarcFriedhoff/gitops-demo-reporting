// fetch projects from the server
// display them in cards

import React, { useEffect, useState } from "react";
import { BuildSummary, Project } from "../../models/types";
import { Button, ButtonGroup, Card } from "react-bootstrap";
import { Link } from "react-router-dom";
import { Row } from "react-bootstrap";
import { Container } from "react-bootstrap";
import { BuildSummaryCard } from "./BuildSummaryCard";

export const Projects = () => {
  const [buildSummaries, setBuildSummaries] = useState<BuildSummary[]>([]);

  useEffect(() => {
    fetch("/api/projects")
      .then((res) => res.json())
      .then((data) => setBuildSummaries(data));
  }, []);

  return (
    <Container>
      <Row>
        {buildSummaries.map((summary) => (
            <BuildSummaryCard buildSummary={summary} />
        ))}
      </Row>
    </Container>
  );
};  