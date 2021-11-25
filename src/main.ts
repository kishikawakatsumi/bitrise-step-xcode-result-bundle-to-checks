import * as exec from "@actions/exec";
import * as os from "os";
import * as path from "path";
import axios from "axios";
import { Formatter } from "xcresulttool/src/formatter";
import { promises } from "fs";
const { stat } = promises;

async function run(): Promise<void> {
  try {
    const inputPaths = getMultilineInput("path");
    const showPassedTests = getBooleanInput("show-passed-tests");
    const showCodeCoverage = getBooleanInput("show-code-coverage");

    const bundlePaths: string[] = [];
    for (const checkPath of inputPaths) {
      try {
        await stat(checkPath);
        bundlePaths.push(checkPath);
      } catch (error) {
        console.error((error as Error).message);
      }
    }
    let bundlePath = path.join(os.tmpdir(), "Merged.xcresult");
    if (inputPaths.length > 1) {
      await mergeResultBundle(bundlePaths, bundlePath);
    } else {
      const inputPath = inputPaths[0];
      await stat(inputPath);
      bundlePath = inputPath;
    }

    const formatter = new Formatter(bundlePath);
    const report = await formatter.format({
      showPassedTests,
      showCodeCoverage,
    });

    const charactersLimit = 65535;
    let title = getInput("title");
    if (title.length > charactersLimit) {
      console.error(
        `The 'title' will be truncated because the character limit (${charactersLimit}) exceeded.`
      );
      title = title.substring(0, charactersLimit);
    }
    let reportSummary = report.reportSummary;
    if (reportSummary.length > charactersLimit) {
      console.error(
        `The 'summary' will be truncated because the character limit (${charactersLimit}) exceeded.`
      );
      reportSummary = reportSummary.substring(0, charactersLimit);
    }
    let reportDetail = report.reportDetail;
    if (reportDetail.length > charactersLimit) {
      console.error(
        `The 'text' will be truncated because the character limit (${charactersLimit}) exceeded.`
      );
      reportDetail = reportDetail.substring(0, charactersLimit);
    }

    if (report.annotations.length > 50) {
      console.error(
        "Annotations that exceed the limit (50) will be truncated."
      );
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
    } else {
      output = {
        title: "Xcode test results",
        summary: reportSummary,
        annotations,
      };
    }

    await axios.post(
      `https://make-check.vercel.app/repos/${owner}/${repo}/check-runs`,
      {
        owner,
        repo,
        name: title,
        head_sha: sha,
        details_url: process.env["BITRISE_BUILD_URL"],
        external_id: process.env["BITRISE_BUILD_NUMBER"],
        status: "completed",
        conclusion: report.testStatus,
        output,
      },
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    throw error;
  }
}

run();

async function mergeResultBundle(
  inputPaths: string[],
  outputPath: string
): Promise<void> {
  const args = ["xcresulttool", "merge"]
    .concat(inputPaths)
    .concat(["--output-path", outputPath]);
  const options = {
    silent: true,
  };

  await exec.exec("xcrun", args, options);
}

function getInput(name: string, options?: InputOptions): string {
  const val: string =
    process.env[`INPUT_${name.replace(/ /g, "_").toUpperCase()}`] || "";
  if (options && options.required && !val) {
    throw new Error(`Input required and not supplied: ${name}`);
  }

  if (options && options.trimWhitespace === false) {
    return val;
  }

  return val.trim();
}

function getMultilineInput(name: string, options?: InputOptions): string[] {
  const inputs: string[] = getInput(name, options)
    .split("\n")
    .filter((x) => x !== "");

  return inputs;
}

function getBooleanInput(name: string, options?: InputOptions): boolean {
  const trueValue = ["true", "True", "TRUE"];
  const falseValue = ["false", "False", "FALSE"];
  const val = getInput(name, options);
  if (trueValue.includes(val)) return true;
  if (falseValue.includes(val)) return false;
  throw new TypeError(
    `Input does not meet YAML 1.2 "Core Schema" specification: ${name}\n` +
      `Support boolean input list: \`true | True | TRUE | false | False | FALSE\``
  );
}

interface InputOptions {
  required?: boolean;
  trimWhitespace?: boolean;
}
