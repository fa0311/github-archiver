# Commands

<!-- usage -->
```sh-session
$ npm install -g github-archiver
$ github-archiver COMMAND
running command...
$ github-archiver (--version)
github-archiver/0.0.0 linux-x64 node-v24.15.0
$ github-archiver --help [COMMAND]
USAGE
  $ github-archiver COMMAND
...
```
<!-- usagestop -->

<!-- commands -->
* [`github-archiver archive INPUT...`](#github-archiver-archive-input)
* [`github-archiver help [COMMAND]`](#github-archiver-help-command)
* [`github-archiver schedule [CONFIG]`](#github-archiver-schedule-config)

## `github-archiver archive INPUT...`

Archive GitHub repositories as local mirror clones

```
USAGE
  $ github-archiver archive INPUT... [-o <value>] [-q] [--help] [--version]

ARGUMENTS
  INPUT...  HTTPS GitHub repository URL to archive

FLAGS
  -o, --output=<value>  [default: archives/{owner}/{repo}] Output directory pattern
  -q, --quiet           Suppress progress output
      --help            Show CLI help.
      --version         Show CLI version.

DESCRIPTION
  Archive GitHub repositories as local mirror clones

EXAMPLES
  Archive a repository

    $ github-archiver archive https://github.com/octocat/Hello-World

  Archive multiple repositories

    $ github-archiver archive https://github.com/octocat/Hello-World https://github.com/github/docs

  Archive repositories returned by GitHub CLI

    $ github-archiver archive $(gh api --paginate '/user/repos?per_page=100' --jq '.[].clone_url')

  Archive with a custom output directory

    $ github-archiver archive https://github.com/octocat/Hello-World --output=backups/{owner}/{repo}.git
```

_See code: [src/commands/archive.ts](https://github.com/fa0311/github-archiver/blob/main/src/commands/archive.ts)_

## `github-archiver help [COMMAND]`

Display help for github-archiver.

```
USAGE
  $ github-archiver help [COMMAND...] [-n]

ARGUMENTS
  [COMMAND...]  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for github-archiver.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/6.2.45/src/commands/help.ts)_

## `github-archiver schedule [CONFIG]`

Run scheduled archiving based on configuration file

```
USAGE
  $ github-archiver schedule [CONFIG] [--runOnce] [--setup] [--help] [--version]

ARGUMENTS
  [CONFIG]  [default: schedule.json] Path to the schedule configuration file

FLAGS
  --help     Show CLI help.
  --runOnce
  --setup
  --version  Show CLI version.

DESCRIPTION
  Run scheduled archiving based on configuration file

EXAMPLES
  Run scheduled archiving with default config

    $ github-archiver schedule

  Run scheduled archiving with custom config

    $ github-archiver schedule schedule.json

  Run once without scheduling (useful for testing)

    $ github-archiver schedule --runOnce
```

_See code: [src/commands/schedule.ts](https://github.com/fa0311/github-archiver/blob/main/src/commands/schedule.ts)_
<!-- commandsstop -->
