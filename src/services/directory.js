import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';

// Change the current working directory
export function changeDir(directory) {
    if (typeof directory !== 'string' || directory.trim() === '') {
        console.log('Usage: cd("path/to/directory")');
        return;
    }

    try {
        process.chdir(directory);
        console.log(`Current directory: ${process.cwd()}`);
    } catch (error) {
        console.error(`Cannot change directory: ${error.message}`);
    }
}

export function currentDir() {
    console.log(process.cwd());
}

// List entries in the current or specified directory
export function listDir(directory = '.') {
    if (typeof directory !== 'string' || directory.trim() === '') {
        console.log('Usage: ls() or ls("path/to/directory")');
        return;
    }

    try {
        const target = resolve(directory);
        const entries = readdirSync(target, { withFileTypes: true });

        // Show directories first, then sort entries alphabetically.
        entries.sort((a, b) => {
            const directoryOrder =
                Number(b.isDirectory()) - Number(a.isDirectory());

            return directoryOrder || a.name.localeCompare(b.name);
        });

        console.log(`Contents of: ${target}`);

        if (entries.length === 0) {
            console.log('(empty directory)');
            return;
        }

        for (const entry of entries) {
            const suffix = entry.isDirectory()
                ? '/'
                : entry.isSymbolicLink()
                    ? ' -> [symlink]'
                    : '';

            console.log(`${entry.name}${suffix}`);
        }
    } catch (error) {
        console.error(`Cannot list directory: ${error.message}`);
    }
}