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
