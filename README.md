# JS Go To Test

Jump between and test in JavaScript/TypeScript project.

## Usage 

In the .js or .ts file, push `Ctrl + Alt + T`.
Jump to the test file according to the following rules.

- Explorer the test file in the same folder.
  - e.g. `src/foo/bar.ts` jumps to `src/foo/bar.test.ts`.
- Explorer the test (or same name) file in the test folder.
  - The folders have the same directory structure from the root of source.
  - e.g. `src/foo/bar.ts` jumps to `__test__/foo/bar.test.ts`.

If a test file was opened, do the reverse.

![movie](https://user-images.githubusercontent.com/13149507/147128991-48006ad3-75e5-4f3d-88a7-217bd7e9a17b.gif)
