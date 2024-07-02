"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../models/types");
const express = require('express');
const { get } = require('http');
const path = require('path');
const app = express();
const fs = require('fs');
const { Project, Result, RootResult } = require('../models/types');
const multer = require('multer');
const extract = require('extract-zip');
const archiver = require('archiver');
const yaml = require('js-yaml');
const xml2js = require('xml2js');
const globSync = require('glob').sync;
const axios = require('axios');
const configFile = process.env.CONFIG_FILE || path.join(__dirname, '../server/config.yaml');
const config = yaml.load(fs.readFileSync(configFile, 'utf8'));
const upload = multer({ dest: config.uploadDirectory }); // Set the destination for uploaded files
app.use(express.static(path.join(__dirname, '../client/build')));
function getBuildSummaries(project) {
    // read the files from the resources directory and return them as projects
    let buildSummaries = [];
    const projectDir = project ? path.join(config.projectDirectory, project) : config.projectDirectory;
    const files = fs.readdirSync(projectDir).filter((f) => {
        const fullPath = path.join(projectDir, f);
        return !f.startsWith('.') && fs.statSync(fullPath).isDirectory();
    });
    files.forEach((file) => {
        try {
            // read the buildSummary.json file from the project directory and convert to BuildSummary type
            let data;
            if (project) {
                if (file === 'latest') {
                    return;
                }
                data = fs.readFileSync(path.join(projectDir, file, 'buildSummary.json'), 'utf8');
            }
            else {
                data = fs.readFileSync(path.join(config.projectDirectory, file, "latest", 'buildSummary.json'), 'utf8');
            }
            const buildSummary = JSON.parse(data);
            // convert jsonFile to a BuildSummary object
            buildSummaries.push(buildSummary);
        }
        catch (err) {
            console.error('Failed to read buildSummary.json file: ', err);
        }
    });
    return buildSummaries;
}
function parseCodeReviewXML(reportDir, reportFile) {
    const reportFiles = globSync(`${reportDir}/${reportFile}`);
    const reportResultItems = [];
    reportFiles.forEach((file) => {
        const xml = fs.readFileSync(file, 'utf8');
        const parser = new xml2js.Parser({ explicitArray: false, normalize: true, trim: true });
        parser.parseString(xml, (err, result) => {
            if (err) {
                console.error('Failed to parse xml file: ', err);
            }
            else {
                const node = result.results.result;
                if (Array.isArray(node)) {
                    node.forEach((n) => {
                        const a = n.$;
                        const item = new types_1.ReportResultItem({
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
                }
                else {
                    const a = node.$;
                    const item = new types_1.ReportResultItem({
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
    const reportResult = new types_1.ReportResult(reportDir, reportResultItems);
    console.log(reportResult);
    return reportResult;
}
function parseTestSuiteXML(reportDir, testSuiteFile, rootNode) {
    const reportFiles = globSync(`${reportDir}/${testSuiteFile}`);
    const reportResultItems = [];
    reportFiles.forEach((file) => {
        const fileName = path.basename(file);
        const xml = fs.readFileSync(file, 'utf8');
        const parser = new xml2js.Parser({ explicitArray: false, normalize: true, trim: true });
        parser.parseString(xml, (err, result) => {
            if (err) {
                console.error('Failed to parse xml file: ', err);
            }
            else {
                let node = rootNode ? result.testsuites.testsuite : result.testsuite;
                if (Array.isArray(node)) {
                    node.forEach((n) => {
                        let a = n.$;
                        const item = new types_1.ReportResultItem({
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
                    });
                }
                else {
                    let a = node.$;
                    const item = new types_1.ReportResultItem({
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
    const reportResult = new types_1.ReportResult(reportDir, reportResultItems);
    console.log(reportResult);
    return reportResult;
}
function createTeamsMessageCard(buildSummary) {
    const { buildInfo, codeReviewSummary, unitTestSummary, soapUiTestSummary } = buildSummary;
    // Assuming each summary item has a 'status' property
    let color;
    switch (buildInfo.buildSuccess) {
        case true:
            color = 'green';
            break;
        default:
            color = 'red';
            break;
    }
    const link = `/projects/${buildInfo.project}/${buildInfo.build}`;
    return {
        '@type': 'MessageCard',
        '@context': 'http://schema.org/extensions',
        'themeColor': color,
        'summary': `Build ${buildInfo.build}`,
        'title': `Project: ${buildInfo.project} Build ${buildInfo.build}`,
        'sections': [
            {
                'activityTitle': `Repo: ${buildInfo.repository} \n\nRevision: ${buildInfo.revision} \n\nTags: ${buildInfo.tags} \n\nDate: ${buildInfo.date} \n\nTime: ${buildInfo.time}`,
                'activitySubtitle': `**Status: ${buildInfo.buildSuccess ? 'Success' : 'Failed'}**`,
                "activityImage": "https://adaptivecards.io/content/cats/3.png",
                'facts': codeReviewSummary.data.map(item => ({
                    'name': item[0], // name is at index 0
                    'value': item[1] // value is at index 1
                })),
                'text': `**Code Review:** ${codeReviewSummary.status}\n\n **Unit Tests:** ${unitTestSummary.status}\n\n**Soap UI Tests:** ${soapUiTestSummary.status}`,
                "markdown": "true"
            }
        ], "potentialAction": [{
                "@type": "OpenUri",
                "name": "View Details",
                "targets": [{
                        "os": "default",
                        "uri": "https://learn.microsoft.com/outlook/actionable-messages"
                    }]
            }]
    };
}
app.get('/api/version', (req, res) => {
    // check if version file exists
    if (!fs.existsSync('version.json')) {
        // create a version file from date and return the version
        const version = { version: new Date().toISOString() };
        fs.writeFileSync('version.json', JSON.stringify(version));
        res.json(version);
    }
    else {
        // read the version file and return the version
        const data = fs.readFileSync('version.json', 'utf8');
        const jsonFile = JSON.parse(data);
        res.json(jsonFile);
    }
});
app.get('/api/projects/:project/:build/:report', (req, res) => {
    const project = req.params.project;
    const build = req.params.build;
    const report = req.params.report;
    const projectDir = path.join(config.projectDirectory, project, build);
    const reportDir = path.join(projectDir, report);
    const reportResult = fs.readFileSync(path.join(reportDir, 'reportResult.json'), 'utf8');
    const jsonFile = JSON.parse(reportResult);
    res.json(jsonFile);
});
app.get('/api/projects', (req, res) => {
    const buildSummaries = getBuildSummaries();
    res.json(buildSummaries);
});
app.get('/api/projects/:project', (req, res) => {
    const project = req.params.project;
    const projectDir = path.join(config.projectDirectory, project);
    const buildSummaries = getBuildSummaries(project);
    res.json(buildSummaries);
});
app.get('/api/projects/:project/:build', (req, res) => {
    const project = req.params.project;
    const build = req.params.build;
    const projectDir = path.join(config.projectDirectory, project, build);
    // read summary.json file from the project directory and convert to BuildSummary type
    const data = fs.readFileSync(path.join(projectDir, 'buildSummary.json'), 'utf8');
    const jsonFile = JSON.parse(data);
    res.json(jsonFile);
});
app.post('/api/projects/:project/build', upload.single('file'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        yield extract(file.path, { dir: buildDir });
        // Delete the uploaded zip file
        fs.unlinkSync(file.path);
        // write the buildInfo to a file in the build directory
        fs.writeFileSync(path.join(buildDir, 'buildInfo.json'), JSON.stringify(buildInfo));
        let codeReviewDir = path.join(buildDir, 'codereview');
        let codeReviewResult = new types_1.ReportResult(codeReviewDir, []);
        if (fs.existsSync(codeReviewDir)) {
            codeReviewResult = parseCodeReviewXML(codeReviewDir, 'results.xml');
            fs.writeFileSync(path.join(codeReviewDir, 'reportResult.json'), JSON.stringify(codeReviewResult));
        }
        let unitTestDir = path.join(buildDir, 'unit-tests');
        let junitReportResult = new types_1.ReportResult(unitTestDir, []);
        if (fs.existsSync(unitTestDir)) {
            junitReportResult = parseTestSuiteXML(unitTestDir, 'TESTS-TestSuites.xml', 'testsuites');
            fs.writeFileSync(path.join(unitTestDir, 'reportResult.json'), JSON.stringify(junitReportResult));
        }
        // SOAP UI test directory
        let soapUITestDir = path.join(buildDir, 'soapui');
        let soapUIReportResult = new types_1.ReportResult(soapUITestDir, []);
        if (fs.existsSync(soapUITestDir)) {
            //iterate over the directories in soapUITestDir
            const soapUITestDirs = fs.readdirSync(soapUITestDir);
            soapUITestDirs.forEach((dir) => {
                const fullDir = path.join(soapUITestDir, dir);
                if (fs.statSync(fullDir).isDirectory()) {
                    soapUIReportResult = parseTestSuiteXML(fullDir, 'TEST-*.xml');
                    fs.writeFileSync(path.join(soapUITestDir, 'reportResult.json'), JSON.stringify(soapUIReportResult));
                }
            });
        }
        // create symlink to the latest build
        const latestBuildDir = path.join(projectDir, 'latest');
        if (fs.existsSync(latestBuildDir)) {
            fs.unlinkSync(latestBuildDir);
        }
        let codeReviewSummaryStatus = "Passed";
        let unitTestSummaryStatus = "Passed";
        let soapUITestSummaryStatus = "Passed";
        // set codeReviewSummaryStatus to "Failed" if there are any failures, "Warn" if there are warnings, otherwise set to "Passed"
        if (codeReviewResult.result.some((r) => r.failures > 0)) {
            codeReviewSummaryStatus = "Failed";
        }
        else if (codeReviewResult.result.some((r) => r.warnings > 0)) {
            codeReviewSummaryStatus = "Warn";
        }
        else if (codeReviewResult.result.length === 0) {
            codeReviewSummaryStatus = "Undefined";
        }
        // set unitTestSummaryStatus to "Failed" if there are any failures, "Warn" if there are warnings, otherwise set to "Passed"
        if (junitReportResult.result.some((r) => r.failures > 0)) {
            unitTestSummaryStatus = "Failed";
        }
        else if (junitReportResult.result.some((r) => r.warnings > 0)) {
            unitTestSummaryStatus = "Warn";
        }
        else if (junitReportResult.result.length === 0) {
            unitTestSummaryStatus = "Undefined";
        }
        // set soapUITestSummaryStatus to "Failed" if there are any failures, "Warn" if there are warnings, otherwise set to "Passed"
        if (soapUIReportResult.result.some((r) => r.failures > 0)) {
            soapUITestSummaryStatus = "Failed";
        }
        else if (soapUIReportResult.result.some((r) => r.warnings > 0)) {
            soapUITestSummaryStatus = "Warn";
        }
        else if (soapUIReportResult.result.length === 0) {
            soapUITestSummaryStatus = "Undefined";
        }
        // create codeReviewSummary, unitTestSummary, and soapUITestSummary
        // sum the tests, failures, and warnings for each test suite
        const codeReviewTestCount = codeReviewResult.result.reduce((acc, r) => acc + r.tests, 0);
        const codeReviewFailureCount = codeReviewResult.result.reduce((acc, r) => acc + r.failures, 0);
        const codeReviewWarnCount = codeReviewResult.result.reduce((acc, r) => acc + r.warnings, 0);
        const codeReviewSummaryItem = new types_1.BuildSummaryItem([
            ['Status', 'Count'],
            ['Passed', codeReviewTestCount - codeReviewFailureCount - codeReviewWarnCount],
            ['Failed', codeReviewFailureCount],
            ['Warnings', codeReviewWarnCount],
        ], codeReviewSummaryStatus);
        // sum the tests, failures, and errors for each test suite
        const junitTestCount = junitReportResult.result.reduce((acc, r) => acc + r.tests, 0);
        const junitFailureCount = junitReportResult.result.reduce((acc, r) => acc + r.failures, 0);
        const junitErrorCount = junitReportResult.result.reduce((acc, r) => acc + r.errors, 0);
        const junitSummaryItem = new types_1.BuildSummaryItem([
            ['Status', 'Count'],
            ['Passed', junitTestCount - junitFailureCount - junitErrorCount],
            ['Failed', junitFailureCount],
            ['Errors', junitErrorCount],
        ], unitTestSummaryStatus);
        //sum the tests, failures, and errors for each test suite
        const soapUITestCount = soapUIReportResult.result.reduce((acc, r) => acc + r.tests, 0);
        const soapUIFailureCount = soapUIReportResult.result.reduce((acc, r) => acc + r.failures, 0);
        const soapUIErrorCount = soapUIReportResult.result.reduce((acc, r) => acc + r.errors, 0);
        const soapUISummaryItem = new types_1.BuildSummaryItem([
            ['Status', 'Count'],
            ['Passed', soapUITestCount - soapUIFailureCount - soapUIErrorCount],
            ['Failed', soapUIFailureCount],
            ['Errors', soapUIErrorCount],
        ], soapUITestSummaryStatus);
        buildInfo.buildSuccess = codeReviewSummaryStatus === "Passed" && unitTestSummaryStatus === "Passed" && soapUITestSummaryStatus === "Passed";
        const buildSummary = new types_1.BuildSummary(buildInfo, codeReviewSummaryItem, junitSummaryItem, soapUISummaryItem);
        fs.writeFileSync(path.join(buildDir, 'buildSummary.json'), JSON.stringify(buildSummary));
        fs.symlinkSync(path.join(buildDir), latestBuildDir, 'dir');
        const messageCard = createTeamsMessageCard(buildSummary);
        console.log('Message card: ', messageCard);
        const webhookUrl = config.teamsWebhookUrl;
        axios.post(webhookUrl, messageCard).then((response) => {
            console.log('Message card posted to Teams');
        }).catch((error) => {
            console.error('Failed to post message card to Teams: ', error);
        });
        res.status(200).send('File uploaded and extracted successfully');
    }
    catch (err) {
        console.error('Failed to extract file: ', err);
        res.status(500).send('Failed to extract file');
    }
}));
// create a zip file of the build directory and return it
app.get('/projects/:project/:build/download', (req, res) => {
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
    archive.on('error', (err) => {
        res.status(500).send('Server error');
    });
    archive.pipe(output);
    archive.directory(projectDir, false);
    archive.finalize();
});
app.get('/api/files/*', (req, res) => {
    const filePath = path.join(config.projectDirectory, req.params[0]);
    // ensure that filePath is a subdirectory of projectDirectory
    if (!filePath.startsWith(config.projectDirectory)) {
        res.status(403).send('Forbidden');
        return;
    }
    fs.stat(filePath, (err, stats) => {
        if (err) {
            res.status(404).send('Not found');
            return;
        }
        if (stats.isDirectory()) {
            fs.readdir(filePath, (err, files) => {
                if (err) {
                    res.status(500).send('Server error');
                    return;
                }
                const fileOrDirectories = files.map((file) => {
                    const isDirectory = fs.statSync(path.join(filePath, file)).isDirectory();
                    return { name: file, isDirectory, path: path.join(req.params[0], file) };
                });
                // prepend the parent directory as ".." if it's not the config.projectDirectory
                if (filePath !== config.projectDirectory) {
                    fileOrDirectories.unshift({ name: '..', isDirectory: true, path: path.join(req.params[0], '..') });
                }
                res.json(fileOrDirectories);
            });
        }
        else {
            res.download(filePath);
        }
    });
});
app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../client/build/index.html')));
app.listen(3001, () => {
    console.log('Project directory: ', config.projectDirectory);
    if (!fs.existsSync(config.projectDirectory)) {
        fs.mkdirSync(config.projectDirectory);
    }
    console.log('Server is running on http://localhost:3000');
});
