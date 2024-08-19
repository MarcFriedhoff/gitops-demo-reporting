import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ReportResult, ReportResultItem } from "../../shared/models/types";
import { useNavigate } from "react-router-dom";

interface ReportResultsTableProps {
    report: string;
    displayWarnings: boolean;
    displayTestName: boolean
}

export const ReportResultsTable: React.FC<ReportResultsTableProps> = ({report, displayTestName, displayWarnings}) => {

    const [reportResults, setReportResults] = useState<ReportResult | null>(null);

    const { project, build } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        fetch(`/api/projects/${project}/${build}/${report}`)
            .then((res) => res.json())
            .then((data) => setReportResults(data));
    }, [project, build]);

    return reportResults && (
        <div>
            <table className='table table-hover'>
                <thead>
                    <tr>
                        <th>Package Name</th>
                        {displayTestName && <th>Test Name</th>}
                        <th>Checks</th>
                        <th>Failed</th>
                        <th>Passed</th>
                        {displayWarnings && <th>Warnings</th>}
                    </tr>
                </thead>
                <tbody>
                    {reportResults.result && reportResults.result.map((result: ReportResultItem) => {
                        return (
                            <tr key={result.packageName} onClick={() => navigate(`/files/${project}/${build}/${report}`)} className="build-card" style={{ textDecoration: 'none' }}>
                                <td>{result.packageName}</td>
                                {displayTestName && <td>{result.name}</td>}
                                <td>{result.tests}</td>
                                <td>{(result.failures + result.errors)}</td>
                                <td>{result.tests - (result.failures + result.errors)}</td>
                                {displayWarnings && <td>{result.warnings}</td>}
                            </tr>
                        );
                    })}
                </tbody>
            </table>

        </div>
    );
}