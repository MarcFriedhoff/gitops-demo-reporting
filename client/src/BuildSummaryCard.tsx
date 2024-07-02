import { FaRegCheckCircle, FaRegTimesCircle } from "react-icons/fa";
import { BuildSummary } from "../../models/types";
import { Card } from "react-bootstrap";
import { Link } from "react-router-dom";


interface BuildSummaryProps {
    buildSummary?: BuildSummary;
}

export const BuildSummaryCard: React.FC<BuildSummaryProps> = ({ buildSummary }) => {
    return (
        <Card className="build-card" style={{ width: '18rem', margin: '8px 16px', padding: '0px' }}>
                <Link to={`/projects/${buildSummary?.buildInfo.project}/${buildSummary?.buildInfo.build}`} style={{ textDecoration: 'none' }}>
                <Card.Body>
                    <Card.Title className="d-flex justify-content-between">
                        <div>{buildSummary?.buildInfo.project}</div>
                        {buildSummary?.buildInfo.buildSuccess ? (
                            <div><FaRegCheckCircle size={"1.8rem"} color="green" /></div>
                        ) : (
                            <div><FaRegTimesCircle size={"1.8rem"} color="red" /></div>
                        )}
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
                                {buildSummary?.buildInfo.repository}
                            </Link>
                        </div>                       
                        <div>{buildSummary?.buildInfo.revision}</div>
                        <div>{buildSummary?.buildInfo.tags}</div>
                        <div>{buildSummary?.buildInfo.date}</div>
                        <div>{buildSummary?.buildInfo.time}</div>
                    </Card.Text>
                </Card.Body>
        </Link>
            </Card>
    );
};