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
