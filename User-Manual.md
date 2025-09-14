# Book Master User Manual

## Table of Contents
- [Getting Started](#getting-started)
- [Creating Your First Book](#creating-your-first-book)
- [Writing and Editing](#writing-and-editing)
- [British English Spell Checking](#british-english-spell-checking)
- [Managing Chapters](#managing-chapters)
- [Advanced Features](#advanced-features)
- [Exporting Your Work](#exporting-your-work)
- [Customisation](#customisation)
- [Troubleshooting](#troubleshooting)
- [Tips and Best Practices](#tips-and-best-practices)

---

## Getting Started

### Accessing Book Master

Once installed on your system, access Book Master through your web browser:

**For Docker deployment:**
- **Local access**: http://localhost:5173
- **Network access**: http://[your-server-ip]:5173
- **Backend API**: http://[your-server-ip]:8000

**For Raspberry Pi deployment:**
- **Local access**: http://192.168.1.123:5173
- **Direct access**: http://192.168.1.123 (if configured with reverse proxy)

### System Requirements

**Minimum Requirements**:
- Modern web browser (Chrome 88+, Firefox 85+, Safari 14+, Edge 88+)
- Internet connection for initial setup
- 2GB RAM minimum (4GB recommended for large documents)
- JavaScript enabled

**Recommended for Best Performance**:
- Chrome or Firefox browsers
- High-speed internet connection
- 8GB RAM for handling multiple large books
- Desktop or laptop computer for extensive writing

### First Time Setup

1. **Open your web browser** and navigate to the Book Master URL
2. **Allow notifications** if prompted (for autosave alerts)
3. **The application will automatically create** necessary data structures
4. **You'll see the Dashboard** with no books initially

---

## Creating Your First Book

### Starting a New Book

1. **Click the "New Book" button** in the sidebar or on the Dashboard
2. **Fill in the book details**:
   - **Title**: Your book's title (required)
   - **Author**: Author name (required)
   - **Genre**: Optional categorisation
   - **Description**: Brief summary of your book

3. **Click "Create Book"** to save your new project

### Understanding the Interface

**Dashboard View**:
- **Book Cards**: Visual representation of your books
- **Statistics**: Word count, chapter count, last modified
- **Quick Actions**: Edit, view chapters, export options

**Navigation Elements**:
- **Sidebar**: Always-visible navigation and book management
- **Top Bar**: Autosave controls, save options, scratchpad access
- **Main Content**: Your primary working area

---

## Writing and Editing

### The Editor Interface

#### Accessing the Editor
1. **Select a book** from the Dashboard or sidebar
2. **Click "Editor"** in the sidebar navigation
3. **Choose a chapter** or create a new one

#### Editor Features

**Main Editor Area**:
- Large text editing field optimised for long-form writing
- Real-time word and character counting
- Automatic spell checking with British English dictionary
- Clean, distraction-free interface

**Editor Controls**:
- **Font Selection**: Choose from curated professional fonts
- **Autosave Toggle**: Enable/disable 30-second automatic saving
- **Save Button**: Manual save with format selection
- **Scratchpad Button**: Access global notes

### Keyboard Shortcuts

**Text Formatting**:
- `Ctrl + B` - Bold text
- `Ctrl + I` - Italic text
- `Ctrl + U` - Underline text
- `Ctrl + S` - Save current work

**Editor Navigation**:
- `Ctrl + M` - Toggle Markdown preview
- `Page Up/Down` - Navigate between pages (for large documents)
- `Ctrl + Home` - Jump to document beginning
- `Ctrl + End` - Jump to document end
- `Esc` - Close modal dialogs

### Autosave and Save Protection

**Autosave Features**:
- Automatically saves every 30 seconds when content changes
- Visual indicator shows autosave status
- Can be toggled on/off as needed

**Unsaved Changes Protection**:
- Warning modal appears when trying to navigate away with unsaved changes
- Three options: Save and Continue, Don't Save, or Cancel
- Browser refresh protection prevents accidental loss

**Manual Saving**:
- Use `Ctrl + S` or the Save button
- Choose between TXT and Markdown formats
- Automatic filename generation based on book title

---

## British English Spell Checking

### How Spell Checking Works

Book Master includes a comprehensive British English spell checker with over 50,000 words.

**Real-time Detection**:
- Misspelled words are underlined in red
- Spell checking happens as you type
- No interruption to your writing flow

**US to UK Conversions**:
- Automatic suggestions for American spellings
- "color" → "colour", "organize" → "organise", etc.
- Helps maintain British English consistency

### Using Spell Check Suggestions

**Right-click on underlined words** to see:
- **Spelling suggestions** with proper British English alternatives
- **Add to Dictionary** option for custom terms
- **Ignore for Session** to temporarily accept a word

**Spell Check Indicator**:
- Green indicator: Spell checking active
- Red indicator: Spell checking disabled
- Toggle in the editor interface

### Managing False Positives

For technical terms, names, or specialised vocabulary:
1. **Right-click the underlined word**
2. **Select "Add to Dictionary"**
3. **Choose appropriate category** (Technical, Medical, Legal, Custom)
4. **The word will no longer be flagged** in any document

---

## Managing Chapters

### Creating Chapters

**From the Sidebar**:
1. **Select your book** in the current book section
2. **Click "New Chapter"** button
3. **Enter chapter title**
4. **Chapter is automatically numbered**

**From the Editor**:
1. **Use the "+" button** in chapter navigation
2. **Enter chapter details**
3. **Begin writing immediately**

### Chapter Navigation

**In the Sidebar**:
- View all chapters for the current book
- See chapter numbers, titles, and word counts
- Click any chapter to switch to it
- Current chapter highlighted with green indicator

**Chapter Statistics**:
- Individual word and character counts
- Creation and last modified dates
- Reading time estimates

### Chapter Organisation

**Automatic Features**:
- Chapters automatically numbered in creation order
- Hierarchical display in sidebar
- Quick chapter switching without losing work

**Memory Management**:
For very large books (100,000+ words):
- Automatic pagination at ~2000 words per section
- Smart paragraph boundary splitting
- Maximum 3 pages loaded in memory at once
- Seamless navigation between sections

---

## Advanced Features

### Global Scratchpad

**Access the Scratchpad**:
- Click the "Notes" button in the top navigation
- Always available regardless of current book or chapter

**Scratchpad Features**:
- **Global persistence**: Notes survive across sessions
- **Large text area** for extensive notes
- **Auto-save functionality** preserves your thoughts
- **Research storage**: Perfect for plot ideas, character notes, references

**Use Cases**:
- Plot outlines and story structure
- Character development notes
- Research and reference material
- Ideas for future books

### Custom Dictionary Management

**Accessing Dictionary Manager**:
1. **Navigate to "Dictionary"** in the sidebar
2. **View all custom terms** organised by category

**Adding Terms**:
1. **Click "Add Term"** button
2. **Enter the word or phrase**
3. **Select category**:
   - General: Common words
   - Technical: Industry-specific terms
   - Medical: Healthcare terminology
   - Legal: Legal and formal terms
   - Custom: Personal additions

**Managing Terms**:
- **Edit existing terms** and their categories
- **Delete terms** no longer needed
- **View statistics** on dictionary usage

### Font Customisation

**Selecting Fonts**:
1. **Use the font selector** in the editor
2. **Choose from curated professional fonts**:
   - Georgia (serif, traditional)
   - Helvetica (sans-serif, modern)
   - Times New Roman (serif, classic)
   - Arial (sans-serif, clean)
   - Verdana (sans-serif, readable)

**Font Persistence**:
- Your font choice is remembered across sessions
- Different fonts for different books if desired
- Optimised for long-form reading and writing

### Markdown Preview

**Activating Markdown Preview**:
- Use `Ctrl + M` keyboard shortcut
- Toggle between edit and preview modes

**Supported Markdown**:
- Headers (# ## ###)
- **Bold** and *italic* text
- Lists (bulleted and numbered)
- Links and basic formatting
- Real-time HTML rendering

**Use Cases**:
- Preview formatted chapters
- Create structured documents
- Prepare content for web publication

---

## Exporting Your Work

### Export Options

**Available Formats**:
- **TXT**: Plain text format, universally compatible
- **Markdown**: Formatted text with markup, great for publishers

### How to Export

**From the Navigation Bar**:
1. **Ensure a book is selected**
2. **Click the "Save" button**
3. **Choose your preferred format** (TXT or Markdown)
4. **File automatically downloads** to your computer

**Automatic Features**:
- **Standardised filenames**: Based on book title and author
- **Complete content**: All chapters included in order
- **Metadata inclusion**: Book information at the beginning
- **Proper formatting**: Chapter headings and structure preserved

### Export File Structure

**TXT Format**:
```
Book Title
By Author Name

Chapter 1: Chapter Title
[Chapter content...]

Chapter 2: Chapter Title
[Chapter content...]
```

**Markdown Format**:
```markdown
# Book Title
**By Author Name**

## Chapter 1: Chapter Title
[Chapter content with markdown formatting...]

## Chapter 2: Chapter Title
[Chapter content with markdown formatting...]
```

---

## Customisation

### User Preferences

**Font Settings**:
- Default font for new documents
- Size preferences (browser zoom recommended)
- Reading mode optimisations

**Editor Preferences**:
- Autosave intervals (30 seconds default)
- Spell checking enabled/disabled
- Word count display options

**Interface Customisation**:
- Sidebar expanded/collapsed preference
- Theme settings (chrome green professional)

### Persistent Settings

All preferences are automatically saved and restored:
- Font choices persist across sessions
- Editor settings remembered per user
- Sidebar state maintained
- Custom dictionary terms preserved

---

## Troubleshooting

### Common Issues and Solutions

#### Application Won't Load
**Symptoms**: Blank page, loading errors
**Solutions**:
1. **Refresh the page** (Ctrl + F5)
2. **Clear browser cache** and cookies
3. **Check internet connection**
4. **Try a different browser**
5. **Disable browser extensions** temporarily

#### Autosave Not Working
**Symptoms**: Changes not being saved automatically
**Solutions**:
1. **Check autosave toggle** is enabled (green light)
2. **Manually save** using Ctrl + S
3. **Refresh the page** to reload the editor
4. **Check browser console** for error messages

#### Spell Check Not Active
**Symptoms**: No red underlines on misspelled words
**Solutions**:
1. **Verify spell check toggle** is enabled
2. **Type a clearly misspelled word** to test
3. **Refresh the page** to reload the dictionary
4. **Check browser JavaScript** is enabled

#### Performance Issues
**Symptoms**: Slow typing, lag in interface
**Solutions**:
1. **Close other browser tabs** to free memory
2. **Restart the browser** completely
3. **Check system memory** usage
4. **Use pagination** for very large documents (automatic)

#### Can't Access from Other Devices
**Symptoms**: Works on one device but not others
**Solutions**:
1. **Verify network connectivity** between devices
2. **Check IP address** is correct
3. **Ensure firewall** isn't blocking connections
4. **Try different browsers** on the problem device

### Browser-Specific Issues

**Chrome**:
- Best performance and compatibility
- Enable notifications for save alerts

**Firefox**:
- Excellent compatibility
- May need to allow popup windows for exports

**Safari**:
- Good compatibility on macOS and iOS
- Some keyboard shortcuts may differ

**Edge**:
- Full compatibility with modern versions
- Ensure JavaScript is enabled

### Performance Optimisation

**For Large Documents**:
- Use automatic pagination (enabled by default)
- Save frequently to maintain responsiveness
- Consider breaking very large books into smaller volumes

**For Multiple Users**:
- Each user should access from their own browser session
- Avoid simultaneous editing of the same book
- Use separate Raspberry Pi instances for teams

---

## Tips and Best Practices

### Writing Efficiently

**Workflow Suggestions**:
1. **Create your book structure** with chapter titles first
2. **Use the scratchpad** for outlining and notes
3. **Write in focused sessions** using full-screen mode
4. **Let autosave handle routine saving**, use manual save for milestones

**Organisation Tips**:
- **Consistent chapter naming** helps with navigation
- **Use descriptive titles** rather than just "Chapter 1"
- **Keep related books** in separate projects
- **Regular exports** provide backup copies

### Maximising Spell Check

**Dictionary Maintenance**:
- **Add character names** and places to avoid constant flagging
- **Include technical terms** relevant to your genre
- **Use categories** to organise custom dictionary entries
- **Review suggestions** carefully for British/American differences

**Writing Consistency**:
- **Trust the British English corrections**
- **Learn from repeated suggestions**
- **Build your custom dictionary** over time
- **Use the preview feature** to check formatting

### Performance Best Practices

**Memory Management**:
- **Close unused browser tabs** when writing
- **Save and refresh** occasionally for very long sessions
- **Use chapter breaks** to naturally segment large works
- **Monitor word counts** to gauge document size

**Backup Strategies**:
- **Export regularly** to create backup files
- **Use multiple formats** (both TXT and Markdown)
- **Save to cloud storage** for additional protection
- **Keep local copies** of important works

### Collaboration and Sharing

**Single User System**:
- Book Master is designed for individual use
- Share exported files for collaboration
- Use external tools for multiple author coordination

**Version Control**:
- **Export with timestamps** for version tracking
- **Use descriptive filenames** for different drafts
- **Keep milestone exports** as development progresses

### Advanced Usage

**Power User Features**:
- **Keyboard shortcuts** for faster navigation
- **Markdown mode** for structured writing
- **Custom dictionary** categories for specialised content
- **Font optimisation** for extended writing sessions

**Integration with Other Tools**:
- **Export to Markdown** for web publishing
- **TXT format** compatible with most word processors
- **Copy/paste** from other applications works seamlessly
- **Print from browser** for hard copy reviews

---

## Support and Additional Resources

### Getting Help

**Built-in Help**:
- This user manual covers all features
- Tooltips and interface hints provide contextual help
- Error messages include specific guidance

**Self-Diagnosis**:
- Browser developer tools (F12) show technical errors
- Network tab reveals connectivity issues
- Console messages help identify problems

**Community Support**:
- Check the project repository for updates
- Report bugs through the issue tracking system
- Share usage tips and workflows with other users

### System Information

**Technical Specifications**:
- Frontend: React 18 with TypeScript
- Backend: Node.js with Express
- Database: SQLite for data persistence
- Browser Requirements: Modern browsers with JavaScript

**Version Information**:
- Current Version: 1.0.0
- Last Updated: September 2024
- Compatibility: Raspberry Pi 5, standard servers, local development

---

**Book Master User Manual v1.0.0**
*Professional British English Book Editing Application*

*Built with ❤️ for British English authors and publishers*