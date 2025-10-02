#!/usr/bin/env node
/**
 * Claude Conversations JSON to Markdown Converter
 * 
 * DESCRIPTION: Converts exported Claude conversation JSON files into individual Markdown files for archival purposes.
 * AUTHOR: EJ Makela
 * ORIGINAL CREATION DATE: 2025-09-23
 * CREDIT: Assistance provided by Claude, Sonnet 4.5 (https://claude.ai/chat/[current-conversation-id])
 */

// Import required Node.js modules
const fs = require('fs');           // File system operations (reading/writing files)
const path = require('path');       // Path manipulation utilities for cross-platform file paths

// ===== CONFIGURATION SECTION =====
// These constants control how the conversion works - modify as needed

const INPUT_FILE = 'conversations.json';           // Name of the input JSON file from Claude export
const OUTPUT_DIR = 'claude_conversations_markdown'; // Directory where converted Markdown files will be saved
const SCHEMA_FILE = 'claude_schema.json';          // File to track JSON structure changes over time

// ===== UTILITY FUNCTIONS =====
// These helper functions handle common tasks throughout the script

/**
 * Formats a UTC timestamp into a human-readable local time
 * Automatically detects the system's timezone and adjusts for daylight saving time
 * 
 * @param {string} dateString - ISO format date string from the JSON
 * @returns {string} - Formatted date and time in local timezone
 */
function formatLocalTime(dateString) {
    if (!dateString) return 'Unknown';
    
    const date = new Date(dateString);
    
    // Use the system's local timezone settings
    // This automatically handles daylight saving time transitions
    const localTime = date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',      // Shows "Sep" instead of "September"
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short' // Shows "CDT", "EST", etc.
    });
    
    // Also format the UTC time for reference (24-hour format)
    const utcTime = date.toLocaleString('en-US', {
        hour12: false,       // Use 24-hour format
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC'
    }) + ' UTC';
    
    return `${localTime} (${utcTime})`;
}

/**
 * Formats just the date portion for use in filenames and headers
 * 
 * @param {string} dateString - ISO format date string
 * @returns {string} - Date in YYYY-MM-DD format
 */
function formatShortDate(dateString) {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toISOString().split('T')[0];
}

/**
 * Formats a date with day of the week for conversation metadata
 * 
 * @param {string} dateString - ISO format date string
 * @returns {string} - Date with day name, e.g., "2025-09-06 (Fri, Sep 6, 2025)"
 */
function formatDateWithDay(dateString) {
    if (!dateString) return 'Unknown';
    
    const date = new Date(dateString);
    const shortDate = formatShortDate(dateString);
    const longDate = date.toLocaleDateString('en-US', {
        weekday: 'short',    // "Fri"
        month: 'short',      // "Sep"
        day: 'numeric',      // "6"
        year: 'numeric'      // "2025"
    });
    
    return `${shortDate} (${longDate})`;
}

/**
 * Extracts text content from Claude's message content array
 * UPDATED: Now also extracts artifact code from tool_use blocks
 * 
 * Claude stores messages in a complex nested structure with multiple content types:
 * - type: "text" - Regular conversation text
 * - type: "tool_use" - When Claude uses tools (like creating artifacts)
 * - type: "tool_result" - Results returned from tools
 * 
 * This function extracts all relevant content and formats it appropriately.
 * 
 * @param {Array} content - The content array from a chat message
 * @returns {string} - Plain text and formatted code blocks
 */
function extractTextFromContent(content) {
    // Handle cases where content might be missing or malformed
    if (!content || !Array.isArray(content)) return '';
    
    const parts = [];
    
    content.forEach(item => {
        // Extract regular text blocks
        if (item.type === 'text' && item.text) {
            parts.push(item.text);
        }
        
        // Extract artifact code from tool_use blocks
        // Artifacts contain code, documents, or other structured content
        if (item.type === 'tool_use' && item.name === 'artifacts') {
            if (item.input && item.input.content) {
                // Get the language for proper syntax highlighting
                const language = item.input.language || '';
                const title = item.input.title || 'Artifact';
                
                // Format as a code block with title
                parts.push(`\n**${title}**\n\n\`\`\`${language}\n${item.input.content}\n\`\`\`\n`);
            }
        }
        
        // Optionally extract tool results (for debugging or completeness)
        // Uncomment if you want to see tool execution results in the archive
        /*
        if (item.type === 'tool_result' && item.content) {
            const resultText = Array.isArray(item.content) 
                ? item.content.map(c => c.text).join('\n')
                : item.content;
            parts.push(`\n*[Tool result: ${resultText}]*\n`);
        }
        */
    });
    
    // Join all parts with double newlines for readability
    return parts.join('\n\n');
}

