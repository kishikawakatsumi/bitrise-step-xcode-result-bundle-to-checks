# Xcode result bundle to Checks

A Bitrise Step that generates a human-readable test report from the Xcode result bundle and shows it on GitHub Checks.

<img width="600" alt="Screen Shot" src="https://user-images.githubusercontent.com/40610/138135764-e9c30d24-2dee-4db7-abfd-1533ec5ec2bc.png">

The result is formatted into a test report that shows the success or failure of the tests, logs, activities, and saved screenshots.

Here is [an example result](https://github.com/kishikawakatsumi/xcresulttool-example-bitrise/pull/2/checks?check_run_id=3995206023).

<img width="300" height="300" alt="Screen Shot" src="https://user-images.githubusercontent.com/40610/138133779-fcf57fde-ef67-4207-a2ed-6d13c47842aa.png"> <img width="300" height="300" alt="Screen Shot" src="https://user-images.githubusercontent.com/40610/138133993-0573480d-1840-4f3e-987f-af928978972f.png">

<img width="300" height="300" alt="Screen Shot" src="https://user-images.githubusercontent.com/40610/138134540-823d2cb5-82c0-45b6-a551-f68c4befa08d.png"> <img width="300" height="300" alt="Screen Shot" src="https://user-images.githubusercontent.com/40610/138134559-43fc5f7a-6ce3-4992-b3e6-f6c3cd995dfb.png">

<img width="300" height="300" alt="Screen Shot" src="https://user-images.githubusercontent.com/40610/138134800-38262042-e053-4522-ac9b-308e0046e872.png"> <img width="300" height="300" alt="Screen Shot" src="https://user-images.githubusercontent.com/40610/138134810-9c9f5a94-4642-482c-9414-ee83bd74f917.png">

## Pre-Requisites

### Install Helper GitHub App

GitHub Checks can only be updated via the GitHub App. Therefore, to use this step, install this Xcode Result to Check app in your repository.

https://github.com/apps/xcode-result-to-check

### Save the result bundle to an accessible location in the previous step

This step only works on macOS stacks.

By default `xcodebuild` will generate the `xcresult` bundle file to a randomly named directory in `DerivedData`. To use this action `xcodebuild`
needs to generate `xcresult` bundle to an accessible location.

This can be done using the `-resultBundlePath` flag in `xcodebuild`.

If you use the "Xcode Test for iOS" step, the result bundle will be saved at `$BITRISE_XCRESULT_PATH`.

Otherwise, specify the destination path with the -resultBundlePath flag to the xcodebuild command as follows.

```yaml

---
- script@1:
    inputs:
      - content: |-
          #!/usr/bin/env bash
          set -ex

          xcodebuild -scheme MyFramework -resultBundlePath TestResults test
```

# Usage

> For complete input/output documentation, see [step.yml](step.yml).

## Example

```yaml
...
workflows:
  primary:
    steps:
    ...
    - git::https://github.com/kishikawakatsumi/bitrise-step-xcode-result-bundle-to-checks.git@main:
        inputs:
        - xcresult_path: "$BITRISE_XCRESULT_PATH"
...
```

## Input parameters

```yaml
- git::https://github.com/kishikawakatsumi/bitrise-step-xcode-result-bundle-to-checks.git@main:
    inputs:
      # Path to the xcresult bundle.
      #
      # Default: $BITRISE_XCRESULT_PATH
      - xcresult_path: "$BITRISE_XCRESULT_PATH"

      # Title for the check results.
      #
      # Default: 'Xcode test results'
      - title: Xcode test results
```

## Limitations

GitHub Checks has a maximum text limit of 65535 characters. Currently, any text longer than that will be automatically truncated.

There is a limit of 50 annotations in GitHub Checks. Currently, any annotations longer than that will be automatically truncated.
