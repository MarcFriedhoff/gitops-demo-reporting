import { FaClock, FaCodeBranch, FaGitAlt, FaRegCalendarAlt, FaRegCheckCircle, FaRegTimesCircle } from "react-icons/fa";
import { GoCommit } from "react-icons/go";
import { BuildSummary } from "../../shared/models/types";
import { Card, OverlayTrigger, Tooltip } from "react-bootstrap";
import { Link } from "react-router-dom";
import { text } from "stream/consumers";


interface BuildSummaryProps {
    buildSummary?: BuildSummary;
}

export const BuildSummaryCard: React.FC<BuildSummaryProps> = ({ buildSummary }) => {

    const statusText = (
        <div>
        <br/>
        A build is considered successful if: 
        <br />
        <ul>
        <li>Code review checks pass OR pass with failures &lt; failure threshold (600) OR have only warnings
        </li>
        <li>ALL Unit tests pass</li>
        <li>ALL SoapUI tests pass</li>
        </ul>
        </div>
    );

    return (
        <Card className="build-card" style={{ width: '18rem', margin: '8px 16px', padding: '0px' }}>
                <Link to={`/projects/${buildSummary?.buildInfo.project}/${buildSummary?.buildInfo.build}`} style={{ textDecoration: 'none' }}>
                <Card.Body>
                    <Card.Title className="d-flex justify-content-between">
                        <div>{buildSummary?.buildInfo.project}</div>
                        <OverlayTrigger 
                            placement="bottom" 
                            overlay={
                                <Tooltip>
                                    <p style={{textAlign: 'left'}}>
                                    Status is {buildSummary?.buildInfo.buildSuccess ? "SUCCESS" : "FAIL"} 
                                    {statusText}
                                    </p>
                                </Tooltip>
                            }>
                        <div>
                        {buildSummary?.buildInfo.buildSuccess ? (
                            <FaRegCheckCircle size={"2.8rem"} color="green" />
                        ) : (
                            <FaRegTimesCircle size={"2.8rem"} color="red" />
                        )}
                        </div>
                        </OverlayTrigger>
                    </Card.Title>
                    <Card.Text>
                        <div>{buildSummary?.buildInfo.build}</div>

                        {buildSummary?.buildInfo.buildSuccess ? (
                            <p className="font-weight-bold text-success"><strong>SUCCESS</strong></p>
                        ) : (
                            <p className="font-weight-bold text-danger"><strong>FAIL</strong></p>
                        )}
                        <div style={{ width: '15rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={buildSummary?.buildInfo.repository}>
                            <Link to={`${buildSummary?.buildInfo.repository}`}>
                            <FaGitAlt /> {buildSummary?.buildInfo.repository}
                            </Link>
                        </div>                       
                        <div><GoCommit />[{buildSummary?.buildInfo.revision.slice(0,7)}]</div>
                        <div><FaCodeBranch />{buildSummary?.buildInfo.tags}</div>
                        <div><FaRegCalendarAlt/> {buildSummary?.buildInfo.date}</div>
                        <div><FaClock/> {buildSummary?.buildInfo.time}</div>
                    </Card.Text>
                </Card.Body>
        </Link>
            </Card>
    );
};