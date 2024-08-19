import { Alert, Breadcrumb, Form, Modal, Nav, Offcanvas, OverlayTrigger, Stack, Tab, Tabs, Tooltip } from "react-bootstrap";
import { useParams } from "react-router-dom";
import { ReportResultSummaryCard } from "./ReportResultSummaryCard";
import { useEffect, useState } from "react";
import { BuildSummary } from "../../shared/models/types";
import { BuildSummaryCard } from "./BuildSummaryCard";
import FileBrowser from "./ReportBrowser";
import { FaDownload, FaFile } from "react-icons/fa";
import { ReportResultsTable } from "./ReportResultsTable";


const { Link } = require("react-router-dom");
const { Card } = require("react-bootstrap");
const { Row } = require("react-bootstrap");
const { Container } = require("react-bootstrap");
const { FaRotate } = require('react-icons/fa6');
const { nav } = require("react-bootstrap");
const { useNavigate } = require("react-router-dom");

export const Build = () => {
    const { project, build } = useParams();

    const [showFileBroser, setShowFileBrowser] = useState(false);
    const handleClose = () => setShowFileBrowser(false);

    const [rebuildReport, setRebuildReport] = useState(false);

    const [buildSummary, setBuildSummary] = useState<BuildSummary | null>(null);

    const [activeTab, setActiveTab] = useState<string | null>("code_review");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [message, setMessage] = useState<string | null>(null);
    const [messageType, setMessageType] = useState<string | "success">("success");

    const [sendBuildReport, setSendBuildReport] = useState(false);

    const handleCheckboxChange = (event: { target: { checked: boolean | ((prevState: boolean) => boolean); }; }) => {
      setSendBuildReport(event.target.checked);
    };


    useEffect(() => {
        fetch(`/api/projects/${project}/${build}`)
            .then((res) => res.json())
            .then((data) => setBuildSummary(data));
    }, [project, build]);


    const handleRebuild  = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/projects/${project}/${build}/rebuild`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sendReport: sendBuildReport
                })
            });
            const responseData = await response.json(); 
            if (response.ok) {
                setMessage(responseData.message || "Report successfully rebuilt");
                setMessageType("success");
                setRebuildReport(false);
            } else {
                setMessage(responseData.message || "Report rebuild failed");
                setMessageType("danger");
                setError("Failed to rebuild report");
            }

        } catch (e) {
            setError("Failed to rebuild report");
            setMessage("Report rebuilt failed");
            setMessageType("danger");
            setError("Failed to rebuild report");
        } finally {
            setLoading(false);
        }
    }


    return (
        <>
            <Alert variant={messageType} show={message !== null} onClose={() => setMessage(null)} dismissible>
                <Alert.Heading>{messageType === 'danger'?'Error':'Success'}</Alert.Heading>
                <p>{message}</p>
            </Alert>
            <Offcanvas show={showFileBroser} onHide={handleClose}>
                <Offcanvas.Header closeButton>
                    <Offcanvas.Title>Reports</Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body>
                    <FileBrowser rootPath={`${project}/${build}`} />
                </Offcanvas.Body>
            </Offcanvas>
            <Modal show={rebuildReport} onHide={() => setRebuildReport(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Rebuild Report</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <p>Are you sure you want to rebuild the report?</p>
                        <Form.Check type="checkbox" label="Send Build Report" 
                              checked={sendBuildReport} 
                              onChange={handleCheckboxChange} 
                        />
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <button className="btn btn-primary" onClick={() => handleRebuild()} disabled={loading}>
                    {loading ? 'Rebuilding...' : 'Rebuild'}</button>
                    <button className="btn btn-secondary" onClick={() => setRebuildReport(false)}>Cancel</button>
                </Modal.Footer>
            </Modal>
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
                                    <Tooltip id={`tt-filebrowser`}>
                                        Rebuild Report
                                    </Tooltip>
                                }
                            >
                                <Nav.Link onClick={() => setRebuildReport(true)} style={{ padding: '0.5rem' }} >
                                    <FaRotate size={"1.2rem"} />
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
                        <ReportResultsTable report="codereview" displayTestName={false} displayWarnings={true} />
                    </Tab>
                    <Tab eventKey="unit_test" title="Unit Tests">
                        <ReportResultsTable report="unit-tests" displayTestName={true} displayWarnings={false} />
                    </Tab>
                    <Tab eventKey="soap_ui_test" title="Soap UI">
                        <ReportResultsTable report="soapui" displayTestName={true} displayWarnings={false} />
                    </Tab>
                </Tabs>
            </Container>
        </>
    );
};