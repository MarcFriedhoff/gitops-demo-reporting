import { AppConfig, BuildSummary, BuildSummaryItem, ReportResult, ReportResultItem, Project } from "../../shared/models/types";
import { createMessageCardFromTemplate } from "./messagecard";

const express = require('express');
const { get } = require('http');
const path = require('path');
const app = express();
const fs = require('fs');
const multer = require('multer');
const extract = require('extract-zip');
const archiver = require('archiver');
const yaml = require('js-yaml');
const xml2js = require('xml2js');
const globSync = require('glob').sync;
const axios = require('axios');
const configFile = process.env.CONFIG_FILE || path.join(__dirname, '../config.yaml');
const config: AppConfig = yaml.load(fs.readFileSync(configFile, 'utf8'));
const upload = multer({ dest: config.uploadDirectory }); // Set the destination for uploaded files
const versionFile = path.join(__dirname, '../version.json');


app.use(express.static(path.join(__dirname, '../../client/build')));

app.use(express.json());

function generateBuildSummary(buildDir: any, buildInfo: any) {
    let codeReviewDir = path.join(buildDir, 'codereview');
    let codeReviewResult = new ReportResult(codeReviewDir, []);
    if (fs.existsSync(codeReviewDir)) {
        codeReviewResult = parseCodeReviewXML(codeReviewDir, 'results.xml');
        fs.writeFileSync(path.join(codeReviewDir, 'reportResult.json'), JSON.stringify(codeReviewResult));
    }


    let unitTestDir = path.join(buildDir, 'unit-tests');
    let junitReportResult = new ReportResult(unitTestDir, []);
    if (fs.existsSync(unitTestDir)) {
        junitReportResult = parseTestSuiteXML(unitTestDir, 'TESTS-TestSuites.xml', 'testsuites');
        fs.writeFileSync(path.join(unitTestDir, 'reportResult.json'), JSON.stringify(junitReportResult));
    }

    // SOAP UI test directory
    let soapUITestDir = path.join(buildDir, 'soapui');
    let soapUIReportResults:ReportResult [] = [];
    let soapUIReportResult = new ReportResult(soapUITestDir, []);
    if (fs.existsSync(soapUITestDir)) {
        //iterate over the directories in soapUITestDir
        const soapUITestDirs = fs.readdirSync(soapUITestDir);
        soapUITestDirs.forEach((dir: string) => {
            const fullDir = path.join(soapUITestDir, dir);
            if (fs.statSync(fullDir).isDirectory()) {
                const result = parseTestSuiteXML(fullDir, 'TEST-*.xml');
                soapUIReportResults.push(result);
            }
        });

        soapUIReportResults.forEach(result => {
            soapUIReportResult.result.push(...result.result);
        });

        fs.writeFileSync(path.join(soapUITestDir, 'reportResult.json'), JSON.stringify(soapUIReportResult));

    }

    let codeReviewSummaryStatus = "Passed";
    let unitTestSummaryStatus = "Passed";
    let soapUITestSummaryStatus = "Passed";

    // set codeReviewSummaryStatus to "Failed" if there are any failures, "Warn" if there are warnings, otherwise set to "Passed"
    if (codeReviewResult.result.some((r: ReportResultItem) => r.failures > 0)) {
        if (codeReviewResult.result.some((r: ReportResultItem) => r.failures > config.codeReviewConfig.failedChecksAllowed)) {
            codeReviewSummaryStatus = "Failed";
        } else {
            codeReviewSummaryStatus = "Passed (with failures)";
        }
    } else if (codeReviewResult.result.some((r: ReportResultItem) => r.warnings > 0)) {
        codeReviewSummaryStatus = "Warn";
    } else if (codeReviewResult.result.length === 0) {
        codeReviewSummaryStatus = "Undefined";
    }

    // set unitTestSummaryStatus to "Failed" if there are any failures, "Warn" if there are warnings, otherwise set to "Passed"
    if (junitReportResult.result.some((r: ReportResultItem) => r.failures > 0)) {
        unitTestSummaryStatus = "Failed";
    } else if (junitReportResult.result.some((r: ReportResultItem) => r.warnings > 0)) {
        unitTestSummaryStatus = "Warn";
    } else if (junitReportResult.result.length === 0) {
        unitTestSummaryStatus = "Undefined";
    }

    // set soapUITestSummaryStatus to "Failed" if there are any failures, "Warn" if there are warnings, otherwise set to "Passed"
    if (soapUIReportResult.result.some((r: ReportResultItem) => r.failures > 0)) {
        soapUITestSummaryStatus = "Failed";
    } else if (soapUIReportResult.result.some((r: ReportResultItem) => r.warnings > 0)) {
        soapUITestSummaryStatus = "Warn";
    } else if (soapUIReportResult.result.length === 0) {
        soapUITestSummaryStatus = "Undefined";
    }

    // create codeReviewSummary, unitTestSummary, and soapUITestSummary
    // sum the tests, failures, and warnings for each test suite
    const codeReviewTestCount = codeReviewResult.result.reduce((acc, r) => acc + r.tests, 0);
    const codeReviewFailureCount = codeReviewResult.result.reduce((acc, r) => acc + r.failures, 0);
    const codeReviewWarnCount = codeReviewResult.result.reduce((acc, r) => acc + r.warnings, 0);

    const codeReviewSummaryItem = new BuildSummaryItem([
        ['Status', 'Count'],
        ['Passed', codeReviewTestCount - codeReviewFailureCount - codeReviewWarnCount],
        ['Failed', codeReviewFailureCount],
        ['Warnings', codeReviewWarnCount],
    ], codeReviewSummaryStatus);
    // sum the tests, failures, and errors for each test suite
    const junitTestCount = junitReportResult.result.reduce((acc, r) => acc + r.tests, 0);
    const junitFailureCount = junitReportResult.result.reduce((acc, r) => acc + r.failures, 0);
    const junitErrorCount = junitReportResult.result.reduce((acc, r) => acc + r.errors, 0);
    const junitSummaryItem = new BuildSummaryItem([
        ['Status', 'Count'],
        ['Passed', junitTestCount - junitFailureCount - junitErrorCount],
        ['Failed', junitFailureCount],
        ['Errors', junitErrorCount],
    ], unitTestSummaryStatus);

    //sum the tests, failures, and errors for each test suite
    const soapUITestCount = soapUIReportResult.result.reduce((acc, r) => acc + r.tests, 0);
    const soapUIFailureCount = soapUIReportResult.result.reduce((acc, r) => acc + r.failures, 0);
    const soapUIErrorCount = soapUIReportResult.result.reduce((acc, r) => acc + r.errors, 0);
    const soapUISummaryItem = new BuildSummaryItem([
        ['Status', 'Count'],
        ['Passed', soapUITestCount - soapUIFailureCount - soapUIErrorCount],
        ['Failed', soapUIFailureCount],
        ['Errors', soapUIErrorCount],
    ], soapUITestSummaryStatus);

    buildInfo.buildSuccess = (codeReviewSummaryStatus === "Passed" || codeReviewSummaryStatus === "Passed (with failures)" || codeReviewSummaryStatus === "Warn") && unitTestSummaryStatus === "Passed" && soapUITestSummaryStatus === "Passed";

    const buildSummary: BuildSummary = new BuildSummary(
        buildInfo,
        codeReviewSummaryItem,
        junitSummaryItem,
        soapUISummaryItem
    );

    fs.writeFileSync(path.join(buildDir, 'buildSummary.json'), JSON.stringify(buildSummary));
    return buildSummary;
}
/**
 * Retrieves build summaries for a specific project or for all projects.
 * 
 * @param project - Optional. The name of the project to retrieve build summaries for.
 * @returns An array of BuildSummary objects containing build information for the specified project(s).
 */
