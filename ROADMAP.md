# Claude Conversation Converter - Project Roadmap

## Project Overview

A Node.js tool that converts Claude conversation JSON exports into well-formatted Markdown archives with comprehensive metadata, timezone conversion, and schema change detection.

## Current Status

- Basic conversion functionality implemented
- Attachment extraction working
- **✅ FIXED**: Artifact content preservation now working (code blocks, structured documents captured)

---

## CRITICAL PRIORITY (Data Loss Issues)

### 0. Remove Sensitive Data from Git History
- **Status**: ✅ COMPLETE
- **Completion**: Fresh repository created with clean history, old repository deleted from GitHub, repository made public
- **Approach**: Fresh repository creation method successfully eliminated all sensitive data
- **Result**: Repository now public without any exposure of personal conversation data

### 1. Fix Artifact Content Preservation
- **Status**: ✅ COMPLETE (2025-10-01)
- **Description**: Updated converter to capture code blocks, documents, and structured content from tool_use blocks
- **Solution**: Modified `extractTextFromContent()` to process `type === "tool_use"` blocks where `name === "artifacts"`
- **Implementation**: Extracts code from `input.content` and formats as markdown code blocks with language syntax highlighting
- **Testing**: Verified with messages 6 and 40 from "Claude Convo Utility (Part 1)" - JavaScript artifacts now preserved
- **Impact**: Core archival functionality restored - technical conversations now retain all valuable content

### 2. Test Artifact Extraction Across Content Types
- **Status**: Partially Complete (2025-10-01)
- **Description**: Verify code, analysis, and generated documents are properly preserved across different artifact types
- **Progress**: 
  - JavaScript artifacts confirmed working in "Claude Convo Utility (Part 1)"
  - Inline code examples (non-artifacts) correctly preserved without titles
  - Spot-checked multiple conversation types for code block preservation
- **Next**: Test with Python, React components, markdown documents, data analysis outputs
- **Acceptance Criteria**: All artifact types (code blocks, structured analysis, generated documents) preserved in output

---

## HIGH PRIORITY (Core Functionality)

### 3. Create Artifact Content Analyzer Tool
- **Status**: Not Started
- **Description**: Specialized JSON inspector to understand how artifacts are stored vs regular text
- **Purpose**: Diagnostic tool for understanding artifact storage structure
- **Note**: May no longer be needed since artifact preservation is fixed - reassess priority
- **Deliverable**: Enhanced analyzer or separate diagnostic script

### 4. Implement Artifact Folder Extraction  
- **Status**: Not Started
- **Description**: Store artifacts in separate files like attachments for better readability and reusability
- **Structure**: `conversation_artifacts/` folders alongside existing `conversation_attachments/`
- **Benefits**: Cleaner conversation reading, artifacts usable in appropriate editors
- **Dependencies**: Complete artifact preservation fix first ✅

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
- **Prerequisites**: Critical issues resolved ✅

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

### 10. Artifact Version Tracking Investigation
- **Status**: Not Started
- **Description**: Investigate how artifact versions are stored in JSON exports and whether version history is preserved
- **Technical Questions**:
  - Do different messages contain different `version_uuid` values for updated artifacts?
  - Does the export preserve intermediate versions or only final states?
  - Is version progression traceable across messages?
- **Requirements**: Analyze conversations with known artifact updates to understand version structure
- **Priority**: Medium - needed before implementing version display features

### 11. Artifact Versioning in Output
- **Status**: Not Started
- **Description**: Display artifact version information in converted markdown
- **Dependencies**: Complete version tracking investigation first (Item 10)
- **Implementation**: 
  - Detect when same artifact appears in multiple messages
  - Compare `version_uuid` values
  - Label output as "Version 1", "Version 2", etc.
- **Priority**: Medium - enhances understanding of artifact evolution in conversations

### 12. Conversion Tool with Embedding Options
- **Status**: Not Started
- **Description**: Post-processor tool to transform artifact/attachment embedding in converted files
- **Features**:
  - (a) Flag to embed or separate artifacts during initial conversion
  - (b) Flag to embed or separate attachments during initial conversion
  - (c) Extract embedded artifacts from markdown to separate files
  - (d) Re-embed separated artifacts into markdown (challenging - requires metadata)
