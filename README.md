# Nuxt Minimal Starter

```bash
nvm install --lts
node -v > .nvmrc
```

## Add .npmrc file

Create the file manually and add the shamefully hoised value
shamefully-hoist=true

## Add the extensions and settings files for VSCode

create the folder .vscode and inside we create the extensions.json file with the following content

```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "Vue.volar",
    "Prisma.prisma",
    "bradlc.vscode-tailwindcss",
    "dbaeumer.vscode-eslint"
  ],
  "unwantedRecommendations": ["octref.vetur"]
}
```

Now we create another file called settings.json with the following content

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[vue]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "files.associations": {
    "*.css": "tailwindcss"
  },
  "editor.quickSuggestions": {
    "strings": "on"
  }
}
```

## Installing Nuxt UI

We need to create a main.css file inside assets/css with the following code inside

```tailwindcss
@import 'tailwindcss' theme(static);
@import '@nuxt/ui'
```

We also need to add the css property on our nuxt.config.ts file with the path of this file

```ts
export default defineNuxtConfig({
  // some code

  css: ['~/assets/css/main.css'],

  // some code,
});
```

## Adding linting to our project

Now we are going to add the eslint module on our project with the following command

```bash
pnpm dlx nuxi module add eslint
```

And add the module to our config file

```ts
export default defineNuxtConfig({
  // some code

  modules: ['@nuxt/eslint' /* '@nuxt/fonts', '@nuxt/icon', '@nuxt/image', '@nuxt/ui' */],
});
```

Then we add the eslint script commands to our package.json file

```json
{
  "scripts": {
    "build": "nuxt build",
    "dev": "nuxt dev",
    "generate": "nuxt generate",
    "preview": "nuxt preview",
    "postinstall": "nuxt prepare",
    "lint": "eslint .",
    "lint:fix": "eslint --fix ."
  }
}
```

### Adding Husky to prevent making commits with errors

We install the dependency with the following command

```bash
pnpm add --save-dev husky
```

Then we initialize the dependency with this command

```bash
pnpm exec husky init
```

That is going to create the .husky folder and some files. We need to open the pre-commit file and change the command for pnpm lint, that is going to run every time we make a commit