function getBuildSummaries(project?: string) {
    // read the files from the resources directory and return them as projects
    let buildSummaries: typeof BuildSummary[] = [];
    const projectDir = project ? path.join(config.projectDirectory, project) : config.projectDirectory;
    const files = fs.readdirSync(projectDir).filter((f: string) => {
        const fullPath = path.join(projectDir, f);
        return !f.startsWith('.') && fs.statSync(fullPath
        ).isDirectory();
    }
    );
    files.forEach((file: string) => {
        try {
            // read the buildSummary.json file from the project directory and convert to BuildSummary type
            let data: any;
            if (project) {
                if (file === 'latest') {
                    return;
                }
                data = fs.readFileSync(path.join(projectDir, file, 'buildSummary.json'), 'utf8');
            } else {
                data = fs.readFileSync(path.join(config.projectDirectory, file, "latest", 'buildSummary.json'), 'utf8');
            }
            const buildSummary = JSON.parse(data);
            // convert jsonFile to a BuildSummary object
            buildSummaries.push(buildSummary);
        } catch (err) {
            console.error('Failed to read buildSummary.json file: ', err);
        }
    });
    return buildSummaries;
}
/**
 * Parses an XML code review report file to extract relevant information and create ReportResultItem instances.
 * 
 * @param reportDir The directory path where the report file is located.
 * @param reportFile The name of the report file to be parsed.
 * @returns A ReportResult object containing the parsed information from the XML report file.
 */
