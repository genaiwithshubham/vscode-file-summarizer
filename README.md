# File Summarizer VSCode Extension

A VSCode extension that uses Large Language Models to generate intelligent summaries of your code files.

## Features

- **Right-click summarization**: Right-click on any supported file in the explorer or editor to generate a summary
- **AI-powered analysis**: Uses OpenAI's GPT models to understand and summarize your code
- **Beautiful webview**: Displays summaries in a clean, readable webview panel
- **Multiple file types**: Supports JavaScript, TypeScript, Python, Java, C++, and many other languages
- **Configurable**: Customize the AI model, API settings, and summary length

## Installation

1. Clone this repository
2. Run `npm install` to install dependencies
3. Run `npm run compile` to compile TypeScript
4. Press `F5` to open a new Extension Development Host window
5. Configure your OpenAI API key in settings

## Configuration

Before using the extension, you need to configure your OpenAI API key:

1. Open VSCode Settings (`Ctrl+,` or `Cmd+,`)
2. Search for "File Summarizer"
3. Enter your OpenAI API key in the "Api Key" field

### Available Settings

- **fileSummarizer.model**: AI model to use (gpt-3.5-turbo, gpt-4, gpt-4-turbo)

## Usage

1. Right-click on any supported file in the Explorer or Editor
2. Select "Summarize File" from the context menu
3. Wait for the AI to analyze your code
4. View the summary in the webview panel that opens

## Supported File Types

- JavaScript (.js)
- TypeScript (.ts)
- Python (.py)
- Java (.java)
- C++ (.cpp, .c)
- C# (.cs)
- PHP (.php)
- Ruby (.rb)
- Go (.go)
- Rust (.rs)
- Swift (.swift)
- Kotlin (.kt)
- Scala (.scala)
- Dart (.dart)
- R (.r)
- SQL (.sql)
- HTML (.html)
- CSS (.css, .scss, .sass, .less)
- JSON (.json)
- XML (.xml)
- YAML (.yaml, .yml)
- Markdown (.md)
- Text (.txt)

## Commands

- `File Summarizer: Summarize File` - Generate a summary of the selected file

## Development

### Building

```bash
npm install
npm run compile
```

### Running

Press `F5` to start debugging the extension in a new Extension Development Host window.

### Packaging

```bash
npm install -g vsce
vsce package
```

## Requirements

- VSCode 1.74.0 or higher
- OpenAI API key
- Internet connection for API calls

## Known Issues

- Large files may take longer to process
- API rate limits may apply based on your OpenAI plan
- Internet connection required for AI processing

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This extension is released under the MIT License.