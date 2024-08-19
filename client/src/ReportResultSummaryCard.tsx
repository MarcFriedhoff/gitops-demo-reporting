
import { Chart } from "react-google-charts";

import { FaRegCheckCircle, FaRegTimesCircle, FaRegCircle } from "react-icons/fa";
import { Card, Overlay, OverlayTrigger, Tooltip } from "react-bootstrap";
import { MdOutlineErrorOutline } from "react-icons/md";

interface ReportResultSummaryCardProps {
    data: any[];
    title: string;
    status?: string;
}

export const ReportResultSummaryCard: React.FC<ReportResultSummaryCardProps> = ({ data, title, status = '' }) => {

    const options = {
        pieHole: 0.6,
        backgroundColor: "transparent",
        chartArea: {
            width: "100%",
            height: "100%",
        },
        colors: ["#28a745", "#dc3545", "#ffc107"],
        is3D: false,
        legend: 'none'
    };


    return (
        <Card className="build-card" style={{ width: '18rem', margin: '8px 16px', padding: '0px' }}>
            <Card.Body>
                <Card.Title className="d-flex justify-content-between">
                    <div>{title}</div>
                        <OverlayTrigger
                        placement="top"
                        overlay={
                            <Tooltip id={`tt-status`}>
                               {status}
                            </Tooltip>
                        }>
                    <div>

                        {status === "Passed" ? (
                            <FaRegCheckCircle size={"1.8rem"} color="green" />
                        ) : status === "Passed (with failures)" ? (
                            <FaRegCheckCircle size={"1.8rem"} color="orange" />
                        ) : status === "Failed" ? (
                            <FaRegTimesCircle size={"1.8rem"} color="red" />
                        ) : status === "Undefined" ? (
                            <FaRegCircle size={"1.8rem"} color="gray" />
                        ) :
                        (
                            <MdOutlineErrorOutline size={"1.8rem"} color="yellow" />
                        )}
                    </div>
                        </OverlayTrigger>
                </Card.Title>
                <Card.Text>
                    {data && status != "Undefined" && (
                        <>
                        <Chart
                            chartType="PieChart"
                            width="100%"
                            height="80px"
                            data={data}
                            options={options}
                        />
                        <div id="legend" style={{ marginTop: '20px' }}>
                        {data.slice(1).map((item, index) => (
                        <div key={index} style={{ marginBottom: '5px', display: 'flex', alignItems: 'center' }}>
                            <span
                            style={{
                                backgroundColor: options.colors[index],
                                display: 'inline-block',
                                width: '12px',
                                height: '12px',
                                marginRight: '5px'
                            }}
                            ></span>
                            {item[0]} ({item[1]})
                        </div>
                        ))}
                    </div>
                    </>)}
                    {status === "Undefined" && (
                        <p><strong>No Tests</strong></p>
                    )}

                </Card.Text>
            </Card.Body>
        </Card>

    );
};

export default ReportResultSummaryCard;