function parseCodeReviewXML(reportDir: any, reportFile: string) {

    const reportFiles: any[] = globSync(`${reportDir}/${reportFile}`);
    const reportResultItems: ReportResultItem[] = [];
    reportFiles.forEach((file: any) => {
        const xml = fs.readFileSync(file, 'utf8');
        const parser = new xml2js.Parser({ explicitArray: false, normalize: true, trim: true });
        parser.parseString(xml, (err: any, result: any) => {
            if (err) {
                console.error('Failed to parse xml file: ', err);
            }
            else {
                const node = result.results.result;
                if (Array.isArray(node)) {
                    node.forEach((n: any) => {
                        const a = n.$;
                        const item = new ReportResultItem({
                            name: a.name,
                            packageName: a.packageName,
                            hostname: '', // Add the missing property
                            tests: parseInt(a.totalChecks),
                            errors: 0,
                            failures: parseInt(a.totalFailed),
                            skipped: 0,
                            warnings: parseInt(a.totalWarnings),
                            time: 0, // Add the missing property
                            timestamp: new Date(a.date) // Add the missing property
                        });
                        reportResultItems.push(item);
                    });
                } else {
                    const a = node.$;
                    const item = new ReportResultItem({
                        name: a.name,
                        packageName: a.packageName, // Add the missing property
                        hostname: '', // Add the missing property
                        tests: parseInt(a.totalChecks), // Add the missing property
                        errors: 0,
                        failures: parseInt(a.totalFailed), // Add the missing property
                        skipped: 0,
                        warnings: parseInt(a.totalWarnings),
                        time: 0, // Add the missing property
                        timestamp: new Date(a.timestamp) // Add the missing property
                    });
                    reportResultItems.push(item);
                }
            }
        });
    });

    const reportResult = new ReportResult(reportDir, reportResultItems);

    //console.log(reportResult);

    return reportResult;
}

function parseTestSuiteXML(reportDir: any, testSuiteFile: string, rootNode?: string) {
    const reportFiles: any[] = globSync(`${reportDir}/${testSuiteFile}`);
    const reportResultItems: ReportResultItem[] = [];
    reportFiles.forEach((file: any) => {
        const fileName = path.basename(file);
        const xml = fs.readFileSync(file, 'utf8');
        const parser = new xml2js.Parser({ explicitArray: false, normalize: true, trim: true });
        parser.parseString(xml, (err: any, result: any) => {
            if (err) {
                console.error('Failed to parse xml file: ', err);
            }
            else {
                let node = rootNode ? result.testsuites.testsuite : result.testsuite;
                if (Array.isArray(node)) {
                    node.forEach((n: any) => {
                        let a = n.$;
                        const item = new ReportResultItem({
                            name: a.name,
                            packageName: a.package, // Add the missing property
                            hostname: a.hostname,
                            tests: parseInt(a.tests),
                            failures: parseInt(a.failures),
                            errors: parseInt(a.errors),
                            skipped: 0,
                            warnings: 0,
                            time: parseFloat(a.time),
                            timestamp: a.timestamp
                        });
                        reportResultItems.push(item);
                    }
                    );
                } else {
                    let a = node.$;
                    const item = new ReportResultItem({
                        name: a.name,
                        packageName: fileName, // Add the missing property
                        hostname: a.hostname,
                        tests: parseInt(a.tests),
                        failures: parseInt(a.failures),
                        errors: parseInt(a.errors),
                        skipped: parseInt(a.skipped),
                        warnings: parseInt(a.warnings),
                        time: parseFloat(node.time),
                        timestamp: file.mtime
                    });
                    reportResultItems.push(item);
                }
            }
        });
    });

    const reportResult = new ReportResult(reportDir, reportResultItems);

    console.log(reportResult);

    return reportResult;

}

/**
 * Creates a Microsoft Teams message card based on the provided build summary.
 * The card includes details such as build status, project information, code review summary, unit test status, and Soap UI test status.
 *
 * @param buildSummary - The build summary containing build information, code review summary, unit test summary, and Soap UI test summary.
 * @returns An object representing a Microsoft Teams message card with detailed build information.
 */
