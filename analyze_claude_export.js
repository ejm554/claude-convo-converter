#!/usr/bin/env node
/**
 * Claude Export Analyzer
 * 
 * DESCRIPTION: Analyzes exported Claude conversation JSON files to understand structure, content, and conversion opportunities.
 * AUTHOR: EJ Makela
 * ORIGINAL CREATION DATE: 2025-09-23
 * CREDIT: Assistance provided by Claude, Sonnet 4 (https://claude.ai/chat/[current-conversation-id])
 */

// Import required Node.js modules
const fs = require('fs');           // File system operations for reading files
const path = require('path');       // Path utilities for file handling

// ===== CONFIGURATION SECTION =====
const OUTPUT_REPORT = 'claude_export_analysis.json';  // Detailed JSON report filename

// ===== UTILITY FUNCTIONS =====

/**
 * Safely gets nested object properties without throwing errors
 * @param {Object} obj - Object to traverse
 * @param {string} path - Dot-notation path (e.g., 'user.profile.name')
 * @param {*} defaultValue - Value to return if path doesn't exist
 * @returns {*} - Value at path or default value
 */
function getNestedProperty(obj, path, defaultValue = null) {
    return path.split('.').reduce((current, key) => {
        return (current && current[key] !== undefined) ? current[key] : defaultValue;
    }, obj);
}

/**
 * Formats file sizes in human-readable format
 * @param {number} bytes - Size in bytes
 * @returns {string} - Formatted size (e.g., "1.2 MB")
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Extracts unique values from an array and counts their frequency
 * @param {Array} array - Array to analyze
 * @returns {Object} - Object with unique values as keys and counts as values
 */
function getFrequencyMap(array) {
    return array.reduce((acc, item) => {
        acc[item] = (acc[item] || 0) + 1;
        return acc;
    }, {});
}

// ===== ANALYSIS FUNCTIONS =====

/**
 * Analyzes the overall structure and metadata of the export
 * @param {Array} conversations - Array of conversation objects
 * @returns {Object} - Basic statistics about the export
 */
function analyzeBasicStructure(conversations) {
    console.log('📊 Analyzing basic export structure...');
    
    const totalConversations = conversations.length;
    const totalMessages = conversations.reduce((sum, conv) => {
        return sum + (conv.chat_messages ? conv.chat_messages.length : 0);
    }, 0);
    
    // Date range analysis
    const allDates = conversations
        .map(conv => conv.created_at)
        .filter(date => date)
        .sort();
    
    const dateRange = allDates.length > 0 ? {
        earliest: allDates[0],
        latest: allDates[allDates.length - 1],
        span_days: Math.ceil((new Date(allDates[allDates.length - 1]) - new Date(allDates[0])) / (1000 * 60 * 60 * 24))
    } : null;
    
    // Conversation title analysis
    const namedConversations = conversations.filter(conv => conv.name && conv.name.trim()).length;
    const unnamedConversations = totalConversations - namedConversations;
    
    return {
        total_conversations: totalConversations,
        total_messages: totalMessages,
        avg_messages_per_conversation: totalMessages > 0 ? (totalMessages / totalConversations).toFixed(1) : 0,
        date_range: dateRange,
        named_conversations: namedConversations,
        unnamed_conversations: unnamedConversations,
        conversations_with_summary: conversations.filter(conv => conv.summary && conv.summary.trim()).length
    };
}

/**
 * Deep analysis of attachment metadata and structure
 * @param {Array} conversations - Array of conversation objects
 * @returns {Object} - Detailed attachment analysis
 */
function analyzeAttachments(conversations) {
    console.log('📎 Analyzing attachments...');
    
    let totalAttachments = 0;
    let conversationsWithAttachments = 0;
    let messagesWithAttachments = 0;
    const attachmentTypes = [];
    const attachmentSizes = [];
    const attachmentSamples = [];
    
    conversations.forEach(conv => {
        let convHasAttachments = false;
        
        if (conv.chat_messages) {
            conv.chat_messages.forEach(message => {
                if (message.attachments && message.attachments.length > 0) {
                    convHasAttachments = true;
                    messagesWithAttachments++;
                    totalAttachments += message.attachments.length;
                    
                    // Analyze each attachment
                    message.attachments.forEach(attachment => {
                        // Collect samples for detailed analysis
                        if (attachmentSamples.length < 10) {
                            attachmentSamples.push({
                                conversation_name: conv.name || 'Untitled',
                                message_sender: message.sender,
                                attachment_structure: Object.keys(attachment),
                                attachment_data: attachment
                            });
                        }
                        
                        // Extract attachment metadata
                        if (attachment.file_type || attachment.type) {
                            attachmentTypes.push(attachment.file_type || attachment.type);
                        }
                        if (attachment.file_size || attachment.size) {
                            attachmentSizes.push(attachment.file_size || attachment.size);
                        }
                    });
                }
            });
        }
        
        if (convHasAttachments) {
            conversationsWithAttachments++;
        }
    });
    
    return {
        total_attachments: totalAttachments,
        conversations_with_attachments: conversationsWithAttachments,
        messages_with_attachments: messagesWithAttachments,
        attachment_types: getFrequencyMap(attachmentTypes),
        attachment_sizes: {
            count: attachmentSizes.length,
            total_bytes: attachmentSizes.reduce((sum, size) => sum + (size || 0), 0),
            avg_size: attachmentSizes.length > 0 ? attachmentSizes.reduce((sum, size) => sum + (size || 0), 0) / attachmentSizes.length : 0
        },
        sample_attachments: attachmentSamples
    };
}