- **Architecture**: Separate utility that operates on already-converted markdown files
- **Priority**: Low - Enhancement for workflow flexibility
- **Note**: Extract-to-separate (c) much easier than re-embed (d) due to information flow

---

## LOW PRIORITY (Organization & Future Features)

### 13. Git Repo with Issue Tracking
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
- **Description**: Create optional CSS themes for enhanced visual presentation of archived conversations
- **Features**: 
  - Address large footnote superscript numbers for better readability
  - Provide multiple themes (print-friendly, screen reading, academic formatting)
  - Community contribution framework for custom themes
- **Implementation**: Include sample CSS files with documentation for applying to markdown renderers
- **Community aspect**: CSS themes ideal for open-source contributions - self-contained, customizable, don't affect core functionality
- **Technical considerations**: Must work across different markdown parsers and rendering engines

### 15. CSS Styling for Markdown
- **Status**: Not Started
- **Description**: Create optional CSS themes for enhanced visual presentation of archived conversations
- **Features**: 
  - Address large footnote superscript numbers for better readability
  - Provide multiple themes (print-friendly, screen reading, academic formatting)
  - Community contribution framework for custom themes
- **Implementation**: Include sample CSS files with documentation for applying to markdown renderers
- **Community aspect**: CSS themes ideal for open-source contributions - self-contained, customizable, don't affect core functionality
- **Technical considerations**: Must work across different markdown parsers and rendering engines

### 16. Export Comparison and Deletion Detection
*Partial duplicate of item 19. Slight differences exist between the two. TODO: Merge carefully.* 
- **Status**: Not Started
- **Description**: Compare new exports with previous exports to identify deleted conversations, renamed conversations, and track archive evolution
- **Features**:
  - Store lightweight metadata snapshot from each export (conversation UUIDs, titles, dates, message counts)
  - Compare new export against previous snapshot to detect:
    - Missing conversations (deleted)
    - Same UUID with different title (renamed)
    - New conversations (added since last export)
  - Generate report showing changes between exports
  - Preserve last-known metadata for deleted conversations
- **Architecture**: JSON-based index file tracking conversation metadata across exports
- **Technical Approach**: 
  - Use UUID as stable identifier for conversation tracking
  - Title comparison on matching UUIDs reveals renames
  - UUID presence/absence reveals additions/deletions
- **Testing Requirements**: 
  - Verify detection accuracy across deletion, rename, and addition scenarios
  - Test edge cases (potential UUID reuse, malformed data)
- **Priority**: Medium - useful for understanding conversation lifecycle and archive completeness

### 17. UTC Time Format Improvements
*Another item, below, shares this same item number. TODO: Update all assigned numbers.* 
- **Status**: Not Started
- **Description**: Fix 24-hour formatting and cross-timezone handling
- **Issues**: 
  - UTC footnotes currently use 12-hour format (needs 24-hour)
  - Handle cases where local date ≠ UTC date
- **Impact**: Low - current system functional but could be more precise

### 17. Conversation Versioning Strategy  
*Another item, above, shares this same item number. TODO: Update all assigned numbers.* 
- **Status**: Not Started
- **Description**: Handle updated conversations and naming conflicts
- **Current**: Basic duplicate handling with time disambiguation
- **Enhancement**: More sophisticated versioning, change detection, metadata tracking

### 18. Migrate Conversation to Existing Project
- **Status**: ✅ COMPLETE
- **Description**: Transfer this conversation's context to the "Creative #code and tech ideas" project
- **Resolution**: Claude now provides native conversation migration feature - conversation successfully moved to project
- **Benefits**: Access to project-wide instructions, educational protocols, and organized conversation management

### 19. Export Comparison and Deletion Detection
*Partial duplicate of item 16. Slight differences exist between the two. TODO: Merge carefully.* 
- **Status**: Not Started
- **Description**: Compare new exports with previous exports to identify deleted conversations and track archive evolution
- **Features**:
  - Store lightweight metadata snapshot from each export (conversation IDs, titles, dates, message counts)
  - Compare new export against previous snapshot to detect missing conversations
  - Generate deletion report showing conversations present in old export but missing in new
  - Preserve last-known metadata for deleted conversations
- **Architecture**: JSON-based index file tracking conversation metadata across exports
- **Testing Requirements**: 
  - Examine actual deleted conversation structure in real exports
  - Verify detection accuracy across deletion scenarios
  - Test edge cases (renamed conversations, potential ID reuse)
