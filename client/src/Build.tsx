import { Breadcrumb, Nav, Offcanvas, OverlayTrigger, Stack, Tab, Tabs, Tooltip } from "react-bootstrap";
import { useParams } from "react-router-dom";
import { ReportResultSummaryCard } from "./ReportResultSummaryCard";
import { useEffect, useState } from "react";
import { BuildSummary } from "../../models/types";
import { BuildSummaryCard } from "./BuildSummaryCard";
import FileBrowser from "./ReportBrowser";
import { FaDownload, FaFile } from "react-icons/fa";
import { ReportResultsTable } from "./ReportResultsTable";


const { Link } = require("react-router-dom");
const { Card } = require("react-bootstrap");
const { Row } = require("react-bootstrap");
const { Container } = require("react-bootstrap");
const { FaCode } = require('react-icons/fa');
const { nav } = require("react-bootstrap");
const { useNavigate } = require("react-router-dom");

export const Build = () => {
    const { project, build } = useParams();

    const [showFileBroser, setShowFileBrowser] = useState(false);
    const handleClose = () => setShowFileBrowser(false);

    const [buildSummary, setBuildSummary] = useState<BuildSummary | null>(null);

    const [activeTab, setActiveTab] = useState<string | null>("code_review");

    useEffect(() => {
        fetch(`/api/projects/${project}/${build}`)
            .then((res) => res.json())
            .then((data) => setBuildSummary(data));
    }, [project, build]);


    return (
        <>
            <Offcanvas show={showFileBroser} onHide={handleClose}>
                <Offcanvas.Header closeButton>
                    <Offcanvas.Title>Reports</Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body>
                    <FileBrowser rootPath={`${project}/${build}`} />
                </Offcanvas.Body>
            </Offcanvas>
            <Container>
                <Nav className="navbar navbar-dark bg-dar justify-content-between">
                    <Breadcrumb>
                        <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
                        <Breadcrumb.Item href={`/projects/${project}`}>{project}</Breadcrumb.Item>
                        <Breadcrumb.Item active>{build}</Breadcrumb.Item>
                    </Breadcrumb>
                    <Stack direction="horizontal" gap={0}>
                        <Nav.Item>
                            <OverlayTrigger
                                placement="top"
                                overlay={
                                    <Tooltip id={`tt-filebrowser`}>
                                        Browse reports
                                    </Tooltip>
                                }
                            >
                                <Nav.Link onClick={() => setShowFileBrowser(true)} style={{ padding: '0.5rem' }} >
                                    <FaFile size={"1.2rem"} />
                                </Nav.Link>
                            </OverlayTrigger>
                        </Nav.Item>
                        <Nav.Item>
                            <OverlayTrigger
                                placement="top"
                                overlay={
                                    <Tooltip id={`tt-downloadreports`}>
                                        Downdload Reports
                                    </Tooltip>
                                }
                            >
                                <Nav.Link onClick={() => window.location.href = `/projects/${project}/${build}/download`} style={{ padding: '0.5rem' }}>
                                    <FaDownload size={"1.2rem"} />
                                </Nav.Link>
                            </OverlayTrigger>
                        </Nav.Item>
                    </Stack>

                </Nav>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div onClick={() => window.location.href = `/projects/${buildSummary?.buildInfo.project}/${buildSummary?.buildInfo.build}`} style={{ textDecoration: 'none' }}>
                        <BuildSummaryCard buildSummary={buildSummary as BuildSummary | undefined} />
                    </div>
                    <div onClick={() => setActiveTab("code_review")} style={{ textDecoration: 'none' }}>
                        <ReportResultSummaryCard data={buildSummary?.codeReviewSummary?.data || []} title="Code Review" status={buildSummary?.codeReviewSummary?.status} />
                    </div>
                    <div onClick={() => setActiveTab("unit_test")} style={{ textDecoration: 'none' }}>
                        <ReportResultSummaryCard data={buildSummary?.unitTestSummary?.data || []} title="Unit Tests" status={buildSummary?.unitTestSummary?.status} />
                    </div>
                    <div onClick={() => setActiveTab("soap_ui_test")} style={{ textDecoration: 'none' }}>
                        <ReportResultSummaryCard data={buildSummary?.soapUiTestSummary?.data || []} title="Soap UI Tests" status={buildSummary?.soapUiTestSummary?.status} />
                    </div>
                </div>
                <Tabs activeKey={activeTab || "code_review"} defaultActiveKey="code_review" id="uncontrolled-tab-example" onSelect={(k) => setActiveTab(k)}>
                    <Tab eventKey="code_review" title="Code Review">
                        <ReportResultsTable report="codereview" />
                    </Tab>
                    <Tab eventKey="unit_test" title="Unit Tests">
                        <ReportResultsTable report="unit-tests" />
                    </Tab>
                    <Tab eventKey="soap_ui_test" title="Soap UI">
                        <ReportResultsTable report="soapui" />
                    </Tab>
                </Tabs>
            </Container>
        </>
    );
};