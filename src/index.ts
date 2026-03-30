#!/usr/bin/env node
import { Command } from 'commander';
import { helloCommand } from './commands/hello.js';

const program = new Command();
program
  .name('git-buddy')
  .version('0.0.0')
  .description(
    'Interactive Git CLI toolkit: Branch Sweeper, GitHub Issue to Branch, and Safe Git Undo.',
  );
program.addCommand(helloCommand());
program.parse(process.argv);