- **Priority**: Medium - depends on whether deleted conversations create actual archival problems

### 20. Export Activity Reporting and Analytics
- **Status**: Not Started
- **Description**: Generate comprehensive reports tracking archive operations and evolution over time
- **Features**:
  - Timestamped log files for each export session
  - Summary statistics: export date, conversations processed, attachments extracted, errors encountered
  - Comparative metrics: conversations added/removed since last export, growth patterns over time
  - Trend analysis: conversation activity periods, archive growth trajectories
- **Output Format**: Structured data (JSON, CSV, plain text) for easy consumption by external tools
- **AI Integration Decision**: Tool generates structured reports WITHOUT built-in AI analysis
  - Users can optionally feed data to their preferred AI tools (ChatGPT, Claude, local models)
  - Avoids third-party dependencies, API complexity, authentication requirements, costs
  - Maintains tool simplicity, privacy, and independence
- **Benefits**: Audit trail for archival completeness, historical tracking, user-controlled AI insights
- **Priority**: Low - Enhancement that provides value but not essential for core functionality

### 21. Brave Leo Conversation Archival Support
- **Status**: Not Started - Technically Viable
- **Description**: Create tool to archive Brave Leo AI assistant conversations stored in local SQLite database
- **Technical Implementation**:
  - Leo stores conversations in plain-text SQLite database (`AIChatDatabase` class in `brave-core`)
  - Database located in browser profile directory (no encryption or access restrictions)
  - Direct database reading using standard SQLite tools (Python sqlite3, DB Browser for SQLite)
  - No browser extension or API integration required
- **Architecture Decision**: Separate Leo-specific tool rather than integrated converter
  - Different data source: SQLite database vs JSON file exports
  - Different access pattern: Direct database reading vs file upload
  - Could share Markdown generation code as common library between tools
- **Privacy Considerations**:
  - Conversations stored locally on user's device only
  - No server-side logging or retention by Brave
  - User has full filesystem access to their own data
- **Development Requirements**:
  - Locate Leo SQLite database in browser profile directories (cross-platform paths)
  - Parse conversation table structure and metadata
  - Adapt Markdown conversion logic from Claude converter
  - Handle multi-model conversations (Mixtral, Claude, Llama variants)
- **Priority**: Medium - Technically straightforward, serves users of different AI platform
- **Benefits**: Expands tool ecosystem to support browser-integrated AI assistants

---

## Completed Items

- ✅ Basic JSON to Markdown conversion
- ✅ Dual-date filename pattern (creation + modification dates)
- ✅ CamelCase title sanitization
- ✅ Attachment extraction with collision handling
- ✅ Flexible timezone conversion
- ✅ Schema change detection
- ✅ Comprehensive README documentation (item 3a)
- ✅ Similar tools analysis and positioning (item 3b)
- ✅ Git repository setup (item 4)
- ✅ Basic JSON structure analyzer tool (item 3, 7)
- ✅ Sensitive data removal from Git history (item 0)
- ✅ Repository made public (item 0)
- ✅ Conversation migrated to project (item 15)
- ✅ Learning reference document created
- ✅ Artifact content preservation fixed (item 1)

---

## Notes and Considerations

### Artifact Preservation Success
The critical artifact preservation issue has been resolved by updating `extractTextFromContent()` to process `tool_use` blocks where `name === "artifacts"`. The function now:
- Extracts code from `input.content` field
- Formats as markdown code blocks with proper language syntax highlighting
- Preserves artifact titles for context
- Maintains backward compatibility with old `text` field structure

### Testing Status
Initial verification complete with JavaScript artifacts in "Claude Convo Utility (Part 1)". Further testing needed across:
- Python code artifacts
- React components
- Markdown documents
- Data analysis outputs
- Other structured content types

### Architecture Decisions
- **File Organization**: Separate folders for attachments vs artifacts improves usability
- **Version Control**: Local markdown documentation provides resilience against service disruptions
- **Extensibility**: Modular analyzer approach allows for specialized diagnostic tools

### Success Metrics
- Zero content loss during conversion (all artifacts preserved) ✅
- Clean separation of conversation flow from technical artifacts  
- Maintainable codebase with comprehensive error handling
- Complete documentation enabling independent usage