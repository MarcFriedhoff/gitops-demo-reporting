"use strict";
// define Project class
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportResultItem = exports.ReportResult = exports.BuildInfo = exports.BuildSummary = exports.BuildSummaryItem = exports.AppConfig = exports.Project = void 0;
class Project {
    constructor(id, name, description) {
        this.id = 0;
        this.name = "";
        this.description = "";
        this.id = id;
        this.name = name;
        this.description = description;
    }
}
exports.Project = Project;
class AppConfig {
    constructor(projectDirectory) {
        this.projectDirectory = "";
        this.projectDirectory = projectDirectory;
    }
}
exports.AppConfig = AppConfig;
class BuildSummaryItem {
    constructor(data, status) {
        this.data = [];
        this.status = "";
        this.data = data;
        this.status = status;
    }
}
exports.BuildSummaryItem = BuildSummaryItem;
class BuildSummary {
    constructor(buildInfo, codeReviewSummary, unitTestSummary, soapUiTestSummary) {
        this.buildInfo = buildInfo;
        this.codeReviewSummary = codeReviewSummary;
        this.unitTestSummary = unitTestSummary;
        this.soapUiTestSummary = soapUiTestSummary;
    }
}
exports.BuildSummary = BuildSummary;
class BuildInfo {
    constructor(project, build, buildSuccess, repository, revision, tags, date, time) {
        this.tags = [];
        this.revision = "";
        this.date = "";
        this.time = "";
        this.buildSuccess = false;
        this.project = project;
        this.build = build;
        this.buildSuccess = buildSuccess;
        this.repository = repository;
        this.tags = tags;
        this.revision = revision;
        if (date === undefined) {
            this.date = new Date().toLocaleDateString();
        }
        else {
            this.date = date;
        }
        if (time === undefined) {
            time = new Date().toLocaleTimeString();
        }
        else {
            this.time = time;
        }
    }
}
exports.BuildInfo = BuildInfo;
class ReportResult {
    constructor(reportName, result) {
        this.reportName = reportName;
        this.result = result;
    }
}
exports.ReportResult = ReportResult;
class ReportResultItem {
    constructor({ name, packageName, hostname, tests, errors, failures, skipped, warnings, time, timestamp }) {
        this.name = "";
        this.packageName = "";
        this.hostname = "";
        this.tests = 0;
        this.errors = 0;
        this.failures = 0;
        this.skipped = 0;
        this.warnings = 0;
        this.time = 0.0;
        this.timestamp = null;
        this.name = name;
        this.packageName = packageName;
        this.hostname = hostname;
        this.tests = tests;
        this.errors = errors;
        this.failures = failures;
        this.skipped = skipped;
        this.warnings = warnings;
        this.time = time;
        this.timestamp = timestamp;
    }
}
exports.ReportResultItem = ReportResultItem;
