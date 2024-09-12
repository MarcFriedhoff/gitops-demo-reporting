// define Project class

export class Project {
  id: number = 0;
  name: string = "";
  description: string = "";
  constructor(id: number, name: string, description: string) {
    this.id = id;
    this.name = name;
    this.description = description;
  }
}

export class CodeReviewConfig {
  failedChecksAllowed: number = 0;
}

export class AppConfig {
  projectDirectory: string = "";
  teamsWebhookUrl: any;
  teamsActivityImage: string = "";
  uploadDirectory: string = "";
  codeReviewConfig: CodeReviewConfig = new CodeReviewConfig();
  messageCardTemplate: string = "";
  frontEndUrl: string = "";
  proxy: ProxyConfig = new ProxyConfig();

  constructor(projectDirectory: string) {
    this.projectDirectory = projectDirectory;
  }
}

export class ProxyConfig {
  proxyProtocol: string = "http";
  proxyHost: string = "";
  proxyPort: number = 8080;
}

export class BuildSummaryItem {
  data: any[] = [];
  status: string = "";
  constructor(data: any[], status: string) {
    this.data = data;
    this.status = status;
  }
}

export class BuildSummary {
  buildInfo: BuildInfo;
  codeReviewSummary: BuildSummaryItem;
  unitTestSummary: BuildSummaryItem;
  soapUiTestSummary: BuildSummaryItem;
  
  constructor(buildInfo: BuildInfo, codeReviewSummary: BuildSummaryItem, unitTestSummary: BuildSummaryItem, soapUiTestSummary: BuildSummaryItem) {
    this.buildInfo = buildInfo;
    this.codeReviewSummary = codeReviewSummary;
    this.unitTestSummary = unitTestSummary;
    this.soapUiTestSummary = soapUiTestSummary;
  }
}

export class BuildInfo {
  project: string;
  build: string;
  repository: string;
  tags?: string[] = [];
  revision: string = "";
  date?: string = "";
  time?: string = "";
  buildSuccess: boolean = false;

  constructor(project: string, build: string, buildSuccess: boolean, repository: string, revision: string, tags?: string[], date?: string, time?: string) {
    this.project = project;
    this.build = build;
    this.buildSuccess = buildSuccess;
    this.repository = repository;
    this.tags = tags;
    this.revision = revision;

    if (date === undefined) {
      this.date = new Date().toLocaleDateString();
    } else {
      this.date = date;
    }
    if (time === undefined) {
      time = new Date().toLocaleTimeString();
    } else {
      this.time = time;
    }

  }
}

export class ReportResult {
  reportName: string;
  result: ReportResultItem[];

  constructor(reportName: string, result: ReportResultItem[]) {
    this.reportName = reportName;
    this.result = result;
  }
}

export class ReportResultItem {
  name: string = ""; 
  packageName: string = ""; 
  hostname: string = "";
  tests: number = 0;
  errors: number = 0;
  failures: number = 0;
  skipped: number = 0;
  warnings: number = 0;
  time: number = 0.0;
  timestamp: Date | null = null;

  constructor({name, packageName, hostname, tests, errors, failures, skipped, warnings, time, timestamp}: {name: string, packageName: string, hostname: string, tests: number, errors: number, failures: number, skipped: number, warnings: number, time: number, timestamp: Date}) {
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