/**
 * Analyzes artifact content and metadata
 * @param {Array} conversations - Array of conversation objects  
 * @returns {Object} - Detailed artifact analysis
 */
function analyzeArtifacts(conversations) {
    console.log('🛠️ Analyzing artifacts and content structure...');
    
    let artifactIndicators = 0;
    let codeBlocks = 0;
    let longContentBlocks = 0;
    const contentTypes = [];
    const artifactSamples = [];
    
    conversations.forEach(conv => {
        if (conv.chat_messages) {
            conv.chat_messages.forEach(message => {
                // Analyze content structure
                if (message.content && Array.isArray(message.content)) {
                    message.content.forEach(contentItem => {
                        if (contentItem.type) {
                            contentTypes.push(contentItem.type);
                        }
                        
                        // Look for potential artifacts
                        if (contentItem.type === 'text' && contentItem.text) {
                            const text = contentItem.text;
                            
                            // Count code blocks (potential artifacts)
                            const codeBlockMatches = text.match(/```[\s\S]*?```/g);
                            if (codeBlockMatches) {
                                codeBlocks += codeBlockMatches.length;
                            }
                            
                            // Count long content (potential artifacts)
                            if (text.length > 1000) {
                                longContentBlocks++;
                            }
                            
                            // Look for artifact-like patterns
                            if (text.includes('```') || text.includes('<') || text.length > 500) {
                                artifactIndicators++;
                                
                                if (artifactSamples.length < 5) {
                                    artifactSamples.push({
                                        conversation_name: conv.name || 'Untitled',
                                        message_sender: message.sender,
                                        content_length: text.length,
                                        has_code_blocks: !!codeBlockMatches,
                                        text_preview: text.substring(0, 200) + (text.length > 200 ? '...' : '')
                                    });
                                }
                            }
                        }
                    });
                }
                
                // Also check the old 'text' field for backward compatibility
                if (message.text && typeof message.text === 'string') {
                    const text = message.text;
                    const codeBlockMatches = text.match(/```[\s\S]*?```/g);
                    if (codeBlockMatches) {
                        codeBlocks += codeBlockMatches.length;
                    }
                    if (text.length > 1000) {
                        longContentBlocks++;
                    }
                }
            });
        }
    });
    
    return {
        potential_artifacts: artifactIndicators,
        code_blocks_found: codeBlocks,
        long_content_blocks: longContentBlocks,
        content_types: getFrequencyMap(contentTypes),
        sample_artifacts: artifactSamples
    };
}

/**
 * Analyzes the JSON schema structure and identifies all available fields
 * @param {Array} conversations - Array of conversation objects
 * @returns {Object} - Complete schema analysis
 */
function analyzeSchema(conversations) {
    console.log('🔍 Analyzing JSON schema structure...');
    
    const conversationFields = new Set();
    const messageFields = new Set();
    const contentFields = new Set();
    const attachmentFields = new Set();
    const accountFields = new Set();
    
    conversations.forEach(conv => {
        // Conversation-level fields
        Object.keys(conv).forEach(key => conversationFields.add(key));
        
        // Account fields
        if (conv.account) {
            Object.keys(conv.account).forEach(key => accountFields.add(`account.${key}`));
        }
        
        // Message-level fields
        if (conv.chat_messages) {
            conv.chat_messages.forEach(message => {
                Object.keys(message).forEach(key => messageFields.add(key));
                
                // Content structure fields
                if (message.content && Array.isArray(message.content)) {
                    message.content.forEach(contentItem => {
                        Object.keys(contentItem).forEach(key => contentFields.add(`content.${key}`));
                    });
                }
                
                // Attachment fields
                if (message.attachments && Array.isArray(message.attachments)) {
                    message.attachments.forEach(attachment => {
                        Object.keys(attachment).forEach(key => attachmentFields.add(`attachments.${key}`));
                    });
                }
            });
        }
    });
    
    return {
        conversation_fields: Array.from(conversationFields).sort(),
        message_fields: Array.from(messageFields).sort(),
        content_fields: Array.from(contentFields).sort(),
        attachment_fields: Array.from(attachmentFields).sort(),
        account_fields: Array.from(accountFields).sort(),
        total_unique_fields: conversationFields.size + messageFields.size + contentFields.size + attachmentFields.size + accountFields.size
    };
}

