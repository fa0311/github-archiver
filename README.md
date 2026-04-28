github-archiver
=================

A new CLI generated with oclif


[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/github-archiver.svg)](https://npmjs.org/package/github-archiver)
[![Downloads/week](https://img.shields.io/npm/dw/github-archiver.svg)](https://npmjs.org/package/github-archiver)


<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g github-archiver
$ github-archiver COMMAND
running command...
$ github-archiver (--version)
github-archiver/0.0.0 linux-x64 node-v22.22.2
$ github-archiver --help [COMMAND]
USAGE
  $ github-archiver COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`github-archiver hello PERSON`](#github-archiver-hello-person)
* [`github-archiver hello world`](#github-archiver-hello-world)
* [`github-archiver help [COMMAND]`](#github-archiver-help-command)
* [`github-archiver plugins`](#github-archiver-plugins)
* [`github-archiver plugins add PLUGIN`](#github-archiver-plugins-add-plugin)
* [`github-archiver plugins:inspect PLUGIN...`](#github-archiver-pluginsinspect-plugin)
* [`github-archiver plugins install PLUGIN`](#github-archiver-plugins-install-plugin)
* [`github-archiver plugins link PATH`](#github-archiver-plugins-link-path)
* [`github-archiver plugins remove [PLUGIN]`](#github-archiver-plugins-remove-plugin)
* [`github-archiver plugins reset`](#github-archiver-plugins-reset)
* [`github-archiver plugins uninstall [PLUGIN]`](#github-archiver-plugins-uninstall-plugin)
* [`github-archiver plugins unlink [PLUGIN]`](#github-archiver-plugins-unlink-plugin)
* [`github-archiver plugins update`](#github-archiver-plugins-update)

## `github-archiver hello PERSON`

Say hello

```
USAGE
  $ github-archiver hello PERSON -f <value>

ARGUMENTS
  PERSON  Person to say hello to

FLAGS
  -f, --from=<value>  (required) Who is saying hello

DESCRIPTION
  Say hello

EXAMPLES
  $ github-archiver hello friend --from oclif
  hello friend from oclif! (./src/commands/hello/index.ts)
```

_See code: [src/commands/hello/index.ts](https://github.com/app/github-archiver/blob/v0.0.0/src/commands/hello/index.ts)_

## `github-archiver hello world`

Say hello world

```
USAGE
  $ github-archiver hello world

DESCRIPTION
  Say hello world

EXAMPLES
  $ github-archiver hello world
  hello world! (./src/commands/hello/world.ts)
```

_See code: [src/commands/hello/world.ts](https://github.com/app/github-archiver/blob/v0.0.0/src/commands/hello/world.ts)_

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

## `github-archiver plugins`

List installed plugins.

```
USAGE
  $ github-archiver plugins [--json] [--core]

FLAGS
  --core  Show core plugins.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ github-archiver plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/5.4.62/src/commands/plugins/index.ts)_

## `github-archiver plugins add PLUGIN`

Installs a plugin into github-archiver.

```
USAGE
  $ github-archiver plugins add PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into github-archiver.

  Uses npm to install plugins.

  Installation of a user-installed plugin will override a core plugin.

  Use the GITHUB_ARCHIVER_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the GITHUB_ARCHIVER_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ github-archiver plugins add

EXAMPLES
  Install a plugin from npm registry.

    $ github-archiver plugins add myplugin

  Install a plugin from a github url.

    $ github-archiver plugins add https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ github-archiver plugins add someuser/someplugin
```

## `github-archiver plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ github-archiver plugins inspect PLUGIN...

ARGUMENTS
  PLUGIN...  [default: .] Plugin to inspect.

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Displays installation properties of a plugin.

EXAMPLES
  $ github-archiver plugins inspect myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/5.4.62/src/commands/plugins/inspect.ts)_

## `github-archiver plugins install PLUGIN`

Installs a plugin into github-archiver.

```
USAGE
  $ github-archiver plugins install PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into github-archiver.

  Uses npm to install plugins.

  Installation of a user-installed plugin will override a core plugin.

  Use the GITHUB_ARCHIVER_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the GITHUB_ARCHIVER_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ github-archiver plugins add

EXAMPLES
  Install a plugin from npm registry.

    $ github-archiver plugins install myplugin

  Install a plugin from a github url.

    $ github-archiver plugins install https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ github-archiver plugins install someuser/someplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/5.4.62/src/commands/plugins/install.ts)_

## `github-archiver plugins link PATH`

Links a plugin into the CLI for development.

```
USAGE
  $ github-archiver plugins link PATH [-h] [--install] [-v]

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help          Show CLI help.
  -v, --verbose
      --[no-]install  Install dependencies after linking the plugin.

DESCRIPTION
  Links a plugin into the CLI for development.

  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.


EXAMPLES
  $ github-archiver plugins link myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/5.4.62/src/commands/plugins/link.ts)_

## `github-archiver plugins remove [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ github-archiver plugins remove [PLUGIN...] [-h] [-v]

ARGUMENTS
  [PLUGIN...]  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ github-archiver plugins unlink
  $ github-archiver plugins remove

EXAMPLES
  $ github-archiver plugins remove myplugin
```

## `github-archiver plugins reset`

Remove all user-installed and linked plugins.

```
USAGE
  $ github-archiver plugins reset [--hard] [--reinstall]

FLAGS
  --hard       Delete node_modules and package manager related files in addition to uninstalling plugins.
  --reinstall  Reinstall all plugins after uninstalling.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/5.4.62/src/commands/plugins/reset.ts)_

## `github-archiver plugins uninstall [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ github-archiver plugins uninstall [PLUGIN...] [-h] [-v]

ARGUMENTS
  [PLUGIN...]  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ github-archiver plugins unlink
  $ github-archiver plugins remove

EXAMPLES
  $ github-archiver plugins uninstall myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/5.4.62/src/commands/plugins/uninstall.ts)_

## `github-archiver plugins unlink [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ github-archiver plugins unlink [PLUGIN...] [-h] [-v]

ARGUMENTS
  [PLUGIN...]  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ github-archiver plugins unlink
  $ github-archiver plugins remove

EXAMPLES
  $ github-archiver plugins unlink myplugin
```

## `github-archiver plugins update`

Update installed plugins.

```
USAGE
  $ github-archiver plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/5.4.62/src/commands/plugins/update.ts)_
<!-- commandsstop -->
