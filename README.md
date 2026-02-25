# @spfxappdev/cli

[![npm version](https://badge.fury.io/js/@spfxappdev%2Fcli.svg)](https://badge.fury.io/js/@spfxappdev%2Fcli.svg)

The **@spfxappdev/cli** is a command-line interface (CLI) tool that helps you initialize and develop your SPFx (SharePoint Framework) applications. 

It assists you in multiple ways, including creating a new project with your preferred package manager, initializing your preferred settings after creating the project, and scaffolding services or models. 

For example, if you run the `spfxappdev new` command, the `yo @microsoft/sharepoint` command is automatically invoked, and your configured package manager is passed as an option.
If the project has already been created, you can run the `spfxappdev init` command. This command will register some `gulp` tasks or modify your SharePoint Framework solution to use `alias` paths instead of relative paths. 

You [can configure the CLI the way you need it](#spfxappdev-config) — think of it as "my own SPFx generator for each project." Not everything is configurable yet, but the CLI is continuously being developed. I admit that the default rules and settings match my personal preferences, but since I wanted to avoid repeating the same setup steps for every project, I created this CLI to make my life easier. I hope you find it useful too! I am always open to suggestions for improvement. [Read more about my tips on how to configure an SPFx project after it is created. This CLI is based on or modifies the project as described here](https://spfx-app.dev/my-personal-tips-how-to-configure-a-spfx-project-after-creation)

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
    + [Model Options](#model-options)
  * [spfxappdev init](#spfxappdev-init)
    + [Options](#options)
    + [Description](#description-1)
  * [spfxappdev custom-rules](#spfxappdev-custom-rules)
    + [Description](#description-2)
  * [spfxappdev config](#spfxappdev-config)
  * [Available settings](#available-settings)
  * [spfxappdev config all](#spfxappdev-config-all)
    + [Options](#options-1)
  * [spfxappdev config get](#spfxappdev-config-get)
    + [Options](#options-2)
  * [spfxappdev config set](#spfxappdev-config-set)
    + [Options](#options-3)
    + [Example](#example)
  * [spfxappdev config add](#spfxappdev-config-add)
    + [Options](#options-4)
    + [Example](#example-1)
  * [spfxappdev config remove](#spfxappdev-config-remove)
    + [Options](#options-5)
    + [Example](#example-2)
  * [spfxappdev config remove-all](#spfxappdev-config-remove-all)
    + [Options](#options-6)
    + [Example](#example-3)
  * [spfxappdev config create](#spfxappdev-config-create)
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
- [Authentication with SharePoint/Graph](#authentication-with-sharepointgraph)
- [Further links](#further-links)

## Installation

> With `npm`, you have several options to control how your operating system's command line resolves the location of the `spfxappdev` CLI binary. Here, I describe the global installation of the `spfxappdev` binary using the `-g` option. This option provides a good level of convenience and is the approach used throughout this documentation. Note that when installing any npm package globally, it is the user's responsibility to ensure that the correct version is installed. This also means that if you have multiple projects, they will all run the same version of the CLI.

Install the CLI globally using the npm install command (see the Note above for details about global installs).

```bash
npm i @spfxappdev/cli -g
```

## Basics

Once installed, you can invoke CLI commands directly from your OS command line through the `spfxappdev` executable. See the available CLI commands by running the following:

```bash
spfxappdev --help
```

> Note: You can also use the alias `spfx` instead of `spfxappdev`.

You can get help for a single command by using the following construct. Substitute any command, such as `new`, `init`, etc., where `init` appears in the example below to get detailed help for that specific command:

```bash
spfxappdev init --help
```

## CLI command reference

### spfxappdev new
![since @spfxappdev/cli@1.0.0](https://img.shields.io/badge/since-v1.0.0-orange)

Creates a new SPFx project by running the `yo @microsoft/sharepoint` command. You can pass all options that `yo @microsoft/sharepoint` supports (you can list all available options by running `yo @microsoft/sharepoint --help`).


```bash
spfxappdev new [options]
spfx n [options]  
```

If no package manager is specified (via the `--package-manager` option), the package manager from your configuration is passed to the `new` command. ([See config command for more details](#spfxappdev-config))

> NOTE: When `pnpm` is used as the package manager, the commands `pnpm config set auto-install-peers true --location project` and `pnpm config set shamefully-hoist true --location project` are executed automatically. For more information, [read this post](https://spfx-app.dev/using-pnpm-in-spfx-projects).

#### Examples

```bash
spfxappdev new
spfx n --framework react --skip-install --component-type "webpart" --component-name hello-spfx-cli  
```


---

### spfxappdev generate
![since @spfxappdev/cli@1.0.0](https://img.shields.io/badge/since-v1.0.0-orange)

Generates and/or modifies files based on the specified type.

```bash
spfxappdev generate <type> <name>
spfx g <type> <name>
```

#### Description

Creates a new component with the specified `<name>` in the current project.

- Creates a folder for the specified `<type>`. For example, `services` or `models`.
- Creates the specified `<type>` with the specified `<name>`. For example, a `Service` with the name `News` becomes `NewsService`.
- Creates an `index.ts` in the `<type>` specific folder and exports the newly created class(es).


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

#### Model Options
![since @spfxappdev/cli@1.1.0](https://img.shields.io/badge/since-v1.1.0-green) 

You can create a model based on a SharePoint list (fields). The only required options are `--list` OR `--listName` to tell the CLI that you want a model based on that specific list.

><br/>ℹ️ **Note:** As of version 2.0.0, the authentication model has changed. Logging in with a username and password is no longer supported; you must now provide at least a `Client ID`. 
> - If only a `Client ID` is provided, the tool uses the **Device Code Flow** (user authentication with Delegated Permissions via SharePoint REST API). 
> - If a `Client Secret` is also provided, it automatically switches to the **Client Credentials Flow** (App Permissions via Microsoft Graph API).
> <br/><br/>For more details, see [Authentication with SharePoint/Graph](#authentication-with-sharepointgraph).<br/><br/>


| Option       | Alias       | Description |
|------------|-------------|-------------|
| `--list` | `-l` |   SharePoint web relative list URL e.g. `Lists/MyList` or `SitePages`.     |
| `--listName` | `--ln` |   The Name/Title of the List.     |
| `--weburl` | `-u` |   `OPTIONAL:` You can specify an absolute web URL where the list is located. If this option is not set, the local or global settings will be used (property: `siteurl`). If the `siteurl` value from the configuration file is empty, the CLI will automatically ask for the web URL.     |
| `--clientId` | `--client` |   `OPTIONAL:` You can specify a clientId to authenticate to SharePoint. If this option is not set, the local or global settings are used (property: `clientId`). If the `clientId` value from the configuration file is empty, the CLI will automatically prompt for the clientId.     |
| `--clientSecret` | `--secret` |   `OPTIONAL:` You can specify a clientSecret to authenticate to SharePoint (via Microsoft Graph API). If this option is not set, the local or global settings are used (property: `clientSecret`). If the `clientSecret` value from the configuration file is empty, the CLI will automatically prompt for the clientSecret. (Leave the field blank to use only the client ID and log in via **Device Code Flow** (Browser).)     |
| `--hidden` or `--no-hidden` |  |   Normally, the model is created with fields that are not "hidden". However, you can specify whether you want to include hidden fields as well. (Hidden fields can only be accessed via SharePoint REST API (**Device Code Flow** Authentication)).      |

> <br/>ℹ️ **Note**: The SharePoint list-based model generator requires the npm package `@spfxappdev/mapper` to map the internal field names to the (friendly) model properties. <br/><br/>

##### SharePoint REST-API vs. Microsoft Graph API Models

Depending on how you authenticate, either the SharePoint REST API or the Microsoft Graph API is used. The reason for this is that when using a `Client ID` and `Client Secret` (**Client Credentials Flow**), the CLI authenticates against the Microsoft Graph API. The SharePoint REST API does not natively support app-only authentication in the same seamless way without complex workarounds. 

While authentication via the **Client Credentials Flow** is more convenient (as it runs in the background without user interaction), it comes with a few trade-offs when generating models. Although the Graph API documentation states that taxonomy and URL fields are supported, the API response often omits this detailed metadata. Furthermore, it is NOT possible to read hidden list fields via the Graph API, even if the `hidden` property is requested. If strict type safety for these specific field types is not crucial for your generated models, or if you do not need hidden fields, the **Client Credentials Flow** is the faster and easier authentication method. 

Here is an example comparing a model created using the SharePoint REST API and one using the Graph API:

**SharePoint REST-API**

```typescript 
export class ListModel implements IListModel {
  @mapper({ nameOrPath: 'urlField', type: UrlFieldValue,  })
	public urlField: UrlFieldValue;  //Type is UrlFieldValue

	@mapper({ nameOrPath: 'ImageField', type: UrlFieldValue,  })
	public imageField: UrlFieldValue; //Type is UrlFieldValue

	@mapper({ nameOrPath: 'Task',  })
	public task: string;  //Type is string

	@mapper({ nameOrPath: 'taxonomyField', type: TaxonomyFieldValue,  })
	public taxonomyField: TaxonomyFieldValue; //Type is TaxonomyFieldValue

	@mapper({ nameOrPath: 'MultiTaxField', type: TaxonomyFieldValue,  })
	public multiTaxField: TaxonomyFieldValue[]; //Type is TaxonomyFieldValue-Array
} 
```

**Graph API**
```typescript 
export class ListModel implements IListModel {
  @mapper({ nameOrPath: 'urlField'  })
	public urlField: any;  //Type is any

	@mapper({ nameOrPath: 'ImageField'  })
	public imageField: any; //Type is any

	@mapper({ nameOrPath: 'Task',  })
	public task: any;  //Type is any

	@mapper({ nameOrPath: 'taxonomyField'  })
	public taxonomyField: any; //Type is any

	@mapper({ nameOrPath: 'MultiTaxField'  })
	public multiTaxField: any[]; //Type is any
} 
```


---

### spfxappdev init
![since @spfxappdev/cli@1.0.0](https://img.shields.io/badge/since-v1.0.0-orange)

Initializes and configures the project.

After you run the command, the following steps are executed:

1. A new folder `@spfxappdev` is created in the root directory of the project.
2. The `gulpfile.js` file is modified: Aliases are registered, the `bump-version` task is defined, and a rule is added to prevent warnings from failing the build process.
3. `tsconfig.json` is modified: Path `aliases` and `baseUrl` are set.
4. `fast-serve/webpack.extend.js` is modified (if available): Aliases are registered.
5. The `package.json` file is modified: The `publish` and `publish:nowarn` scripts are defined.
6. If a `siteurl` is set in the config file, the `config/serve.json` is updated and the `{tenantDomain}` placeholder is replaced with the value from the config (![since @spfxappdev/cli@1.1.0](https://img.shields.io/badge/since-v1.1.0-green)).
7. If you have defined additional `npm` packages and the `--no-install` option is not passed, all defined packages will be installed ([See configuration section](#spfxappdev-config)).

```bash
spfxappdev init [options]
spfx init [options]
```

#### Options

| Option                        | Alias | Description |
|---------------------          |-------|-------------|
| `--package-manager`           | `--pm`| If additional packages are to be installed ([specified in config](#spfxappdev-config)), the package manager can be specified here (`npm`, `pnpm`, or `yarn`). Otherwise, the package manager from the config (default: `npm`) is used. |
| `--install` or `--no-install` | -     |  Determines whether the specified `npmPackages` from the [configuration file](#spfxappdev-config) should be installed (default: `true`).           |


#### Description

After running the `spfxappdev init` command, you can use "aliases" instead of relative paths ([see the "How to use the alias paths" section](#how-to-use-the-alias-paths)).
Additionally, you can run the `npm run publish` command. This command executes `gulp clean`, `gulp build`, `gulp bundle --ship`, and `gulp package-solution --ship`. The newly registered gulp task `bump-version` is also executed, which automatically increments the version of the solution.

> Normally, a warning in the terminal causes the build to fail. If you want to suppress warnings during the build, you can run the `npm run publish:nowarn` command instead.

If you want to increment the version without building or bundling the solution, you can use this standalone command:

```bash
gulp bump-version
```

> More information about the `publish` and `bump-version` commands can be found in [my blog post](https://spfx-app.dev/package-spfx-solution-with-one-command-and-automatically-increase-the-version).

---

### spfxappdev custom-rules
![since @spfxappdev/cli@1.0.0](https://img.shields.io/badge/since-v1.0.0-orange)

Renames the default `.eslintrc.js` and `tsconfig.json` files and creates new files that inherit from the original ones. This allows you to define your own ESLint rules cleanly. By default, the command sets up custom rules that come bundled with the CLI. However, you can override these templates using the `config` command ([See section "How to use custom templates"](#how-to-use-custom-templates)).

```bash
spfxappdev custom-rules
spfx rules
```

#### Description

The original `.eslintrc.js` and `tsconfig.json` are renamed to `ms-eslint.js` and `ms-tsconfig.json`. The new rule files extend the original ones, allowing you to overwrite rules or define new ones without cluttering the files. This keeps your configuration small and leaves the original Microsoft files untouched.

---

### spfxappdev config

Gets or sets your personal settings (configurations).

You can configure the CLI according to your personal preferences. The settings are stored locally on your machine in the current user's folder: `C:\Users\{user}\.config\configstore\@spfxappdev\cli.json` on Windows and `/Users/{user}/.config/configstore/@spfxappdev\cli.json` on macOS. This configuration file is created automatically the first time you use the CLI.

To reset settings to their default values, simply remove them from the configuration file or delete the file entirely.

```bash
spfxappdev config 
spfx c
```

> As of version `1.1.0`, there is an option to create a "local" configuration file per project. If a local file exists, its settings will take precedence. If specific properties are missing in the local file, the CLI will fall back to the values from the global configuration file.

### Available settings

| Key                 | Default value | Description |
|---------------------|---------------|---------------|
| `packageManager`    | `npm`         | If the `init` or `new` commands are executed and no explicit package manager is specified via the `--package-manager` option, the package manager defined here will be used (e.g., to install custom packages). |
| `npmPackages`       | `[]`          | A list of npm packages to be installed automatically when the `spfxappdev init` command is executed. |
| `templatesPath`     | `{pathToYourGlobalNPMFolder}\@spfxappdev\cli\lib\templates\create`            | The custom directory path for your `.eslintrc.js` and `tsconfig.json` templates. |
| `clientId`       | `''`          |  The Client ID used to authenticate against SharePoint/Graph (e.g., for model generation). ![since @spfxappdev/cli@2.0.0](https://img.shields.io/badge/since-v2.0.0-blue) |
| `clientSecret`       | `''`          |  The Client Secret used to authenticate against SharePoint/Graph (e.g., for model generation). ![since @spfxappdev/cli@2.0.0](https://img.shields.io/badge/since-v2.0.0-blue) |
| `siteurl`       | `''`          |  The (absolute) website URL to be used in SharePoint API requests (e.g., for model generation or updating the `initialPage` property in `config/serve.json`). ![since @spfxappdev/cli@1.1.0](https://img.shields.io/badge/since-v1.1.0-green)  |

---
### spfxappdev config all
![since @spfxappdev/cli@1.0.0](https://img.shields.io/badge/since-v1.0.0-orange)

Displays all current settings.

```bash
spfxappdev config all
spfx c all
```

#### Options
![since @spfxappdev/cli@1.1.0](https://img.shields.io/badge/since-v1.1.0-green) 

| Option       | Alias       | Description |
|------------|-------------|-------------|
| `--local` | `-l` |   If specified, the local configuration file is read instead of the global one.     |
   

---
### spfxappdev config get
![since @spfxappdev/cli@1.0.0](https://img.shields.io/badge/since-v1.0.0-orange)

Shows the value of the specified `<key>`.

```bash
spfxappdev config get <key>
spfx c get <key>
```

#### Options
![since @spfxappdev/cli@1.1.0](https://img.shields.io/badge/since-v1.1.0-green) 

| Option       | Alias       | Description |
|------------|-------------|-------------|
| `--local` | `-l` |   If specified, the local configuration file is read.     |

---
### spfxappdev config set
![since @spfxappdev/cli@1.0.0](https://img.shields.io/badge/since-v1.0.0-orange)

Sets the specified `<value>` for the given `<key>`.

```bash
spfxappdev config set <key> <value>
spfx c set <key> <value>
```

Only `templatesPath`, `packageManager`, `siteurl`, `clientId`, and `clientSecret` properties can be set using the `spfxappdev config set` command. To update the `npmPackages` list, you must use the `spfxappdev config add <key> <values...>` command.

#### Options
![since @spfxappdev/cli@1.1.0](https://img.shields.io/badge/since-v1.1.0-green) 

| Option       | Alias       | Description |
|------------|-------------|-------------|
| `--local` | `-l` |   If specified, the value is written to the local configuration file.     |

#### Example

```bash
spfxappdev config set templatesPath "D:\mySPFxCLITemplates"
```

Now you can use your own templates for `.eslintrc.js` and `tsconfig.json`. Just create the files `eslint.js.txt` and `tsconfig.txt` in that directory. Open the files, paste the default contents from [here](/src/templates/create/eslint.js.txt) and [here](/src/templates/create/tsconfig.txt), and adjust the rules to your liking.

---
### spfxappdev config add
![since @spfxappdev/cli@1.0.0](https://img.shields.io/badge/since-v1.0.0-orange)

Adds the specified value(s) to the given `<key>`. This command is only available for keys that store a "list" (array) of values. Existing values are not removed; the new values are appended to the end of the list.

```bash
spfxappdev config add <key> <values...>
spfx c add <key> <values...>
```

> Note: Currently, only the `<key>` "`npmPackages`" is supported.

#### Options
![since @spfxappdev/cli@1.1.0](https://img.shields.io/badge/since-v1.1.0-green) 

| Option       | Alias       | Description |
|------------|-------------|-------------|
| `--local` | `-l` |   If specified, the local configuration file is modified.     |

#### Example

```bash
# Adding multiple values at the same time
spfxappdev config add npmPackages @spfxappdev/utility @pnp/sp
# Adding a single value
spfxappdev config add npmPackages @spfxappdev/mapper
```
---
### spfxappdev config remove
![since @spfxappdev/cli@1.0.0](https://img.shields.io/badge/since-v1.0.0-orange)

Removes the specified value(s) from the given `<key>`. This command is only available for keys that store a "list" of values.

```bash
spfxappdev config remove <key> <values...>
spfx c remove <key> <values...>
```

> Note: Currently, only the `<key>` "`npmPackages`" is supported.

#### Options
![since @spfxappdev/cli@1.1.0](https://img.shields.io/badge/since-v1.1.0-green) 

| Option       | Alias       | Description |
|------------|-------------|-------------|
| `--local` | `-l` |   If specified, the local configuration file is modified.     |

#### Example

```bash
# Removing multiple values at the same time
spfxappdev config remove npmPackages @spfxappdev/utility @pnp/sp
# Removing a single value
spfxappdev config remove npmPackages @spfxappdev/mapper
```

---
### spfxappdev config remove-all
![since @spfxappdev/cli@1.0.0](https://img.shields.io/badge/since-v1.0.0-orange)

Removes all values from the specified `<key>`. This command is only available for keys that store a "list" of values.

```bash
spfxappdev config remove-all <key>
spfx c ra <key>
```

> Note: Currently, only the `<key>` "`npmPackages`" is supported.

#### Options
![since @spfxappdev/cli@1.1.0](https://img.shields.io/badge/since-v1.1.0-green) 

| Option       | Alias       | Description |
|------------|-------------|-------------|
| `--local` | `-l` |   If specified, the local configuration file is modified.     |

#### Example

```bash
spfxappdev config remove-all npmPackages
```

> This command clears the list entirely, resulting in an empty array `[]`.

### spfxappdev config create
![since @spfxappdev/cli@1.1.0](https://img.shields.io/badge/since-v1.1.0-green)

Creates a new local configuration file based on the global file settings.

```bash
spfxappdev config create
spfx c create
```

## How to use custom templates
Currently, the CLI supports custom templates exclusively for the `.eslintrc.js` and `tsconfig.json` files. If you want to override the CLI's default templates, you can define a custom `templatesPath` using this command:

```bash
spfxappdev config set templatesPath "{YourTemplatesFolderPath}"
``` 
Ensure that you have created files named `eslint.js.txt` and `tsconfig.txt` inside that folder. If either of these files is missing, the CLI will fall back to its default template for that specific file. You can copy the original template files directly from the `@spfxappdev/cli` npm package directory (`{pathtoyourglobalNPMFolder}\@spfxappdev\cli\lib\templates\create`), or you can copy the raw contents from [here](/src/templates/create/eslint.js.txt) and [here](/src/templates/create/tsconfig.txt). Once copied, you are free to customize the templates to fit your needs.

## How to use the alias paths

Most developers use relative paths to import files within an SPFx solution. Here are a few typical examples:

```typescript
import HelloWorldWebPartComponent from './components/HelloWorldWebPartComponent';
import { MyComponent } from '../../components/MyComponent';
```

However, this approach is error-prone. If you restructure your folders or want to reuse code across different levels, you have to update all these relative paths manually. 
To solve this, you can use `alias` paths instead. 

Here is the same example using aliases:

```typescript
import HelloWorldWebPartComponent from ' @webparts/helloworld/components/HelloWorldWebPartComponent';
import { MyComponent } from '@components/MyComponent';
```

When you run `spfxappdev init`, the following useful aliases are registered automatically:

```typescript
"@webparts": "src/webparts",
"@components": "src/components",
"@src": "src",
```

## How to register more aliases

If you need to register additional aliases, you must update a few specific files in your project.

### @spfxappdev/customAlias.js

Open the generated `@spfxappdev/customAlias.js` file and append your new aliases (starting around line 11).

#### Example

```typescript
generatedConfiguration.resolve.alias['@apps'] = path.resolve(__dirname, '..', 'lib/extensions');
```

> NOTE: In this file, you must map the alias to the `lib` folder, not `src`.


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

Open the `tsconfig.json` file in your root directory and register the additional entries by extending the `paths` property.

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

> NOTE: In this file, you must map the alias to the `src` folder!

### fast-serve/webpack.extend.js

If you are using `spfx-fast-serve`, Webpack must also be made aware of the aliases. Update the `fast-serve/webpack.extend.js` file and modify the `webpackConfig.resolve.alias` property. 

#### Example

```javascript
"@apps": path.resolve(__dirname, "..", "src/extensions")
```

> NOTE: In this file, you must map the alias to the `src` folder!

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

## Authentication with SharePoint/Graph

To use the CLI to generate a model based on an actual SharePoint list, you must authenticate against SharePoint or the Microsoft Graph API. This requires an App Registration in Microsoft Entra ID (formerly Azure AD). 

**1. Device Code Flow (SharePoint REST API)**
For user-delegated authentication, you only need a `Client ID`. The easiest way to create the necessary App Registration is via PnP PowerShell. Follow the steps in the [PnP PowerShell documentation](https://pnp.github.io/powershell/articles/registerapplication.html) to register a new app, or use an existing one. Once configured, you can authenticate using just the `Client ID` via the **Device Code Flow** (you will be prompted to enter a device code in your browser). 
The authentication token is cached locally in an `msal_{clientId}_cache.json` file in your project's root directory. If the access token expires or the cache file is deleted, you will be prompted to re-authenticate.

**2. Client Credentials Flow (Microsoft Graph API)**
If you prefer to authenticate via the **Client Credentials Flow** (which runs in the background without browser interaction), you must manually grant your App Registration application-level permissions for the Microsoft Graph API.
1. In the [Microsoft Entra Admin Center](https://entra.microsoft.com/), navigate to **App registrations** > **All applications** > **YOUR APP**.
2. Go to **API Permissions** > **Add a permission** > **Microsoft Graph** > **Application Permissions**.
3. Search for `Sites` and select at least `Sites.Read.All`.
4. Click **Add permissions**. Crucially, make sure to click **Grant admin consent for [Your Tenant]** afterward.
5. Navigate to **Certificates & secrets** > **Client secrets** > **New client secret** > **Add**.

> ℹ️ **Note:** Client secret values cannot be viewed after creation. Be sure to copy and save the secret value immediately before leaving the page.

You can now provide both the `Client ID` and the `Client secret` to the CLI to authenticate automatically and generate models via the Microsoft Graph API.

## Further links

As mentioned above, the CLI is heavily based on my personal tips and experiences. Many of the commands and the concepts behind them are explained in detail in the following articles:

- [My personal tips how to configure a SPFx project after creation](https://spfx-app.dev/my-personal-tips-how-to-configure-a-spfx-project-after-creation)
- [Using pnpm in SPFx projects](https://spfx-app.dev/using-pnpm-in-spfx-projects)
- [Package SPFx solution with one command and automatically increase the version](https://spfx-app.dev/package-spfx-solution-with-one-command-and-automatically-increase-the-version)
- [SPFx Azure DevOps Pipeline: Increment version, push to repository and publish package](https://spfx-app.dev/spfx-azure-devops-pipeline-increment-version-push-to-repository-and-publish-package)