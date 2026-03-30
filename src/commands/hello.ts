import chalk from 'chalk';
import { Command } from 'commander';

export function helloCommand(): Command {
  const cmd = new Command('hello');
  cmd.description('Say hello and demonstrate separated command files');
  cmd.action(() => {
    console.log(chalk.green('Hello from your scaffolded CLI!'));
  });
  return cmd;
}