/**
 * Generates conversion readiness assessment
 * @param {Object} analysisResults - Combined results from all analysis functions
 * @returns {Object} - Assessment of what can/cannot be converted
 */
function assessConversionReadiness(analysisResults) {
    console.log('✅ Assessing conversion readiness...');
    
    const issues = [];
    const opportunities = [];
    const recommendations = [];
    
    // Check for potential issues
    if (analysisResults.attachments.total_attachments > 0) {
        issues.push(`${analysisResults.attachments.total_attachments} attachments found - file contents likely not preserved in export`);
        recommendations.push('Consider noting attachment metadata in converted files');
    }
    
    if (analysisResults.artifacts.code_blocks_found > 0) {
        opportunities.push(`${analysisResults.artifacts.code_blocks_found} code blocks found - could be preserved as-is in markdown`);
    }
    
    if (analysisResults.basic.unnamed_conversations > 0) {
        issues.push(`${analysisResults.basic.unnamed_conversations} conversations without titles - will get generic filenames`);
        recommendations.push('Consider adding conversation summaries to filename generation');
    }
    
    // Check for schema completeness
    if (analysisResults.schema.content_fields.length > 1) {
        opportunities.push('Rich content structure detected - good preservation potential');
    }
    
    return {
        conversion_feasibility: 'HIGH',
        potential_issues: issues,
        opportunities: opportunities,
        recommendations: recommendations,
        estimated_output_files: analysisResults.basic.total_conversations,
        estimated_total_size: 'Cannot estimate without content analysis'
    };
}

// ===== MAIN ANALYSIS FUNCTION =====

/**
 * Main analysis function that orchestrates all analysis tasks
 * @param {string} jsonFilePath - Path to the conversations JSON file
 */
function analyzeClaudeExport(jsonFilePath) {
    console.log('🔄 Claude Export Analyzer Starting...\n');
    
    try {
        // Validate input file
        if (!fs.existsSync(jsonFilePath)) {
            throw new Error(`File not found: ${jsonFilePath}`);
        }
        
        // Get file info
        const fileStats = fs.statSync(jsonFilePath);
        console.log(`📁 Analyzing file: ${jsonFilePath}`);
        console.log(`📏 File size: ${formatFileSize(fileStats.size)}\n`);
        
        // Read and parse JSON
        console.log('📖 Reading JSON file...');
        const jsonData = fs.readFileSync(jsonFilePath, 'utf8');
        
        console.log('🔧 Parsing JSON...');
        const conversations = JSON.parse(jsonData);
        
        if (!Array.isArray(conversations)) {
            throw new Error('JSON file does not contain an array of conversations');
        }
        
        console.log(`✅ Successfully loaded ${conversations.length} conversations\n`);
        
        // Run all analysis functions
        const analysisResults = {
            file_info: {
                path: jsonFilePath,
                size_bytes: fileStats.size,
                size_formatted: formatFileSize(fileStats.size),
                analyzed_at: new Date().toISOString()
            },
            basic: analyzeBasicStructure(conversations),
            attachments: analyzeAttachments(conversations),
            artifacts: analyzeArtifacts(conversations),
            schema: analyzeSchema(conversations)
        };
        
        // Add conversion assessment
        analysisResults.conversion_assessment = assessConversionReadiness(analysisResults);
        
        // Generate console report
        generateConsoleReport(analysisResults);
        
        // Save detailed JSON report
        fs.writeFileSync(OUTPUT_REPORT, JSON.stringify(analysisResults, null, 2));
        console.log(`\n💾 Detailed analysis saved to: ${OUTPUT_REPORT}`);
        
        console.log('\n🎉 Analysis complete!');
        
    } catch (error) {
        console.error('💥 Analysis failed:', error.message);
        
        if (error.message.includes('JSON')) {
            console.log('\n🔧 Troubleshooting:');
            console.log('• Verify the file is valid JSON');
            console.log('• Check for file corruption');
            console.log('• Ensure the file is a Claude conversation export');
        }
        
        process.exit(1);
    }
}

