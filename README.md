# AI Prettier Obsidian Plugin

```
Work in Progress: Local Testing Only 🚧

This plugin is currently under development and has not been pushed to production yet. It is intended for local testing purposes only.

Please note that the functionality and stability of the plugin may be limited during this stage. Any feedback or bug reports are greatly appreciated.

Thank you for your understanding.
```

A plugin for Obsidian that uses AI to format your notes.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Development](#development)
- [License](#license)

## Installation

1. Download the latest release from the [Releases](https://github.com/your-repo/releases) page.
2. Extract the contents of the zip file into your Obsidian plugins folder.
3. Enable the plugin from the Obsidian settings.

## Usage

Once the plugin is enabled, it will automatically format your notes using AI. If there is an error, a notice will appear in Obsidian.

## Development

### Prerequisites

- Node.js
- npm

### Building the Plugin

1. Clone the repository:

   ```sh
   git clone https://github.com/your-repo/ai-prettier-obsidian-plugin.git
   cd ai-prettier-obsidian-plugin
   ```

2. Install dependencies:

   ```sh
   npm install
   ```

3. Build the project:

   ```sh
   npm run build
   ```

4. For development mode with watch:
   ```sh
   npm run dev
   ```

### Project Structure

- `main.ts`: The main plugin file.
- `esbuild.config.mjs`: Configuration for esbuild.
- `manifest.json`: Plugin manifest file.
- `package.json`: Project dependencies and scripts.
- `tsconfig.json`: TypeScript configuration.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Author

- [Rodrigo Cipriani](https://www.linkedin.com/in/rodrigociprianidarosa) Check out my LinkedIn profile.
