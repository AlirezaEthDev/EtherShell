import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';

// Change the current working directory
export function changeDir(directory) {
    if (typeof directory !== 'string' || directory.trim() === '') {
        console.log('Usage: cd path/to/directory');
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
        console.log('Usage: ls or ls path/to/directory');
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

/**
 * Saved directories, most recent first.
 * The current directory is read from process.cwd() rather than stored,
 * so cd() continues to work correctly alongside pushd()/popd().
 *
 * This stack exists only for the current EtherShell session.
 */
const directoryStack = [];

/**
 * Print the directory stack, with the current directory first.
 * JSON quoting makes paths containing spaces easier to distinguish.
 */
function printDirectoryStack() {
    console.log(
        [process.cwd(), ...directoryStack]
            .map(directory => JSON.stringify(directory))
            .join(' ')
    );
}

/**
 * Save the current directory and change to another directory.
 * With no argument, swap the current directory with the most
 * recently saved directory.
 *
 * @param {string} [directory]
 */
export function pushd(directory) {
    if (
        directory !== undefined &&
        (typeof directory !== 'string' || directory.trim() === '')
    ) {
        console.log('Usage: pushd or pushd path/to/directory');
        return;
    }

    try {
        const current = process.cwd();

        if (directory === undefined) {
            if (directoryStack.length === 0) {
                console.error('pushd: no other directory');
                return;
            }

            // Change directory first; preserve the stack if it fails.
            process.chdir(directoryStack[0]);
            directoryStack[0] = current;
        } else {
            const target = resolve(directory);

            // Save the old directory only after a successful change.
            process.chdir(target);
            directoryStack.unshift(current);
        }

        printDirectoryStack();
    } catch (error) {
        console.error(`pushd: ${error.message}`);
    }
}

/**
 * Return to the most recently saved directory and remove it
 * from the saved stack.
 */
export function popd() {
    if (directoryStack.length === 0) {
        console.error('popd: directory stack empty');
        return;
    }

    try {
        // Remove the saved directory only after a successful change.
        process.chdir(directoryStack[0]);
        directoryStack.shift();

        printDirectoryStack();
    } catch (error) {
        console.error(`popd: ${error.message}`);
    }
}