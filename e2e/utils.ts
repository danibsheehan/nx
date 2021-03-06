import { execSync, exec } from 'child_process';
import { readFileSync, statSync, writeFileSync } from 'fs';
import { ensureDirSync } from 'fs-extra';
import * as path from 'path';

const projectName: string = 'proj';

export function runNgNew(command?: string, silent?: boolean): string {
  return execSync(
    `../node_modules/.bin/ng new proj --no-interactive ${command}`,
    {
      cwd: `./tmp`,
      ...(silent ? { stdio: ['ignore', 'ignore', 'ignore'] } : {})
    }
  ).toString();
}

export function newProject(): void {
  cleanup();
  if (!directoryExists('./tmp/proj_backup')) {
    // TODO delete the try catch after 0.8.0 is released
    try {
      runNgNew('--collection=@nrwl/schematics --npmScope=proj', true);
    } catch (e) {}
    copyMissingPackages();
    execSync('mv ./tmp/proj ./tmp/proj_backup');
  }
  execSync('cp -a ./tmp/proj_backup ./tmp/proj');
}

export function newBazelProject(): void {
  cleanup();
  if (!directoryExists('./tmp/proj_bazel_backup')) {
    // TODO delete the try catch after 0.8.0 is released
    try {
      runNgNew('--collection=@nrwl/bazel --npmScope=proj', true);
    } catch (e) {}
    copyMissingPackages();
    execSync('mv ./tmp/proj ./tmp/proj_backup');
  }
  execSync('cp -a ./tmp/proj_bazel_backup ./tmp/proj');
}

export function createNxWorkspace(command: string): string {
  cleanup();
  return execSync(
    `node ../node_modules/@nrwl/schematics/bin/create-nx-workspace.js ${command}`,
    { cwd: `./tmp` }
  ).toString();
}

export function copyMissingPackages(): void {
  const modulesToCopy = [
    '@ngrx',
    '@nrwl',
    'angular',
    '@angular/upgrade',
    'npm-run-all',
    'yargs',
    'yargs-parser'
  ];
  modulesToCopy.forEach(m => copyNodeModule(projectName, m));
  execSync('rm -rf tmp/proj/node_modules/.bin/webpack');
  execSync(
    `cp -a node_modules/.bin/webpack tmp/proj/node_modules/.bin/webpack`
  );
}

function copyNodeModule(path: string, name: string) {
  execSync(`rm -rf tmp/${path}/node_modules/${name}`);
  execSync(`cp -a node_modules/${name} tmp/${path}/node_modules/${name}`);
}

export function runCommandAsync(
  command: string,
  opts = {
    silenceError: false
  }
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    exec(
      command,
      {
        cwd: `./tmp/proj`
      },
      (err, stdout, stderr) => {
        if (!opts.silenceError && err) {
          reject(err);
        }
        resolve({ stdout, stderr });
      }
    );
  });
}

export function runCLIAsync(
  command: string,
  opts = {
    silenceError: false
  }
): Promise<{ stdout: string; stderr: string }> {
  return runCommandAsync(`./node_modules/.bin/ng ${command}`, opts);
}

export function runCLI(
  command?: string,
  opts = {
    silenceError: false
  }
): string {
  try {
    return execSync(`./node_modules/.bin/ng ${command}`, {
      cwd: `./tmp/${projectName}`
    })
      .toString()
      .replace(
        /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
        ''
      );
  } catch (e) {
    if (opts.silenceError) {
      return e.stdout.toString();
    } else {
      console.log(e.stdout.toString(), e.stderr.toString());
      throw e;
    }
  }
}

export function newApp(name: string): string {
  return runCLI(`generate app --no-interactive ${name}`);
}

export function newLib(name: string): string {
  return runCLI(`generate lib --no-interactive ${name}`);
}

export function newModule(name: string): string {
  return runCLI(`generate module ${name}`);
}

export function runCommand(command: string): string {
  try {
    return execSync(command, {
      cwd: `./tmp/${projectName}`,
      stdio: ['pipe', 'pipe', 'pipe']
    }).toString();
  } catch (e) {
    return e.stdout.toString() + e.stderr.toString();
  }
}

export function updateFile(f: string, content: string): void {
  ensureDirSync(path.dirname(path.join(getCwd(), 'tmp', 'proj', f)));
  writeFileSync(path.join(getCwd(), 'tmp', 'proj', f), content);
}

export function checkFilesExist(...expectedFiles: string[]) {
  expectedFiles.forEach(f => {
    const ff = f.startsWith('/')
      ? f
      : path.join(getCwd(), 'tmp', projectName, f);
    if (!exists(ff)) {
      throw new Error(`File '${ff}' does not exist`);
    }
  });
}

export function readJson(f: string): any {
  return JSON.parse(readFile(f));
}

export function readFile(f: string) {
  const ff = f.startsWith('/') ? f : path.join(getCwd(), 'tmp', projectName, f);
  return readFileSync(ff).toString();
}

export function cleanup() {
  execSync('rm -rf ./tmp/proj');
}

export function purge() {
  execSync('rm -rf ./tmp');
}

export function getCwd(): string {
  return process.cwd();
}

export function directoryExists(filePath: string): boolean {
  try {
    return statSync(filePath).isDirectory();
  } catch (err) {
    return false;
  }
}

export function fileExists(filePath: string): boolean {
  try {
    return statSync(filePath).isFile();
  } catch (err) {
    return false;
  }
}

export function exists(filePath: string): boolean {
  return directoryExists(filePath) || fileExists(filePath);
}

export function getSize(filePath: string): number {
  return statSync(filePath).size;
}
