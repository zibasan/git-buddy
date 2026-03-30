#!/usr/bin/env node
import chalk from 'chalk';
import { mainMenu } from './features/main.js';

async function run() {
  try {
    await mainMenu();
  } catch (err) {
    // Ctrl+C などで強制終了された際のエラーハンドリング
    if (err instanceof Error && err.name === 'ExitPromptError') {
      console.log(chalk.bgYellow.black(' CANCELED ') + chalk.yellow('Exiting...'));
      process.exit(0);
    }
    console.error(chalk.red('An unexpected error has occurred:'), err);
    process.exit(1);
  }
}

run();
