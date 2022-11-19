# JS Teleporter

JS Teleporter is VSCode extension to teleport between code like following in JavaScript/TypeScript project.

- .js(x) or .ts(x) file <-> test file 
- .jsx or tsx file <-> storybook

## Demo

### Test - Demo

![usage test](https://user-images.githubusercontent.com/13149507/202853530-e3e85cda-8a26-47d2-9d69-82ecc33e9c03.gif)

### Storybook - Demo

![usage storybook](https://user-images.githubusercontent.com/13149507/202853523-a58ac81d-6981-47cd-afbe-821cdf19ba29.gif)


## Installation

Install [JS Teleporter - Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=sa2taka.js-teleporter).

## Usage 

### Test

In the .js(x) or .ts(x) file, push `Ctrl + Alt + T`.
Teleport to the test file according to the following rules. 

- Explorer the test file in the same folder.
  - e.g. `src/foo/bar.ts` teleports to `src/foo/bar.test.ts`.
  - ![test in same folder](https://user-images.githubusercontent.com/13149507/202853996-df8732c9-6ede-4bce-8270-06ab4a2323bb.gif)
- Explorer the test (or same name) file in the test folder.
  - The folders have the same directory structure from the root of source.
  - e.g. `src/foo/bar.ts` teleports to `__test__/foo/bar.test.ts`, `src/__tests__/foo/bar.test.ts` or `src/foo/__tests__/bar.test.ts`. If there is more than one, it will be created in the closest folder.
  - ![test in test folder](https://user-images.githubusercontent.com/13149507/202854002-28033fe3-3a94-42b6-a731-5aa98f3d0e05.gif)
- If a test file was opened, do the reverse.

If the test file does not exist, a new test file can be created.

![test not found](https://user-images.githubusercontent.com/13149507/202854008-f155952c-b6c0-4b4c-a23a-2bfb2c5a973b.gif)


Currently, the suffix of the test file is always added to the end of the file name (default: `.test`).

### Storybook

In the .jsx or tsx file, push `Ctrl + Alt + S`.
The rules of teleport are exactly the same as in the [test](#test), differing only in filename suffixes and directories to be searched.

## Config

| name                 | type            | descriptions                                                                               | default                                                                                |
| -------------------- | --------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| sourceRoot           | string          | Root directory of source.                                                                  | `"src"`                                                                                |
| testSourceRoots      | array of string | Root directories of tests. Files under configured directories are considered tests.        | `["__tests__", "__specs__", "__test__", "__spec__", "tests", "specs", "test", "spec"]` |
| testFileSuffix       | string          | Suffix to determine if the file is a test.                                                 | `".test"`                                                                              |
| testSourceRoots      | array of string | Root directories of tests. Files under configured directories are considered tests.        | `["__tests__", "__specs__", "__test__", "__spec__", "tests", "specs", "test", "spec"]` |
| testFileSuffix       | string          | Suffix to determine if the file is a test.                                                 | `".test"`                                                                              |
| storybookSourceRoots | array of string | Root directories of storybook. Files under configured directories are considered storybook | `["stories"]`                                                                          |
| storybookFileSuffix  | string          | Suffix to determine if the file is a story book                                            | `.stories`                                                                             |
