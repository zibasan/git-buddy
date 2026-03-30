import { Octokit } from '@octokit/rest';
import 'dotenv/config';

export const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
