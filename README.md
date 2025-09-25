# Claude Conversations JSON to Markdown Converter

A Node.js script that converts exported Claude conversation JSON files into individual, well-formatted Markdown files for archival purposes.

## Purpose

This tool addresses the need to archive Claude conversations in a readable, searchable format. While Claude provides JSON exports, these are difficult to read and reference. This converter transforms them into clean Markdown files that are:

- **Human-readable**: Easy to browse and search through
- **Well-organized**: One file per conversation with clear metadata
- **Future-proof**: Plain text format that will remain accessible
- **Timestamped**: Includes both local time and UTC for reference

## Features

- **Automatic timezone conversion** - Displays times in your local timezone while preserving UTC
- **Schema change detection** - Alerts you when Anthropic changes their export format
- **Comprehensive metadata** - Includes conversation URLs, IDs, dates, and message counts
- **Clean formatting** - Uses emojis and footnotes for easy reading
- **Error handling** - Graceful handling of malformed data or missing files
- **Batch processing** - Handles large JSON exports with hundreds of conversations

## Requirements

- **Node.js** (version 12 or higher)
- **Claude conversation export** in JSON format

## Installation

1. **Download the script**: Save `convert_conversations.js` to your desired directory
2. **Get your Claude export**: 
   - Go to Claude.ai
   - Export your conversations as JSON
   - Save the file as `conversations.json`

## Usage

### Basic Usage

1. Place both files in the same directory:
   ```
   your-folder/
   ├── convert_conversations.js
   └── conversations.json
   ```

2. Open terminal/command prompt in that directory

3. Run the conversion:
   ```bash
   node convert_conversations.js
   ```

4. Find your converted files in the `claude_conversations_markdown/` directory

### Output Structure

The script creates:
- **Individual Markdown files** for each conversation
- **Descriptive filenames** like `2025-09-06_macOS_Folder_Year-Month_Generator.md`
- **Schema tracking file** (`claude_schema.json`) to monitor format changes

### Sample Output

Each Markdown file includes:

```markdown
Title: Archived AI conversation
Conversation name: "macOS Folder Year-Month Generator"
Conversation began: 2025-09-06 (Fri, Sep 6, 2025)
Conversation last updated: 2025-09-06 (Fri, Sep 6, 2025)
Conversation URL: https://claude.ai/chat/a61869be-1da2-4261-9c9f-22de05f55af9
Conversation ID: a61869be-1da2-4261-9c9f-22de05f55af9
Total messages in conversation: 2
AI model: Claude (version unknown)
Archive file creation date: 2025-09-13 (Fri, Sep 13, 2025)

---

# 👤 Human [^1]

I use macOS. Could you please help me craft a command...

[^1]: *Sep 6, 2025 at 12:49 PM CDT (17:49 UTC), Message 1*

# 🤖 Assistant [^2]

I'll help you create a command to generate those year-month folders...

[^2]: *Sep 6, 2025 at 12:49 PM CDT (17:49 UTC), Message 2*
```

## Configuration

### Customizing Settings

You can modify these constants at the top of the script:

```javascript
const INPUT_FILE = 'conversations.json';           // Your JSON export filename
const OUTPUT_DIR = 'claude_conversations_markdown'; // Output directory name
const SCHEMA_FILE = 'claude_schema.json';          // Schema tracking filename
```

### Timezone Handling

The script automatically uses your system's timezone settings. Times are displayed as:
- **Local time**: `Sep 6, 2025 at 12:49 PM CDT`
- **UTC reference**: `(17:49 UTC)`

This works correctly across daylight saving time transitions.

## Schema Change Detection

The script monitors Anthropic's JSON export format and alerts you to changes:

```
🚨 JSON STRUCTURE HAS CHANGED! 🚨
📈 New keys found:
   + conversation.model_version
   + message.assistant_type
```

This helps you know when new features (like model version info) become available.

## Troubleshooting

### Common Issues

**"Input file not found"**
- Ensure `conversations.json` is in the same directory as the script
- Check the filename spelling and case sensitivity

**"JSON file does not contain an array"**
- Verify you exported conversations (not individual messages)
- Check that the JSON file isn't corrupted

**Permission errors**
- Ensure you have write permissions in the current directory
- Try running from a different location

**Large file processing**
- The script handles large exports, but very large files (1000+ conversations) may take several minutes
- Watch the console for progress updates

### Getting Help

If you encounter issues:
1. Check the console output for specific error messages
2. Verify your `conversations.json` file is valid JSON
3. Ensure you're using Node.js version 12 or higher

## File Organization Tips

For better organization of your archived conversations:

1. **Create dated folders**: Organize exports by time period
2. **Use descriptive names**: Rename `conversations.json` to include export dates
3. **Regular exports**: Export and convert conversations monthly or quarterly
4. **Version control**: Consider using Git to track changes in your archive

## Future Enhancements

This script is designed to be extensible. Potential improvements include:
- Automatic model version detection (when available in exports)
- Custom output formats (plain text, HTML)
- Conversation filtering and search capabilities
- Integration with note-taking applications

## Similar Tools

Several other tools exist for exporting Claude conversations, each with different approaches:

**Browser Extensions & Real-time Export:**
- [socketteer/Claude-Conversation-Exporter](https://github.com/socketteer/Claude-Conversation-Exporter) - Chrome extension with bulk export and model detection
- [legoktm/claude-to-markdown](https://github.com/legoktm/claude-to-markdown) - Firefox extension with GitHub Gist integration
- [Llaves/ClaudeExport](https://github.com/Llaves/ClaudeExport) - HTML format exports

**Console Scripts:**
- [ryanschiang/claude-export](https://github.com/ryanschiang/claude-export) - Browser console script for individual conversations
- [agarwalvishal/claude-chat-exporter](https://github.com/agarwalvishal/claude-chat-exporter) - JavaScript console tool

**Desktop/CLI Applications:**
- [davidteren/claude_desktop_export_browser](https://github.com/davidteren/claude_desktop_export_browser) - Python browser for Claude Desktop exports
- [ZeroSumQuant/claude-conversation-extractor](https://github.com/ZeroSumQuant/claude-conversation-extractor) - Specifically for Claude Code conversations

### Why This Tool?

This tool takes a different approach, focusing specifically on **archival quality** for official Anthropic JSON exports:

- **Comprehensive metadata**: Includes conversation URLs, IDs, precise timestamps, and day-of-week information
- **Automatic timezone conversion**: Smart handling of local time vs UTC with daylight saving awareness  
- **Schema change detection**: Monitors Anthropic's export format and alerts you to new features
- **Educational code**: Extensively commented for learning and customization
- **Batch processing**: Handles large official exports efficiently
- **Future-proof design**: Built to detect and adapt to format changes over time

While browser extensions are great for real-time export, this tool excels at creating a permanent, well-organized archive from your complete conversation history.

## Technical Details

- **Language**: JavaScript (Node.js)
- **Dependencies**: Only Node.js built-in modules (fs, path)
- **Output format**: GitHub-flavored Markdown
- **Character encoding**: UTF-8
- **Cross-platform**: Works on Windows, macOS, and Linux

## License

This project is provided as-is for personal archival use. Feel free to modify and adapt for your needs.

---

**Author**: EJ Makela  
**Created**: 2025-09-14  
**Assistance**: Claude, Sonnet 4