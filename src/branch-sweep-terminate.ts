#!/usr/bin/env node
import chalk from 'chalk';
import { runBranchSweeper } from './features/branch-sweeper.js';

async function run() {
  try {
    await runBranchSweeper();
  } catch (err) {
    if (err instanceof Error && err.name === 'ExitPromptError') {
      console.log(chalk.gray('\n操作がキャンセルされました。'));
      process.exit(0);
    }
    console.error(chalk.red('\n予期せぬエラーが発生しました:'), err);
    process.exit(1);
  }
}

run();
