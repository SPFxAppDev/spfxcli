# @spfxappdev/cli

[![npm version](https://badge.fury.io/js/@spfxappdev%2Fcli.svg)](https://badge.fury.io/js/@spfxappdev%2Fcli.svg)

The **@spfxappdev/cli** is a command-line interface (CLI) tool that helps you to initialize and develop your SPFx (SharePoint Framework) applications. 

It assists in multiple ways, including creating a new project with your preferred package manager (defined globally), initializing your preferred settings after creating the project and scaffolding services or models. 

For example, if you run the `spfxappdev new` command, the `yo @microsoft/sharepoint` command is automatically invoked and your configured package manager is passed as option.
If the project is already created, you can run the `spfxappdev init` command. This command will register some `gulp` tasks or modify your SharePoint Framework solution to use `alias` paths instead of relative paths. 


You [can configure the CLI the way you need it](#spfxappdev-config). A kind of "my own SPFx generator for each project". Not everything is configurable yet, but the CLi will be further developed. 
And yes, I have to admit the rules and settings match my typical settings and configurations. But since I didn't want to keep doing the same steps for every project, I decided to develop this CLI to make my life easier. Maybe you like my CLI too. I am also open for improvement suggestions. [Read more about my tips on how to configure an SPFx project after it is created. This CLI is based on or modifies the project as described here](https://spfx-app.dev/my-personal-tips-how-to-configure-a-spfx-project-after-creation)

## Content:

- [Installation](#installation)
- [Basics](#basics)
- [CLI command reference](#cli-command-reference)
  * [spfxappdev new](#spfxappdev-new)
    + [Examples](#examples)
  * [spfxappdev generate](#spfxappdev-generate)
    + [Description](#description)
    + [Examples](#examples-1)
    + [Arguments](#arguments)
    + [Available (component) types](#available-component-types)
  * [spfxappdev init](#spfxappdev-init)
  * [Options](#options)
  * [Description](#description-1)
  * [spfxappdev custom-rules](#spfxappdev-custom-rules)
    + [Description](#description-2)
  * [spfxappdev config](#spfxappdev-config)
  * [Available settings](#available-settings)
  * [spfxappdev config all](#spfxappdev-config-all)
  * [spfxappdev config get](#spfxappdev-config-get)
  * [spfxappdev config set](#spfxappdev-config-set)
    + [Example](#example)
  * [spfxappdev config add](#spfxappdev-config-add)
    + [Example](#example-1)
  * [spfxappdev config remove](#spfxappdev-config-remove)
    + [Example](#example-2)
  * [spfxappdev config remove-all](#spfxappdev-config-remove-all)
    + [Example](#example-3)
- [How to use custom templates](#how-to-use-custom-templates)
- [How to use the alias paths](#how-to-use-the-alias-paths)
- [How to register more aliases](#how-to-register-more-aliases)
  * [@spfxappdev/customAlias.js](#spfxappdevcustomaliasjs)
    + [Example](#example-4)
    + [Full example](#full-example)
  * [tsconfig.json](#tsconfigjson)
    + [Example](#example-5)
    + [Full example](#full-example-1)
  * [fast-serve/webpack.extend.js](#fast-servewebpackextendjs)
    + [Example](#example-6)
    + [Full example](#full-example-2)
- [Further links](#further-links)

## Installation

> With `npm`, you have several options to control how your operating system's command line resolves the location of the `spfxappdev` CLI binary. Here I describe the global installation of the `spfxappdev` binary using the `-g` option. This option provides some level of convenience and is the approach I use throughout the documentation. Note that when installing any npm package globally, it is the user's responsibility to ensure that the correct version is installed. This also means that if you have different projects, each will run the same version of the CLI.

Install the CLI globally using the npm install -g command (see the Note above for details about global installs).

```bash
npm i @spfxappdev/cli -g
```

## Basics

Once installed, you can invoke CLI commands directly from your OS command line through the `spfxappdev` executable. See the available CLI commands by entering the following:

```bash
spfxappdev --help
```

> Note: You can also use the alias `spfx` instead of `spfxappdev`.

You can get help on a single command by using the following construct. Substitute any command, such as `new`, `init`, etc., where `init` appears in the example below to get detailed help on that command:

```bash
spfxappdev init --help
```

## CLI command reference

### spfxappdev new

Creates a new spfx project by running the `yo @microsoft/sharepoint` command. You can pass all options that `yo @microsoft/sharepoint` supports (you can get all available options by running `yo @microsoft/sharepoint --help`).


```bash
spfxappdev new [options]
spfx n [options]  
```

If no package manager is specified (via the `--package-manager` option), the package manager from your configuration is passed to the `new` command. ([See config command for more details](#spfxappdev-config))

> NOTE: When `pnpm` is used as package manager, the commands `pnpm config set auto-install-peers true --location project` and `pnpm config set shamefully-hoist true --location project` are executed. For more information, [read this post](https://spfx-app.dev/using-pnpm-in-spfx-projects)

#### Examples

```bash
spfxappdev new
spfx n --framework react --skip-install --component-type "webpart" --component-name hello-spfx-cli  
```


---

### spfxappdev generate

Generates and/or modifies files based on the specified type.

```bash
spfxappdev generate <type> <name>
spfx g <type> <name>
```

#### Description

Creates a new component with the specified `<name>` to the current project.

- Creates a folder for the specified `<type>`. For example `services` or `models`
- Creates the specified `<type>` with the specified `<name>`. For example, the `Service` with the name `News` becomes `NewsService`.
- Creates an `index.ts` in the `<type>` specific folder and exports the newly created class(es)


#### Examples

```bash
spfxappdev generate service News
spfx g s News  
```

#### Arguments

| Argument | Description |
|----------|-------------|
| `<type>` |    The (component) type to generate. See the table below for the available types.     |
| `<name>` |    The name of the generated component.     |

#### Available (component) types

| Name       | Alias       | Description |
|------------|-------------|-------------|
| `service`  | `s`         | Create a new service that can be consumed with the `serviceScope`. |
| `model`    | `m`         | Create a new and empty model interface and class. |


---

### spfxappdev init

Initializes/configures the project.

After you run the command, the following steps are taken:

1. A new folder `@spfxappdev` is created in the root directory of the project
2. The `gulpfile.js` file is modified: Aliases are registered, the `bump-version` task is defined and the possibility to build your solution in such a way that a warning will not cause the build process to fail.
3. `tsconfig.json` is changed: Path` aliases and `BaseDir` are set.
4. `fast-serve/webpack.extend.js` is changed (if available): Aliases are registered
5. The `package.json` file is modified: The `publish` and `publish:nowarn` commands are defined
6. If you have defined additional `npm` packages and the `--no-install` option is not passed, then all defined packages will be installed ([See configuration section](#spfxappdev-config))

```bash
spfxappdev init [options]
spfx init [options]
```

### Options

| Option                        | Alias | Description |
|---------------------          |-------|-------------|
| `--package-manager`           | `--pm`| If additional packages are to be installed ([specified in config](#spfxappdev-config)), the package manager can be specified here (`npm`, `pnpm` or `yarn`). Otherwise the package manager from the config (default `npm`) is used |
| `--install` or `--no-install` | -     |  The specified `npmPackages` from the [configuration file](#spfxappdev-config) should (not) be installed (default: `true`)           |


### Description

After running the `spfxappdev init` command, you can use the "aliases" instead of relative paths ([see "How to use the alias paths" section](#how-to-use-the-alias-paths)).
Also, you can run the `npm run publish` command. This command runs `gulp clean`, `gulp build`, `gulp bundle --ship` and `gulp package-solution --ship`. The newly registered gulp task `bump-version` is also executed and increases automatically the version of the solution.

> Normally, a warning in the terminal causes the build to fail. If you want to suppress the warnings for the build, you can run the `npm run publish:nowarn` command.

If you want to increase the version without creating or bundling the solution, you can use this command:

```bash
gulp bump-version
```

> More information about the `publish` and `bump-version` command can be found in [my blog post](https://spfx-app.dev/package-spfx-solution-with-one-command-and-automatically-increase-the-version)

---

### spfxappdev custom-rules

Renames the default `.eslintrc.js` and `tsconfig.json` files and creates new files that inherit from the original files. This allows you to define your own ESLint rules. By default, the command defines custom rules that come with the CLI. But you can override the templates with the `config` command ([See section "How to use custom templates"](#how-to-use-custom-templates))

```bash
spfxappdev custom-rules
spfx rules
```

#### Description

The original `.eslintrc.js` and `tsconfig.json` are renamed to `ms-eslint.js` and `ms-tsconfig.json`. The new rules extend the original rules, but now you can overwrite the rules or define new ones. The files become smaller and the original files stay  untouched.

---

### spfxappdev config

Gets or sets your personal settings (configurations).

You can configure the CLI according to your personal preferences using its settings. The settings are stored on the disk in the current user's folder: `C:\Users/{user}\.config\configstore\@spfxappdev\cli.json` on Windows and `/Users/{user}/.config/configstore/@spfxappdev\cli.json` on macOS. The configuration file is created when you use the cli for the first time.

To reset settings to their default values, remove them from the configuration file or remove the whole configuration file.

```bash
spfxappdev config 
spfx c
```

### Available settings

| Key                 | Default value | Description |
|---------------------|---------------|---------------|
| `packageManager`    | `npm`         | For example, if the `init` or the `new` commands are executed and no explicit package manager is specified via the option `--package-manager`, the package manager defined here will be used (e.g. to install custom packages) |
| `npmPackages`       | `[]`          | A list of npm packages to be installed when the `spfxappdev init` command is run |
| `templatesPath`     | `{pathToYourGlobalNPMFolder}\@spfxappdev\cli\lib\templates\create`            | The location for the templates `.eslintrc.js` and `tsconfig.json` |

---
### spfxappdev config all

Displays all settings

```bash
spfxappdev config all
spfx c all
```

---
### spfxappdev config get

Shows the value of the specified `<key>`

```bash
spfxappdev config get <key>
spfx c get <key>
```


---
### spfxappdev config set

Sets the specified `<value>` for the specified `<key>`

```bash
spfxappdev config set <key> <value>
spfx c set <key> <value>
```

Only `templatesPath` and `packageManager` properties can be set via `spfxappdev config set` command. For the settings key `packageManager` you should use the command `spfxappdev config add <key> <values...>`.

#### Example

```bash
spfxappdev config set templatesPath "D:\mySPFxCLITemplates"
```

Now you can use your own templates for `.eslintrc.js` and `tsconfig.json`. Just create the files `eslint.js.txt` and `tsconfig.txt`. Open the files and paste the contents of [here](/src/templates/create/eslint.js.txt) and [here](/src/templates/create/tsconfig.txt) and set your own rules.

---
### spfxappdev config add

Adds the specified value(s) for the specified `<key>`. This command is available only for `<key>` which stores a "list" of values. The existing values are not removed. The new values will be added to the list (at the end).

```bash
spfxappdev config add <key> <values...>
spfx c add <key> <values...>
```

> Note: Currently only the `<key>` "`packageManager`" is supported

#### Example

```bash
#Adding multiple values at the same time
spfxappdev config add packageManager @spfxappdev/utility @pnp/sp
#Adding multiple values at the same time
spfxappdev config add packageManager @spfxappdev/mapper
```
---
### spfxappdev config remove

Removes the specified value(s) for the specified `<key>`. This command is available only for `<key>` which stores a "list" of values.

```bash
spfxappdev config remove <key> <values...>
spfx c remove <key> <values...>
```

> Note: Currently only the `<key>` "`packageManager`" is supported

#### Example

```bash
#Removing multiple values at the same time
spfxappdev config remove packageManager @spfxappdev/utility @pnp/sp
#Removing multiple values at the same time
spfxappdev config remove packageManager @spfxappdev/mapper
```

---
### spfxappdev config remove-all

Removes all values for the specified `<key>`. This command is available only for `<key>` which stores a "list" of values.

```bash
spfxappdev config remove-all <key>
spfx c ra <key>
```

> Note: Currently only the `<key>` "`packageManager`" is supported

#### Example

```bash
spfxappdev config remove-all packageManager
```

> This command clears the list and creates an empty array `[]`.

## How to use custom templates
Currently, the CLI only supports custom templates for the `.eslintrc.js` and `tsconfig.json` files. If you want to override the CLI default templates, you can set your own `templatesPath` value using the command:

```bash
spfxappdev config set templatesPath "{YourTemplatesFolderPath}"
``` 
Make sure that you have created the files named `eslint.js.txt` and `tsconfig.txt` in the folder. If one of these files does not exist, the default CLI templates will be used (only for the non-existing file). You can copy the original files from the `@spfxappdev/cli` npm package (`{pathtoyourglobalNPMFolder}\@spfxappdev\cli\lib\templates\create`). Or you can paste the contents of [here](/src/templates/create/eslint.js.txt) and [here](/src/templates/create/tsconfig.txt). Then you can change the templates as you like.

## How to use the alias paths

Most use relative paths to refer to files from the solution. Here are a few examples

```typescript
import HelloWorldWebPartComponent from './components/HelloWorldWebPartComponent';
import { MyComponent } from '../../components/MyComponent';
```

But this is not so nice and if you want to change the structure or reuse the code, you need to update these paths. 
For this reason you can use `alias` instead. 

Same example as above, but with alias

```typescript
import HelloWorldWebPartComponent from ' @webparts/helloworld/components/HelloWorldWebPartComponent';
import { MyComponent } from '@components/MyComponent';
```

If you run `spfxappdev init` the following aliases are registered:

```typescript
"@webparts": "src/webparts",
"@components": "src/components",
"@src": "src",
```

## How to register more aliases

If you want to register more aliases, you need to change some files (all of the following mentioned)

### @spfxappdev/customAlias.js

Open the newly created `@spfxappdev/customAlias.js` file and register additional aliases (starting from line 11)

#### Example

```typescript
generatedConfiguration.resolve.alias['@apps'] = path.resolve(__dirname, '..', 'lib/extensions');
```

> NOTE: In this file, you should use the `lib` folder instead of `src`.


#### Full example

```typescript
function resolveCustomAlias(build) {
    build.configureWebpack.mergeConfig({
        additionalConfiguration: (generatedConfiguration) => {
            if (!generatedConfiguration.resolve.alias) {
                generatedConfiguration.resolve.alias = {};
            }
            generatedConfiguration.resolve.alias['@webparts'] = path.resolve(__dirname, '..', 'lib/webparts');
            generatedConfiguration.resolve.alias['@components'] = path.resolve(__dirname, '..', 'lib/components');
            generatedConfiguration.resolve.alias['@src'] = path.resolve(__dirname, '..', 'lib');
            generatedConfiguration.resolve.alias['@apps'] = path.resolve(__dirname, '..', 'lib/extensions');
            return generatedConfiguration;
        }
    });
}
```


### tsconfig.json

Open `tsconfig.json` file in your root directory and register additional entries by extending the `paths` property

#### Example

```json
"@apps/*": [
      "src/extensions/*"
    ]
```

#### Full example

```json
"paths": {
    "@src/*": [
      "src/*"
    ],
    "@components/*": [
      "src/components/*"
    ],
    "@webparts/*": [
      "src/webparts/*"
    ],
    "@apps/*": [
      "src/extensions/*"
    ]
  },
```

> NOTE: In this file, you should use the `src` folder!

### fast-serve/webpack.extend.js

If you use `spfx-fast-serve`, webpack must also be extended or the `fast-serve/webpack.extend.js` file and the property `webpackConfig.resolve.alias`. 

#### Example

```javascript
"@apps": path.resolve(__dirname, "..", "src/extensions")
```

> NOTE: In this file, you should use the `src` folder!

#### Full example

```javascript
const webpackConfig = {
/* CUSTOM ALIAS START */
resolve: {
    alias: {
      "@webparts": path.resolve(__dirname, "..", "src/webparts"),
      "@components": path.resolve(__dirname, "..", "src/components"),
      "@src": path.resolve(__dirname, "..", "src"),
      "@apps": path.resolve(__dirname, "..", "src/extensions")
    }
},
/* CUSTOM ALIAS END */
}
```

## Further links

As mentioned above, the CLI is based on my personal tips and experiences. Many of the commands or what they do are explained individually in the following articles:

- [My personal tips how to configure a SPFx project after creation](https://spfx-app.dev/my-personal-tips-how-to-configure-a-spfx-project-after-creation)
- [Using pnpm in SPFx projects](https://spfx-app.dev/using-pnpm-in-spfx-projects)
- [Package SPFx solution with one command and automatically increase the version](https://spfx-app.dev/package-spfx-solution-with-one-command-and-automatically-increase-the-version)
- [SPFx Azure DevOps Pipeline: Increment version, push to repository and publish package](https://spfx-app.dev/spfx-azure-devops-pipeline-increment-version-push-to-repository-and-publish-package)