/**
 * Generates a human-readable console report
 * @param {Object} results - Analysis results object
 */
function generateConsoleReport(results) {
    console.log('\n' + '='.repeat(60));
    console.log('📋 CLAUDE EXPORT ANALYSIS REPORT');
    console.log('='.repeat(60));
    
    // Basic Statistics
    console.log('\n📊 BASIC STATISTICS:');
    console.log(`   Conversations: ${results.basic.total_conversations}`);
    console.log(`   Total Messages: ${results.basic.total_messages}`);
    console.log(`   Avg Messages/Conversation: ${results.basic.avg_messages_per_conversation}`);
    console.log(`   Named Conversations: ${results.basic.named_conversations}`);
    console.log(`   Unnamed Conversations: ${results.basic.unnamed_conversations}`);
    
    if (results.basic.date_range) {
        console.log(`   Date Range: ${results.basic.date_range.earliest} to ${results.basic.date_range.latest}`);
        console.log(`   Span: ${results.basic.date_range.span_days} days`);
    }
    
    // Attachments
    console.log('\n📎 ATTACHMENTS:');
    console.log(`   Total Attachments: ${results.attachments.total_attachments}`);
    console.log(`   Conversations with Attachments: ${results.attachments.conversations_with_attachments}`);
    console.log(`   Messages with Attachments: ${results.attachments.messages_with_attachments}`);
    
    if (Object.keys(results.attachments.attachment_types).length > 0) {
        console.log('   Attachment Types:');
        Object.entries(results.attachments.attachment_types).forEach(([type, count]) => {
            console.log(`     ${type}: ${count}`);
        });
    }
    
    // Artifacts
    console.log('\n🛠️  ARTIFACTS & CONTENT:');
    console.log(`   Potential Artifacts: ${results.artifacts.potential_artifacts}`);
    console.log(`   Code Blocks: ${results.artifacts.code_blocks_found}`);
    console.log(`   Long Content Blocks: ${results.artifacts.long_content_blocks}`);
    
    if (Object.keys(results.artifacts.content_types).length > 0) {
        console.log('   Content Types:');
        Object.entries(results.artifacts.content_types).forEach(([type, count]) => {
            console.log(`     ${type}: ${count}`);
        });
    }
    
    // Schema
    console.log('\n🔍 SCHEMA ANALYSIS:');
    console.log(`   Conversation Fields: ${results.schema.conversation_fields.length}`);
    console.log(`   Message Fields: ${results.schema.message_fields.length}`);
    console.log(`   Content Fields: ${results.schema.content_fields.length}`);
    console.log(`   Attachment Fields: ${results.schema.attachment_fields.length}`);
    console.log(`   Total Unique Fields: ${results.schema.total_unique_fields}`);
    
    // Conversion Assessment
    console.log('\n✅ CONVERSION READINESS:');
    console.log(`   Feasibility: ${results.conversion_assessment.conversion_feasibility}`);
    console.log(`   Estimated Output Files: ${results.conversion_assessment.estimated_output_files}`);
    
    if (results.conversion_assessment.potential_issues.length > 0) {
        console.log('   Potential Issues:');
        results.conversion_assessment.potential_issues.forEach(issue => {
            console.log(`     ⚠️  ${issue}`);
        });
    }
    
    if (results.conversion_assessment.opportunities.length > 0) {
        console.log('   Opportunities:');
        results.conversion_assessment.opportunities.forEach(opp => {
            console.log(`     💡 ${opp}`);
        });
    }
    
    if (results.conversion_assessment.recommendations.length > 0) {
        console.log('   Recommendations:');
        results.conversion_assessment.recommendations.forEach(rec => {
            console.log(`     🔧 ${rec}`);
        });
    }
}

// ===== SCRIPT EXECUTION =====

/**
 * Main entry point - handles command line arguments and starts analysis
 */
function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('Claude Export Analyzer');
        console.log('Usage: node analyze_claude_export.js <conversations.json>');
        console.log('');
        console.log('Examples:');
        console.log('  node analyze_claude_export.js conversations.json');
        console.log('  node analyze_claude_export.js /path/to/my_export.json');
        console.log('');
        console.log('This tool analyzes Claude conversation exports to understand');
        console.log('their structure, content, and conversion opportunities.');
        process.exit(1);
    }
    
    const jsonFilePath = args[0];
    analyzeClaudeExport(jsonFilePath);
}

// Only run if this script is executed directly
if (require.main === module) {
    main();
}