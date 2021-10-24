import * as exec from "@actions/exec";
import * as os from "os";
import * as path from "path";
import axios from "axios";
import { Formatter } from "xcresulttool/src/formatter";
import { promises } from "fs";
const { stat } = promises;

async function run(): Promise<void> {
  try {
    const inputPath: string | undefined = process.env["INPUT_PATH"];
    if (!inputPath) {
      return;
    }

    const paths = inputPath.split("\n");
    const existPaths: string[] = [];
    for (const checkPath of paths) {
      try {
        await stat(checkPath);
        existPaths.push(checkPath);
      } catch (error) {
        console.error((error as Error).message);
      }
    }
    let bundlePath = path.join(os.tmpdir(), "Merged.xcresult");
    if (paths.length > 1) {
      await mergeResultBundle(existPaths, bundlePath);
    } else {
      await stat(inputPath);
      bundlePath = inputPath;
    }

    const formatter = new Formatter(bundlePath);
    const report = await formatter.format();

    const charactersLimit = 65535;
    let title = process.env["INPUT_TITLE"] || "Xcode test results";
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

    console.log(reportSummary);
    console.log(reportDetail);

    const owner = process.env["INPUT_GITHUB_OWNER"];
    const repo = process.env["INPUT_GITHUB_REPO"];
    const sha = process.env["INPUT_GITHUB_SHA"];

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
        output: {
          title: "Xcode test results",
          summary: reportSummary,
          text: reportDetail,
          annotations,
        },
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