function createTeamsMessageCard(buildSummary: BuildSummary) {
    // Assuming each summary item has a 'status' property
    let color;
    switch (buildSummary.buildInfo.buildSuccess) {
        case true:
            color = 'green';
            break;
        default:
            color = 'red';
            break;
    }

    const link = `/projects/${buildSummary.buildInfo.project}/${buildSummary.buildInfo.build}`;
    const activityImage = `${config.teamsActivityImage}`;
    const deepLink = `${config.frontEndUrl}${link}`;

    let messageCardTemplate: string = config.messageCardTemplate;

    const message = createMessageCardFromTemplate(messageCardTemplate, buildSummary, color, deepLink, activityImage);

    return message;
}


app.get('/api/version', (req: any, res: any) => {
    try {
        // check if version file exists
        if (!fs.existsSync(versionFile)) {
            // create a version file from date and return the version
            const version = { version: new Date().toISOString() };
            fs.writeFileSync(versionFile, JSON.stringify(version));
            res.json(version);
        } else {
            // read the version file and return the version
            const data = fs.readFileSync(versionFile, 'utf8');
            const jsonFile = JSON.parse(data);
            res.json(jsonFile);

        }
    } catch (error) {
        console.error('Failed to read version file: ', error);

    }
});

app.get('/api/projects/:project/:build/:report', (req: any, res: any) => {
    const project = req.params.project;
    const build = req.params.build;
    const report = req.params.report;
    const projectDir = path.join(config.projectDirectory, project, build);
    const reportDir = path.join(projectDir, report);
    const reportResult = fs.readFileSync(path.join(reportDir, 'reportResult.json'), 'utf8');
    const jsonFile = JSON.parse(reportResult);
    res.json(jsonFile);
});

app.get('/api/projects', (req: any, res: any) => {
    const buildSummaries = getBuildSummaries();
    res.json(buildSummaries);
});

app.get('/api/projects/:project', (req: any, res: any) => {
    const project = req.params.project;
    const projectDir = path.join(config.projectDirectory, project);
    const buildSummaries = getBuildSummaries(project);
    res.json(buildSummaries);
});

app.get('/api/projects/:project/:build', (req: any, res: any) => {
    const project = req.params.project;
    const build = req.params.build;
    const projectDir = path.join(config.projectDirectory, project, build);
    // read summary.json file from the project directory and convert to BuildSummary type
    const data = fs.readFileSync(path.join(projectDir, 'buildSummary.json'), 'utf8');
    const jsonFile = JSON.parse(data);
    res.json(jsonFile);
});

app.post('/api/projects/:project/build', upload.single('file'), async (req: any, res: any) => {
    const project = req.params.project;
    const file = req.file;
    const buildInfo = JSON.parse(req.body.buildInfo);
    // check if buildInfo is valid
    console.log('Project: ', project, ' File: ', file, ' Build Info: ', buildInfo);
    if (!buildInfo.project || !buildInfo.build || !buildInfo.repository || !buildInfo.revision || buildInfo.buildSuccess === undefined) {
        res.status(400).send('Invalid buildInfo');
        return;
    }

    if (!file) {
        res.status(400).send('No file uploaded');
        return;
    }

    // Create the project directory if it doesn't exist
    const buildDir = path.join(config.projectDirectory, project, buildInfo.build);
    const projectDir = path.join(config.projectDirectory, project);
    if (!fs.existsSync(buildDir)) {
        fs.mkdirSync(buildDir, { recursive: true });
    }

    try {
        // Unzip the file to the project directory
        await extract(file.path, { dir: buildDir });

        // Delete the uploaded zip file
        fs.unlinkSync(file.path);

        // write the buildInfo to a file in the build directory
        fs.writeFileSync(path.join(buildDir, 'buildInfo.json'), JSON.stringify(buildInfo));

        const buildSummary: BuildSummary = generateBuildSummary(buildDir, buildInfo);

        // create symlink to the latest build
        const latestBuildDir = path.join(projectDir, 'latest');
        if (fs.existsSync(latestBuildDir)) {
            fs.unlinkSync(latestBuildDir);
        }

        fs.symlinkSync(path.join(buildDir), latestBuildDir, 'dir');

        const messageCard = createTeamsMessageCard(buildSummary);
        console.log('Message card: ', messageCard);

        const webhookUrl = config.teamsWebhookUrl;
        axios.post(webhookUrl, messageCard).then((response: any) => {
            console.log('Message card posted to Teams');
        }).catch((error: any) => {
            console.error('Failed to post message card to Teams: ', error);
        });

        res.status(200).send('File uploaded and extracted successfully');
    } catch (err) {
        console.error('Failed to extract file: ', err);
        res.status(500).send('Failed to extract file');
    }
});

