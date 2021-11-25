"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const exec = __importStar(require("@actions/exec"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const axios_1 = __importDefault(require("axios"));
const formatter_1 = require("xcresulttool/src/formatter");
const fs_1 = require("fs");
const { stat } = fs_1.promises;
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const inputPaths = getMultilineInput("path");
            const showPassedTests = getBooleanInput("show-passed-tests");
            const showCodeCoverage = getBooleanInput("show-code-coverage");
            const bundlePaths = [];
            for (const checkPath of inputPaths) {
                try {
                    yield stat(checkPath);
                    bundlePaths.push(checkPath);
                }
                catch (error) {
                    console.error(error.message);
                }
            }
            let bundlePath = path.join(os.tmpdir(), "Merged.xcresult");
            if (inputPaths.length > 1) {
                yield mergeResultBundle(bundlePaths, bundlePath);
            }
            else {
                const inputPath = inputPaths[0];
                yield stat(inputPath);
                bundlePath = inputPath;
            }
            const formatter = new formatter_1.Formatter(bundlePath);
            const report = yield formatter.format({
                showPassedTests,
                showCodeCoverage,
            });
            const charactersLimit = 65535;
            let title = getInput("title");
            if (title.length > charactersLimit) {
                console.error(`The 'title' will be truncated because the character limit (${charactersLimit}) exceeded.`);
                title = title.substring(0, charactersLimit);
            }
            let reportSummary = report.reportSummary;
            if (reportSummary.length > charactersLimit) {
                console.error(`The 'summary' will be truncated because the character limit (${charactersLimit}) exceeded.`);
                reportSummary = reportSummary.substring(0, charactersLimit);
            }
            let reportDetail = report.reportDetail;
            if (reportDetail.length > charactersLimit) {
                console.error(`The 'text' will be truncated because the character limit (${charactersLimit}) exceeded.`);
                reportDetail = reportDetail.substring(0, charactersLimit);
            }
            if (report.annotations.length > 50) {
                console.error("Annotations that exceed the limit (50) will be truncated.");
            }
            const annotations = report.annotations.slice(0, 50);
            const owner = process.env["INPUT_GITHUB_OWNER"];
            const repo = process.env["INPUT_GITHUB_REPO"];
            const sha = process.env["INPUT_GITHUB_SHA"];
            let output;
            if (reportDetail.trim()) {
                output = {
                    title: "Xcode test results",
                    summary: reportSummary,
                    text: reportDetail,
                    annotations,
                };
            }
            else {
                output = {
                    title: "Xcode test results",
                    summary: reportSummary,
                    annotations,
                };
            }
            yield axios_1.default.post(`https://make-check.vercel.app/repos/${owner}/${repo}/check-runs`, {
                owner,
                repo,
                name: title,
                head_sha: sha,
                details_url: process.env["BITRISE_BUILD_URL"],
                external_id: process.env["BITRISE_BUILD_NUMBER"],
                status: "completed",
                conclusion: report.testStatus,
                output,
            }, {
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
            });
        }
        catch (error) {
            throw error;
        }
    });
}
run();
function mergeResultBundle(inputPaths, outputPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const args = ["xcresulttool", "merge"]
            .concat(inputPaths)
            .concat(["--output-path", outputPath]);
        const options = {
            silent: true,
        };
        yield exec.exec("xcrun", args, options);
    });
}
function getInput(name, options) {
    const val = process.env[`INPUT_${name.replace(/ /g, "_").toUpperCase()}`] || "";
    if (options && options.required && !val) {
        throw new Error(`Input required and not supplied: ${name}`);
    }
    if (options && options.trimWhitespace === false) {
        return val;
    }
    return val.trim();
}
function getMultilineInput(name, options) {
    const inputs = getInput(name, options)
        .split("\n")
        .filter((x) => x !== "");
    return inputs;
}
function getBooleanInput(name, options) {
    const trueValue = ["true", "True", "TRUE"];
    const falseValue = ["false", "False", "FALSE"];
    const val = getInput(name, options);
    if (trueValue.includes(val))
        return true;
    if (falseValue.includes(val))
        return false;
    throw new TypeError(`Input does not meet YAML 1.2 "Core Schema" specification: ${name}\n` +
        `Support boolean input list: \`true | True | TRUE | false | False | FALSE\``);
}
