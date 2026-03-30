import { select } from '@inquirer/prompts';
import chalk from 'chalk';
import { runBranchSweeper } from './branch-sweeper.js';
// import { gitUndo } from './git-undo.js';
// import { issueToBranch } from './issue-to-branch.js';

export async function mainMenu() {
  console.log(chalk.bold.magenta('\n🚀 Welcome to Git-Buddy!\n'));

  const answer = await select({
    message: 'Choose an option:',
    choices: [
      {
        name: '🧹 Branch Sweeper (Bulk deletion of merged branches)',
        value: 'sweeper',
      },
      {
        name: '🎫 Issue to Branch (Create branch from issue)',
        value: 'issue',
      },
      {
        name: '⏪ Git Undo (Undo previous commit)',
        value: 'undo',
      },
      {
        name: '🚪 Exit',
        value: 'exit',
      },
    ],
  });

  switch (answer) {
    case 'sweeper':
      await runBranchSweeper();
      break;
    /* case 'issue':
      await issueToBranch();
      break;

    case 'undo':
      await gitUndo();
      break;
    */
    case 'exit':
      console.log(chalk.gray('Exiting...'));
      process.exit(0);
  }

  // 処理が終わったら再度メインメニューに戻る
  await mainMenu();
}
