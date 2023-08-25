# @spfxappdev/cli

[![npm version](https://badge.fury.io/js/@spfxappdev%2Fcli.svg)](https://badge.fury.io/js/@spfxappdev%2Fcli.svg)

**@spfxappdev/cli** is a command line interface (CLI). It is an utility tool during SPFx development. It allows you to set up your SPFx project with one command. So you can modify your SharePoint Framework solution to use `alias` paths instead of relative paths. 
Also, an automatic `version increment` task (gulp) is included and you can build, increment the version, bundle and package the solution with just one `npm` command. You can create services, models and (soon) Azure DevOps Build Pipeline definitions (yaml file). It also comes with its own ESLint and TypeScript `compilerOptions` rules without changing the original ones. And it is possible to store own templates and settings to not have to fall to the default rules/settings from the CLI. So you always have the configuration of a project (which is most likely always the same) done with a single command. And yes, I have to admit the rules and settings match my typical settings and configurations. But since I didn't want to keep doing the same steps for every project, I decided to develop this CLI to make my life easier. Maybe you like my CLI too. I am also open for improvement suggestions.


---

## Installation

`npm i @spfxappdev/cli -g`

## Usage

1. Run `npm i @spfxappdev/cli -g`
2. Open a command line in a folder with your SharePoint Framework solution you want modify/extend.
3. Run `spfxappdev init`

After you have executed the command, the following files have been modified/created:

1. A new folder `@spfxappdev` was created in the root directory of the project
2. `gulpfile.js` was modified
3. `tsconfig.json` was modified
4. `fast-serve/webpack.extend.js` was modified (if exists)
5. `package.json` was modified

Now you can use one command, to clean, build, version increment, bundle and package solution

```bash
npm run publish
```

If you want to increase the version without creating or bundling the solution, you can use this command:

```bash
gulp bump-version
```

### More information about the publish and bump-version command can be found in [my blog post](https://spfx-app.dev/package-spfx-solution-with-one-command-and-automatically-increase-the-version)

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