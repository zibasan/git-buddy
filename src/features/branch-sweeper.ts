import { checkbox, confirm, select } from '@inquirer/prompts';
import chalk from 'chalk';
import Table from 'cli-table3';
import logSymbols from 'log-symbols';
import ora from 'ora';
import type { BranchSummary } from 'simple-git';
import { git } from '../utils/git.js';
import { error, success, warn } from '../utils/symbols.js';

const PROTECTED_BRANCHES = ['main', 'master', 'develop'];

export async function runBranchSweeper() {
  try {
    const isRepo = await git.checkIsRepo();
    if (!isRepo) {
      console.log(error + chalk.red(' Current directory is not a Git repository.'));
      return;
    }

    const spinner = ora(
      chalk.bgCyan.white(' FETCHING ') + chalk.cyan(' Fetching branch information...'),
    ).start();

    let branchSummary: BranchSummary;
    let mergedBranches: string[];
    let currentBranch: string;

    try {
      branchSummary = await git.branch();
      currentBranch = branchSummary.current;

      const mergedBranchesStr = await git.raw(['branch', '--merged']);
      mergedBranches = mergedBranchesStr
        .split('\n')
        .map((b) => b.replace('*', '').trim())
        .filter(Boolean);

      spinner.stop();
    } catch (error) {
      spinner.fail(
        chalk.bgRed.white(' FATAL ') +
          chalk.red(
            ' Failed to retrieve branch information. \nPlease ensure you have Git installed and are in a valid repository.',
          ),
      );
      throw error;
    }

    const table = new Table({
      head: [chalk.bold('Branch Name'), chalk.bold('Status'), chalk.bold('Merged')],
      style: { head: ['cyan'] },
    });

    const branchesToDelete: string[] = [];

    for (const branch of branchSummary.all) {
      if (
        branch === currentBranch ||
        PROTECTED_BRANCHES.includes(branch) ||
        branch.startsWith('remotes/')
      ) {
        continue;
      }

      const isMerged = mergedBranches.includes(branch);
      const mergedText = isMerged ? chalk.bgHex('#8957E5').white('Yes') : chalk.gray('No');
      const statusText = chalk.white('Local');

      table.push([branch, statusText, mergedText]);
      branchesToDelete.push(branch);
    }

    if (branchesToDelete.length === 0) {
      console.log(chalk.green(`\n${logSymbols.success} The are no obsolete branches to delete.\n`));
      return;
    }

    console.log(`\n${table.toString()}\n`);

    const choices = branchesToDelete.map((branch) => ({
      name: branch,
      value: branch,
    }));

    const selectedBranches = await checkbox({
      message: chalk.cyan('Choose branches to delete. Press SPACE to select:'),
      choices: choices,
    });

    if (selectedBranches.length === 0) {
      console.log(chalk.bgYellow.black(' CANCELED ') + chalk.yellow('Canceled.\n'));
      return;
    }

    const isConfirmed = await confirm({
      message:
        chalk.bgRed.white(' DANGER ') +
        chalk.red(
          `Are you sure you want to delete the following ${selectedBranches.length} branches?\n` +
            selectedBranches.map((b) => `  - ${b}`).join('\n') +
            '\n',
        ),
      default: false,
    });

    if (isConfirmed) {
      const deleteRemote = await confirm({
        message:
          chalk.bgMagenta.white(' CONFIRM ') +
          chalk.magenta('Do you also want to delete these branches from the remote (origin)?'),
        default: false,
      });

      let forceDeleteAllUnmerged = false;

      for (const branch of selectedBranches) {
        const isMerged = mergedBranches.includes(branch);

        if (!isMerged && !forceDeleteAllUnmerged) {
          const answer = await select({
            message:
              chalk.bgYellow.black(' WARNING ') +
              chalk.yellow(
                ` Branch '${branch}' is not merged. Are you sure you want to delete this branch?`,
              ),
            choices: [
              { name: chalk.red('Yes (Delete this branch)'), value: 'yes' },
              { name: chalk.green('No (Skip this branch)'), value: 'no' },
              {
                name: chalk.blue('All (Delete all unmerged branches without asking again)'),
                value: 'all',
              },
            ],
          });

          if (answer === 'no') {
            console.log(warn + chalk.yellow(` Skipped unmerged branch: ${branch}`));
            continue;
          } else if (answer === 'all') {
            forceDeleteAllUnmerged = true;
          }
        }

        const spinner = ora(
          chalk.bgYellow.black(' DELETING ') + chalk.yellow(`Deleting branch: ${branch}...`),
        ).start();
        try {
          await git.deleteLocalBranch(branch, true);
          spinner.succeed(chalk.green(` Deleted local branch: ${branch}`));

          if (deleteRemote) {
            const remoteSpinner = ora(
              chalk.bgYellow.black(' DELETING ') +
                chalk.yellow(` Deleting remote branch: origin/${branch}...`),
            ).start();
            try {
              await git.push(['origin', '--delete', branch]);
              remoteSpinner.succeed(chalk.green(` Deleted remote branch: origin/${branch}`));
            } catch (remoteErr) {
              remoteSpinner.fail(
                chalk.red(` Failed to delete remote branch ${branch}: ${remoteErr}`),
              );
            }
          }
        } catch (error) {
          spinner.fail(chalk.red(` Failed to delete ${branch}: ${error}`));
        }
      }
      console.log(success + chalk.cyan('\n🎉 Cleanup completed successfully!\n'));
    } else {
      console.log(warn + chalk.gray('Canceled.\n'));
    }
  } catch (error) {
    console.error(error + chalk.red('An error occurred:'), error);
  }
}