// create a zip file of the build directory and return it
app.get('/projects/:project/:build/download', (req: any, res: any) => {
    const project = req.params.project;
    const build = req.params.build;
    const projectDir = path.join(config.projectDirectory, project, build);
    const zipFile = path.join(config.projectDirectory, project, `${build}.zip`);

    if (!fs.existsSync(projectDir)) {
        res.status(404).send('Not found');
        return;
    }

    const output = fs.createWriteStream(zipFile);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
        res.download(zipFile);
    });

    archive.on('error', (err: any) => {
        res.status(500).send('Server error');
    });

    archive.pipe(output);
    archive.directory(projectDir, false);
    archive.finalize();
});


app.get('/api/files/*', (req: { params: any[]; }, res: { status: (arg0: number) => { (): any; new(): any; send: { (arg0: string): void; new(): any; }; }; json: (arg0: any) => void; download: (arg0: any) => void; }) => {
    const filePath = path.join(config.projectDirectory, req.params[0]);

    // ensure that filePath is a subdirectory of projectDirectory
    if (!filePath.startsWith(config.projectDirectory)) {
        res.status(403).send('Forbidden');
        return;
    }

    fs.stat(filePath, (err: any, stats: { isDirectory: () => any; }) => {
        if (err) {
            res.status(404).send('Not found');
            return;
        }

        if (stats.isDirectory()) {
            fs.readdir(filePath, (err: any, files: any[]) => {
                if (err) {
                    res.status(500).send('Server error');
                    return;
                }

                const fileOrDirectories = files.map((file: any) => {
                    const isDirectory = fs.statSync(path.join(filePath, file)).isDirectory();
                    return { name: file, isDirectory, path: path.join(req.params[0], file) };
                });

                // prepend the parent directory as ".." if it's not the config.projectDirectory
                if (filePath !== config.projectDirectory) {
                    fileOrDirectories.unshift({ name: '..', isDirectory: true, path: path.join(req.params[0], '..') });
                }

                res.json(fileOrDirectories);
            });
        } else {
            res.download(filePath);
        }
    });
});


app.post('/api/projects/:project/:build/rebuild', (req: any, res: any) => {
    try {

        const project = req.params.project;
        const build = req.params.build;



        const sendReport = req.body.sendReport;

        const projectDir = path.join(config.projectDirectory, project, build);

        generateBuildSummary(projectDir, JSON.parse(fs.readFileSync(path.join(projectDir, 'buildInfo.json'), 'utf8')));

        const webhookUrl = config.teamsWebhookUrl;
        let sendReportSuccess = false;
        if (sendReport) {
            const messageCard = createTeamsMessageCard(JSON.parse(fs.readFileSync(path.join(projectDir, 'buildSummary.json'), 'utf8')));            
            console.log('messageCard: ', messageCard);   

            try {

                sendReportSuccess = true;

                axios.post(webhookUrl, messageCard).then((response: any) => {
                    console.log('Message card posted to Teams');
                    console.log(response.data);
                }).catch((error: any) => {
                    console.error('Failed to post message card to Teams: ', error);
                    sendReportSuccess = false;
                });

            } catch (error) {
                console.error('Failed to post message card to Teams: ', error);
                return res.status(500).json({ message: 'Failed to post message card to Teams' }); // Use return to exit early
            }
        } else {
            // send back json message 
            res.status(200).json({ message: 'Rebuild successful.'});
        }
    } catch (error) {
        console.error('Failed to rebuild report: ', error);
        res.status(500).json({ message: 'Failed to rebuild report' });
    }
});

app.post('/api/messagecard', (req: any, res: any) => {
    try {
        const buildSummary = req.body;
        console.log('Build summary: ', buildSummary);
        res.status(200);
       
    } catch (error) {
        console.error('Failed to create message card: ', error);
        res.status(500).json({ message: 'Failed to create message card' });
    }
    return;
});

app.get('*', (req: any, res: any) =>
    res.sendFile(path.join(__dirname, '../../client/build/index.html'))
);

app.listen(3000, () => {
    console.log('Project directory: ', config.projectDirectory);
    if (!fs.existsSync(config.projectDirectory)) {
        fs.mkdirSync(config.projectDirectory);
    }

    console.log('Server is running on http://localhost:3000');
});




