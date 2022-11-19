# JS Teleporter

JS Teleporter is VSCode extension to teleport between code like following in JavaScript/TypeScript project.

- .js(x) or .ts(x) file <-> test file 

![usage](https://user-images.githubusercontent.com/13149507/202841455-0bd2c78c-9b26-4b3f-bbfd-31afb172c92f.gif)

## Installation

Install [JS go to test - Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=sa2taka.js-go-to-test).

## Usage 

In the .js(x) or .ts(x) file, push `Ctrl + Alt + T`.
Teleport to the test file according to the following rules.

- Explorer the test file in the same folder.
  - e.g. `src/foo/bar.ts` teleports to `src/foo/bar.test.ts`.
  - ![same folder test](https://user-images.githubusercontent.com/13149507/202842184-9623e7d7-627f-4c59-9883-ecf8598c7cd7.gif)
- Explorer the test (or same name) file in the test folder.
  - The folders have the same directory structure from the root of source.
  - e.g. `src/foo/bar.ts` teleports to `__test__/foo/bar.test.ts`, `src/__tests__/foo/bar.test.ts` or `src/foo/__tests__/bar.test.ts`. If there is more than one, it will be created in the closest folder.

  - ![example sample file](https://user-images.githubusercontent.com/13149507/202842124-9bbb9c31-8ab6-4dc0-a7f1-7504a948ea5b.gif)

If a test file was opened, do the reverse.

If the test file does not exist, a new test file can be created.

![behavior of the no existing the test file](https://user-images.githubusercontent.com/13149507/202842760-2a5e3afd-b333-4b80-9dd1-b344a42bf97d.gif)


Currently, you can create a test file only if you have a test folder such as `__tests__`. Also, the suffix of the test file is always added to the end of the file name (default: `.test`).

## Config

| name            | type            | descriptions                                                                        | default                                                                                |
| --------------- | --------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| testSourceRoots | array of string | Root directories of tests. Files under configured directories are considered tests. | `["__tests__", "__specs__", "__test__", "__spec__", "tests", "specs", "test", "spec"]` |
| sourceRoot      | string          | Root directory of source.                                                           | `"src"`                                                                                |
| testFileSuffix  | string          | Suffix to determine if the file is a test.                                          | `".test"`                                                                              |
