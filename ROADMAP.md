# Claude Conversation Converter - Project Roadmap

*Last updated: September 23, 2025 at 9:47 PM CDT*

## Project Overview

A Node.js tool that converts Claude conversation JSON exports into well-formatted Markdown archives with comprehensive metadata, timezone conversion, and schema change detection.

## Current Status

- Basic conversion functionality implemented
- Attachment extraction working
- **Critical Issue**: Artifact content preservation failing (code blocks, structured documents not captured)

---

## CRITICAL PRIORITY (Data Loss Issues)

### 1. Fix Artifact Content Preservation
- **Status**: Not Started
- **Description**: Investigate JSON structure and update converter to capture code blocks, documents, and structured content that currently get lost
- **Impact**: High - Core functionality compromised, technical conversations lose most valuable content
- **Next Steps**: Use analyzer tool to examine JSON structure of artifact-containing messages

### 2. Test Artifact Extraction Across Content Types
- **Status**: Not Started  
- **Description**: Ensure code, analysis, and generated documents are properly preserved
- **Dependencies**: Fix #1 first
- **Acceptance Criteria**: All artifact types (code blocks, structured analysis, generated documents) preserved in output

---

## HIGH PRIORITY (Core Functionality)

### 3. Create Artifact Content Analyzer Tool
- **Status**: Not Started
- **Description**: Specialized JSON inspector to understand how artifacts are stored vs regular text
- **Purpose**: Diagnostic tool for understanding artifact storage structure
- **Deliverable**: Enhanced analyzer or separate diagnostic script

### 4. Implement Artifact Folder Extraction  
- **Status**: Not Started
- **Description**: Store artifacts in separate files like attachments for better readability and reusability
- **Structure**: `conversation_artifacts/` folders alongside existing `conversation_attachments/`
- **Benefits**: Cleaner conversation reading, artifacts usable in appropriate editors
- **Dependencies**: Complete artifact preservation fix first

### 5. Add Artifact Version Tracking
- **Status**: Not Started
- **Description**: Capture multiple iterations of the same artifact when possible
- **Challenge**: JSON export may not preserve revision history
- **Approach**: Analyze content similarity between messages, track repeated artifacts

---

## MEDIUM PRIORITY (Enhancement & Testing)

### 6. Practice Runs with Example Files
- **Status**: Not Started
- **Description**: Test converter thoroughly with various conversation types
- **Goals**: Identify edge cases, validate output quality, stress test functionality
- **Prerequisites**: Critical issues resolved

### 7. Deep Analysis of Complete JSON Archive
- **Status**: Partially Complete (basic analyzer created)
- **Description**: Comprehensive examination of all available data fields
- **Current**: Basic structure analysis working
- **Next**: Enhanced analysis focusing on artifact storage patterns

### 8. Individual JSON Export Feature
- **Status**: Not Started
- **Description**: Create single-conversation JSON files for portability and re-upload
- **Use Cases**: Selective sharing, conversation continuation, context transfer
- **Output**: Pair each `.md` file with corresponding `.json` file

### 9. Conversation Excerpt Functionality
- **Status**: Not Started
- **Description**: Allow partial conversation extraction with proper metadata
- **Features**: Message range selection, clear excerpt indicators, context preservation
- **Benefits**: Focused sharing, documentation creation, sensitive content removal

---

## LOW PRIORITY (Organization & Future Features)

### 10. Git Repo with Issue Tracking
- **Status**: Partially Complete (repo exists, formal issue tracking pending)
- **Description**: Formal project management and documentation
- **Next Steps**: Migrate high-priority items to GitHub Issues

### 11. Chat Memory Organization Integration
- **Status**: Not Started
- **Description**: Connect with broader conversation management workflows
- **Context**: Related to conversation referenced in chat memory organization discussion
- **Scope**: To be defined based on memory system requirements

### 12. CSS Styling for Markdown
- **Status**: Not Started
- **Description**: Improve visual presentation of archived conversations
- **Focus**: Address large footnote superscript numbers, overall readability
- **Delivery**: Optional CSS files for enhanced display

### 13. UTC Time Format Improvements
- **Status**: Not Started
- **Description**: Fix 24-hour formatting and cross-timezone handling
- **Issues**: 
  - UTC footnotes currently use 12-hour format (needs 24-hour)
  - Handle cases where local date ≠ UTC date
- **Impact**: Low - current system functional but could be more precise

### 14. Conversation Versioning Strategy  
- **Status**: Not Started
- **Description**: Handle updated conversations and naming conflicts
- **Current**: Basic duplicate handling with time disambiguation
- **Enhancement**: More sophisticated versioning, change detection, metadata tracking

---

## Completed Items

- ✅ Basic JSON to Markdown conversion
- ✅ Dual-date filename pattern (creation + modification dates)
- ✅ CamelCase title sanitization
- ✅ Attachment extraction with collision handling
- ✅ Flexible timezone conversion
- ✅ Schema change detection
- ✅ Comprehensive README documentation
- ✅ Similar tools analysis and positioning
- ✅ Git repository setup
- ✅ Basic JSON structure analyzer tool

---

## Notes and Considerations

### Artifact Storage Investigation
The critical artifact preservation issue suggests that Claude's JSON export stores artifacts (code blocks, structured documents) differently from regular message text. Investigation priorities:

1. Compare JSON structure of messages with/without artifacts
2. Identify content type markers that distinguish artifacts
3. Update extraction logic to handle all content types
4. Test preservation across different artifact categories

### Architecture Decisions
- **File Organization**: Separate folders for attachments vs artifacts improves usability
- **Version Control**: Local markdown documentation provides resilience against service disruptions
- **Extensibility**: Modular analyzer approach allows for specialized diagnostic tools

### Success Metrics
- Zero content loss during conversion (all artifacts preserved)
- Clean separation of conversation flow from technical artifacts  
- Maintainable codebase with comprehensive error handling
- Complete documentation enabling independent usage