/**
 * Sanitizes conversation titles for use in filenames
 * Removes special characters and converts to CamelCase for filesystem safety
 * 
 * @param {string} title - Original conversation title
 * @returns {string} - Sanitized CamelCase title safe for filenames
 */
function sanitizeTitle(title) {
    if (!title || typeof title !== 'string') {
        return 'UntitledConversation';
    }
    
    // Remove special characters, keep only letters, numbers, and spaces
    const cleaned = title
        .replace(/[^a-zA-Z0-9\s]/g, '')  // Remove special characters
        .trim()                          // Remove leading/trailing whitespace
        .replace(/\s+/g, ' ');          // Normalize multiple spaces to single spaces
    
    if (!cleaned) {
        return 'UntitledConversation';
    }
    
    // Convert to CamelCase
    return cleaned
        .split(' ')
        .map((word, index) => {
            if (word.length === 0) return '';
            // Capitalize first letter of each word, lowercase the rest
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join('');
}

/**
 * Generates a content hash for duplicate detection
 * Creates a simple hash based on file content to identify duplicates
 * 
 * @param {string} content - File content to hash
 * @returns {string} - Short hash string for duplicate detection
 */
function generateContentHash(content) {
    // Simple hash function for duplicate detection
    let hash = 0;
    if (content.length === 0) return 'empty';
    
    for (let i = 0; i < content.length; i++) {
        const char = content.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Convert to positive hex string and take first 6 characters
    return Math.abs(hash).toString(16).substring(0, 6);
}

/**
 * Extracts attachments from a conversation and saves them as separate files
 * Creates a subdirectory for each conversation's attachments
 * 
 * @param {Object} conversation - Conversation object containing attachments
 * @param {string} conversationFileName - Base filename for the conversation (without extension)
 * @returns {Array} - Array of attachment info objects for markdown references
 */
function extractAttachments(conversation, conversationFileName) {
    const attachmentInfo = [];
    
    if (!conversation.chat_messages) return attachmentInfo;
    
    let hasAttachments = false;
    
    // First pass: check if there are any attachments
    conversation.chat_messages.forEach(message => {
        if (message.attachments && message.attachments.length > 0) {
            hasAttachments = true;
        }
    });
    
    if (!hasAttachments) return attachmentInfo;
    
    // Create attachment directory
    const attachmentDir = path.join(OUTPUT_DIR, `${conversationFileName}_attachments`);
    if (!fs.existsSync(attachmentDir)) {
        fs.mkdirSync(attachmentDir, { recursive: true });
    }
    
    // Track used filenames to handle collisions
    const usedFilenames = new Set();
    
    // Process each message's attachments
    conversation.chat_messages.forEach((message, messageIndex) => {
        if (message.attachments && message.attachments.length > 0) {
            message.attachments.forEach((attachment, attachmentIndex) => {
                try {
                    // Get original filename and content
                    const originalName = attachment.file_name || `attachment_${messageIndex}_${attachmentIndex}`;
                    const content = attachment.extracted_content || '';
                    const fileSize = attachment.file_size || content.length;
                    
                    // Preserve original extension, add one if missing
                    let fileName = originalName;
                    if (!path.extname(fileName) && attachment.file_type) {
                        // Map common MIME types to extensions
                        const extensionMap = {
                            'text/plain': '.txt',
                            'text/markdown': '.md',
                            'text/html': '.html',
                            'application/pdf': '.pdf',
                            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx'
                        };
                        const extension = extensionMap[attachment.file_type] || '.txt';
                        fileName += extension;
                    }
                    
                    // Handle filename collisions with content hash
                    let finalFileName = fileName;
                    if (usedFilenames.has(fileName)) {
                        const hash = generateContentHash(content);
                        const baseName = path.parse(fileName).name;
                        const extension = path.parse(fileName).ext;
                        finalFileName = `${baseName}_${hash}${extension}`;
                    }
                    usedFilenames.add(finalFileName);
                    
                    // Write attachment file
                    const attachmentPath = path.join(attachmentDir, finalFileName);
                    fs.writeFileSync(attachmentPath, content, 'utf8');
                    
                    // Store info for markdown reference
                    attachmentInfo.push({
                        originalName: originalName,
                        fileName: finalFileName,
                        relativePath: `./${conversationFileName}_attachments/${finalFileName}`,
                        fileSize: fileSize,
                        messageIndex: messageIndex + 1
                    });
                    
                } catch (error) {
                    console.log(`Warning: Error extracting attachment from message ${messageIndex + 1}: ${error.message}`);
                }
            });
        }
    });
    
    return attachmentInfo;
}

// ===== SCHEMA TRACKING FUNCTIONS =====
// These functions monitor changes in the JSON file structure over time

/**
 * Recursively collects all unique keys from the JSON structure
 * This helps us detect when Anthropic changes their export format
 * 
 * @param {Object} obj - Object to scan for keys
 * @param {string} prefix - Current path prefix for nested objects
 * @param {Set} keySet - Set to collect all found keys
 */
function collectKeys(obj, prefix = '', keySet = new Set()) {
    if (typeof obj !== 'object' || obj === null) return;
    
    // Handle arrays by examining their first element (if it exists)
    if (Array.isArray(obj)) {
        if (obj.length > 0) {
            collectKeys(obj[0], prefix, keySet);
        }
        return;
    }
    
    // Collect keys from the current object
    Object.keys(obj).forEach(key => {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        keySet.add(fullKey);
        
        // Recursively examine nested objects
        collectKeys(obj[key], fullKey, keySet);
    });
}

/**
 * Analyzes the JSON structure and compares it to previous runs
 * Alerts the user if the structure has changed significantly
 * 
 * @param {Array} conversations - Array of conversation objects to analyze
 */
function trackSchemaChanges(conversations) {
    console.log('Analyzing JSON structure...');
    
    // Collect all unique keys from the conversation data
    const currentKeys = new Set();
    conversations.forEach(conv => collectKeys(conv, '', currentKeys));
    
    const currentSchema = {
        keys: Array.from(currentKeys).sort(),    // Convert Set to sorted Array
        last_updated: new Date().toISOString(),
        total_conversations_analyzed: conversations.length,
        sample_conversation_keys: conversations.length > 0 ? Object.keys(conversations[0]).sort() : []
    };
    
    // Check if we have a previous schema to compare against
    let previousSchema = null;
    if (fs.existsSync(SCHEMA_FILE)) {
        try {
            const schemaData = fs.readFileSync(SCHEMA_FILE, 'utf8');
            previousSchema = JSON.parse(schemaData);
        } catch (error) {
            console.log('Warning: Could not read previous schema file:', error.message);
        }
    }
    
    // Compare schemas if we have a previous one
    if (previousSchema) {
        const oldKeys = new Set(previousSchema.keys);
        const newKeys = new Set(currentSchema.keys);
        
        // Find keys that were added or removed
        const addedKeys = [...newKeys].filter(key => !oldKeys.has(key));
        const removedKeys = [...oldKeys].filter(key => !newKeys.has(key));
        
        // Alert user to significant changes
        if (addedKeys.length > 0 || removedKeys.length > 0) {
            console.log('\n*** JSON STRUCTURE HAS CHANGED! ***');
            
            if (addedKeys.length > 0) {
                console.log('New keys found:');
                addedKeys.forEach(key => console.log(`   + ${key}`));
            }
            
            if (removedKeys.length > 0) {
                console.log('Keys no longer present:');
                removedKeys.forEach(key => console.log(`   - ${key}`));
            }
            
            console.log('\nThis might mean:');
            console.log('   - Anthropic added new features (like model version info!)');
            console.log('   - The export format changed');
            console.log('   - This script might need updates\n');
        } else {
            console.log('JSON structure unchanged since last run');
        }
    } else {
        console.log('First run - saving current JSON structure for future comparison');
    }
    
    // Save the current schema for next time
    try {
        fs.writeFileSync(SCHEMA_FILE, JSON.stringify(currentSchema, null, 2));
        console.log(`Schema saved to ${SCHEMA_FILE}`);
    } catch (error) {
        console.log('Warning: Could not save schema file:', error.message);
    }
}

// ===== MARKDOWN CONVERSION FUNCTIONS =====
// These functions handle the actual conversion from JSON to Markdown

/**
 * Converts a single conversation object into a formatted Markdown string
 * This is the core function that transforms Claude's JSON into readable archives
 * 
 * @param {Object} conversation - A single conversation object from the JSON
 * @param {number} index - Index of conversation (for fallback naming)
 * @returns {Object} - Object containing markdown content and filename info
 */
function convertConversationToMarkdown(conversation, index) {
    // Extract basic conversation metadata
    const title = conversation.name || `Conversation_${index + 1}`;
    const sanitizedTitle = sanitizeTitle(title);
    const conversationId = conversation.uuid;
    const createdDate = formatDateWithDay(conversation.created_at);
    const updatedDate = formatDateWithDay(conversation.updated_at);
    const messageCount = conversation.chat_messages ? conversation.chat_messages.length : 0;
    const archiveDate = formatDateWithDay(new Date().toISOString());
    
    // Generate filename with dual-date pattern
    const createdDateShort = conversation.created_at ? 
        formatShortDate(conversation.created_at) : 'unknown-date';
    const modifiedDateShort = conversation.updated_at ? 
        formatShortDate(conversation.updated_at) : createdDateShort;
    
    // Base filename with creation and modification dates
    let filename = `${createdDateShort}_${sanitizedTitle}_${modifiedDateShort}.md`;
    let conversationFileName = `${createdDateShort}_${sanitizedTitle}_${modifiedDateShort}`;
    
    // Handle same-day conflicts with ISO 8601 time disambiguation
    const filepath = path.join(OUTPUT_DIR, filename);
    if (fs.existsSync(filepath)) {
        const timestamp = new Date().toISOString().slice(11, 16).replace(':', '');
        filename = `${createdDateShort}_${sanitizedTitle}_${modifiedDateShort}T${timestamp}.md`;
        conversationFileName = `${createdDateShort}_${sanitizedTitle}_${modifiedDateShort}T${timestamp}`;
    }
    
    // Extract attachments before building markdown
    const attachments = extractAttachments(conversation, conversationFileName);
    
    // Start building the Markdown content
    let markdown = `Title: Archived AI conversation\n`;
    markdown += `Conversation name: "${title}"\n`;
    markdown += `Conversation began: ${createdDate}\n`;
    markdown += `Conversation last updated: ${updatedDate}\n`;
    markdown += `Conversation URL: https://claude.ai/chat/${conversationId}\n`;
    markdown += `Conversation ID: ${conversationId}\n`;
    markdown += `Total messages in conversation: ${messageCount}\n`;
    markdown += `AI model: Claude (version unknown)\n`;
    markdown += `Archive file creation date: ${archiveDate}\n\n`;
    markdown += `---\n\n`;
    
    // Process each message in the conversation
    if (conversation.chat_messages && conversation.chat_messages.length > 0) {
        conversation.chat_messages.forEach((message, index) => {
            const messageNumber = index + 1;
            const isHuman = message.sender === 'human';
            const senderIcon = isHuman ? '👤' : '🤖';
            const senderName = isHuman ? 'Human' : 'Assistant';
            const timestamp = formatLocalTime(message.created_at);
            
            // Extract the message text (handle both old 'text' field and new 'content' array)
            const messageText = extractTextFromContent(message.content) || message.text || '';
            
            // Create the message header with emoji and footnote reference
            markdown += `# ${senderIcon} ${senderName} [^${messageNumber}]\n\n`;
            
            // Add the message content
            markdown += `${messageText}\n\n`;
            
            // Add attachment references for this message
            const messageAttachments = attachments.filter(att => att.messageIndex === messageNumber);
            if (messageAttachments.length > 0) {
                markdown += `**Attachments:**\n`;
                messageAttachments.forEach(att => {
                    const sizeFormatted = att.fileSize ? `(${Math.round(att.fileSize / 1024 * 10) / 10} KB)` : '';
                    markdown += `- [${att.originalName}](${att.relativePath}) ${sizeFormatted}\n`;
                });
                markdown += `\n`;
            }
            
            // Create the footnote with timestamp and message number
            markdown += `[^${messageNumber}]: *${timestamp}, Message ${messageNumber}*\n\n`;
        });
    } else {
        // Handle edge case of conversations with no messages
        markdown += `*No messages found in this conversation.*\n\n`;
    }
    
    // Add the footer with disclaimer about timezone conversion and file portability
    markdown += `---\n\n`;
    markdown += `**End of Conversation**\n\n`;
    markdown += `*This conversation was exported from Claude.ai and converted to Markdown for archival purposes. `;
    markdown += `Time zones reflect the system settings where this archive was created and may differ from `;
    markdown += `where the original conversation occurred. Refer to UTC times for precision.*\n\n`;
    
    if (attachments.length > 0) {
        markdown += `*Note: This conversation includes ${attachments.length} attachment(s) in the companion folder. `;
        markdown += `Keep the markdown file and attachment folder together when moving or sharing this archive.*\n`;
    }
    
    return {
        content: markdown,
        filename: filename,
        attachmentCount: attachments.length
    };
}

// ===== MAIN PROCESSING FUNCTION =====
// This is the primary function that orchestrates the entire conversion process

/**
 * Main function that handles the complete conversion process
 * Reads the JSON file, processes all conversations, and creates Markdown files
 */
function main() {
    console.log('Claude Conversations Converter Starting...\n');
    
    try {
        // Step 1: Read and parse the JSON file
        console.log(`Reading ${INPUT_FILE}...`);
        
        // Check if the input file exists before trying to read it
        if (!fs.existsSync(INPUT_FILE)) {
            throw new Error(`Input file "${INPUT_FILE}" not found. Please ensure the file exists in the current directory.`);
        }
        
        const jsonData = fs.readFileSync(INPUT_FILE, 'utf8');
        const conversations = JSON.parse(jsonData);
        
        // Validate that we got an array of conversations
        if (!Array.isArray(conversations)) {
            throw new Error('JSON file does not contain an array of conversations. Please check the file format.');
        }
        
        console.log(`Found ${conversations.length} conversations`);
        
        // Step 2: Analyze the JSON structure for changes
        trackSchemaChanges(conversations);
        
        // Step 3: Create the output directory if it doesn't exist
        if (!fs.existsSync(OUTPUT_DIR)) {
            fs.mkdirSync(OUTPUT_DIR);
            console.log(`Created output directory: ${OUTPUT_DIR}`);
        }
        
        // Step 4: Process each conversation
        console.log('\nConverting conversations...');
        let successCount = 0;
        let errorCount = 0;
        let totalAttachments = 0;
        
        conversations.forEach((conversation, index) => {
            try {
                // Convert this conversation to Markdown
                const result = convertConversationToMarkdown(conversation, index);
                
                // Write the Markdown file
                const filepath = path.join(OUTPUT_DIR, result.filename);
                fs.writeFileSync(filepath, result.content, 'utf8');
                
                // Track statistics
                successCount++;
                totalAttachments += result.attachmentCount;
                
                // Log with attachment info if present
                const attachmentNote = result.attachmentCount > 0 ? ` (${result.attachmentCount} attachments)` : '';
                console.log(`✓ ${result.filename}${attachmentNote}`);
                
            } catch (error) {
                console.log(`✗ Error processing conversation ${index + 1}: ${error.message}`);
                errorCount++;
            }
        });
        
        // Step 5: Report final results
        console.log('\nConversion Summary:');
        console.log(`   Successfully converted: ${successCount} conversations`);
        console.log(`   Extracted attachments: ${totalAttachments} files`);
        if (errorCount > 0) {
            console.log(`   Failed to convert: ${errorCount} conversations`);
        }
        console.log(`   Output directory: ${OUTPUT_DIR}`);
        console.log(`   Schema tracking: ${SCHEMA_FILE}`);
        
        console.log('\nConversion complete!');
        
    } catch (error) {
        // Handle any major errors that prevent the script from running
        console.error('Fatal error:', error.message);
        console.log('\nUsage Instructions:');
        console.log('1. Place your exported conversations.json file in the same directory as this script');
        console.log('2. Run the script: node convert_conversations.js');
        console.log('3. Find your converted files in the output directory');
        console.log('\nTroubleshooting:');
        console.log('- Ensure conversations.json is valid JSON');
        console.log('- Check file permissions in the current directory');
        console.log('- Make sure you have Node.js installed');
        
        // Exit with error code to indicate failure
        process.exit(1);
    }
}

// ===== SCRIPT EXECUTION =====
// Only run the main function if this script is executed directly (not imported)

if (require.main === module) {
    main();
}