# Book Master User Guide

## Table of Contents
- [Getting Started](#getting-started)
- [Creating Your First Book](#creating-your-first-book)
- [Writing and Editing](#writing-and-editing)
- [British English Spell Checking](#british-english-spell-checking)
- [Managing Chapters](#managing-chapters)
- [Advanced Features](#advanced-features)
- [Exporting Your Work](#exporting-your-work)
- [Troubleshooting](#troubleshooting)

---

## Getting Started

### Accessing Book Master

Once installed on your Raspberry Pi 5, access Book Master through your web browser:

- **Local access**: http://localhost
- **Network access**: http://192.168.1.123 (or your Pi's IP address)
- **Direct frontend**: http://192.168.1.123:5173
- **API access**: http://192.168.1.123:8000

### System Requirements

**Minimum Requirements**:
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection for initial setup
- 1GB available storage space

**Recommended**:
- Desktop or laptop computer for comfortable editing
- 4GB+ RAM on Raspberry Pi 5
- Ethernet connection for best performance

---

## Creating Your First Book

### Step 1: Create a New Book

1. **Click "New Book"** in the sidebar
2. **Enter book details**:
   - **Title**: Your book's title (required)
   - **Author**: Author name (required)
   - **Description**: Brief description (optional)
3. **Click "Create"** to save your book

### Step 2: Add Your First Chapter

1. **Select your book** from the sidebar
2. **Click "New Chapter"**
3. **Enter chapter title** (e.g., "Chapter 1: Introduction")
4. **Click "Create Chapter"**
5. Your chapter will appear in the chapter list

---

## Writing and Editing

### The Text Editor

Book Master provides a professional writing environment with:

- **Large editing area** for comfortable writing
- **Word and character counts** displayed in real-time
- **Professional fonts** optimised for long writing sessions
- **Autosave functionality** every 30 seconds

### Keyboard Shortcuts

Master these shortcuts for efficient writing:

- **Ctrl + S**: Manual save
- **Ctrl + B**: Bold text formatting
- **Ctrl + I**: Italic text formatting
- **Ctrl + U**: Underline text
- **Ctrl + M**: Toggle markdown preview
- **Ctrl + Z**: Undo
- **Ctrl + Y**: Redo

### Font Selection

1. **Click the font selector** in the editor toolbar
2. **Choose from professional fonts**:
   - Georgia (default) - excellent for long text
   - Times New Roman - classic serif
   - Arial - clean sans-serif
   - Verdana - highly readable
3. Your choice is **automatically saved** for future sessions

---

## British English Spell Checking

### How It Works

Book Master includes a comprehensive British English dictionary with:
- **50,000+ words** in British English spelling
- **Real-time detection** of spelling errors
- **Red wavy underlines** for misspelt words
- **Automatic US to UK suggestions** (color → colour)

### Using Spell Check

1. **Type normally** - errors are highlighted automatically
2. **Right-click on underlined words** to see suggestions
3. **Select a correction** from the dropdown menu
4. **Add to custom dictionary** for industry-specific terms

### Managing the Custom Dictionary

1. **Click "Dictionary"** in the sidebar
2. **Add new terms**:
   - Enter the word
   - Select a category (proper noun, technical term, etc.)
   - Click "Add Term"
3. **Manage existing terms**:
   - Edit or delete terms as needed
   - Toggle terms active/inactive

---

## Managing Chapters

### Chapter Organization

- **Chapters are numbered automatically** (1, 2, 3, etc.)
- **Reorder chapters** by dragging or using reorder tools
- **Chapter statistics** show word count, reading time, and more

### Navigation Between Chapters

- **Click chapter titles** in the sidebar to switch
- **Unsaved changes** are protected with a confirmation dialog
- **Previous work is preserved** when switching chapters

### Chapter Settings

Each chapter displays:
- **Word count** and **character count**
- **Estimated reading time** (based on 200 words/minute)
- **Creation and modification dates**
- **Chapter number** (automatically assigned)

---

## Advanced Features

### Global Scratchpad

The scratchpad is perfect for:
- **Plot notes** and character development
- **Research snippets** and references
- **Ideas** that don't fit in specific chapters

**Access**: Click "Scratchpad" in the sidebar
**Persistence**: Notes survive application restarts and are available across all books

### Memory Management (Large Documents)

Book Master automatically handles large documents:
- **Automatic pagination** at ~2000 words (8000 characters)
- **Smart splitting** at paragraph boundaries
- **Memory cleanup** for optimal performance
- **Seamless navigation** between pages

### Preferences

Customise your editing experience:
1. **Click your profile** or settings icon
2. **Adjust preferences**:
   - Autosave interval (default: 30 seconds)
   - Editor theme (light/dark)
   - Word wrap settings
   - Line number display

---

## Exporting Your Work

### Export Formats

Book Master supports two export formats:

1. **Plain Text (.txt)**:
   - Universal compatibility
   - Clean, readable format
   - Perfect for submissions

2. **Markdown (.md)**:
   - Formatted text with structure
   - Compatible with publishing tools
   - Maintains formatting information

### How to Export

1. **Select your book** from the sidebar
2. **Click "Export"** button
3. **Choose format** (TXT or Markdown)
4. **Click "Download"**
5. Your file will download automatically

### Export Contents

Exported files include:
- **Book title and author**
- **Book statistics** (word count, chapter count, creation date)
- **All chapters** in order with titles
- **Professional formatting** with clear chapter separations

---

## Troubleshooting

### Common Issues

**Problem**: Page won't load
- **Solution**: Check your network connection and try refreshing

**Problem**: Changes aren't saving
- **Solution**: Check the autosave indicator; manually save with Ctrl+S

**Problem**: Spell check not working
- **Solution**: Verify British English dictionary is enabled in settings

**Problem**: Slow performance with large documents
- **Solution**: Book Master automatically paginates; ensure you have adequate RAM

### Performance Tips

1. **Close unused browser tabs** to free memory
2. **Use Ethernet connection** for best performance
3. **Regular exports** as backups
4. **Clear browser cache** occasionally

### Getting Help

**System Information**:
- Check system status: http://192.168.1.123:8000/health
- View API documentation: http://192.168.1.123:8000/api

**Technical Support**:
- Check installation logs: `/var/log/book-master/`
- Verify services: `sudo systemctl status book-master-backend book-master-frontend`
- Restart services: `sudo systemctl restart book-master-backend book-master-frontend`

---

## Best Practices

### Writing Workflow

1. **Create book structure** first (title, basic chapter outline)
2. **Write in focused sessions** using the autosave feature
3. **Use the scratchpad** for notes and ideas
4. **Regular exports** to maintain backups
5. **Take advantage of spell checking** for professional results

### Data Management

- **Regular backups**: Export your work frequently
- **Custom dictionary**: Build your personal/professional dictionary
- **Organised chapters**: Use descriptive chapter titles
- **Scratchpad notes**: Keep research and ideas in the scratchpad

### Performance

- **One book at a time**: Focus on one book per session for best performance
- **Chapter length**: Keep chapters at reasonable lengths (< 5000 words for best performance)
- **Regular saves**: Use Ctrl+S periodically in addition to autosave

---

## Advanced Tips

### Markdown Features

When using markdown preview (Ctrl+M):
- **Headers**: Use # for chapter titles, ## for sections
- **Emphasis**: *italic* and **bold** formatting
- **Lists**: - for bullet points, 1. for numbered lists
- **Line breaks**: Double space for line breaks

### Professional Writing

- **Consistent formatting**: Use the spell checker's British English suggestions
- **Word targets**: Monitor word counts for consistent chapter lengths
- **Export regularly**: Keep multiple versions as you write
- **Use categories**: Organise custom dictionary terms by type

---

**Book Master v1.0.0** - Professional British English Book Editing Application

For additional support, refer to the main README.md or contact your system administrator.