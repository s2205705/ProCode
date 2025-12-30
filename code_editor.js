/**
 * Enhanced Code Editor for Python Pathfinder
 * Provides syntax highlighting, auto-completion, and code validation
 */

class CodeEditor {
    constructor() {
        this.editor = null;
        this.theme = 'cute';
        this.currentLanguage = 'python';
        this.init();
    }
    
    init() {
        this.detectTheme();
        this.setupEditor();
        this.setupLanguageTabs();
        this.setupShortcuts();
        this.loadUserPreferences();
    }
    
    detectTheme() {
        this.theme = document.body.classList.contains('deadly-theme') ? 'deadly' : 'cute';
    }
    
    setupEditor() {
        const editorElement = document.getElementById('codeEditor');
        if (!editorElement) return;
        
        // Create a simple textarea-based editor with syntax highlighting
        // In a real implementation, you might use CodeMirror or Monaco
        this.editor = editorElement;
        
        // Add syntax highlighting on input
        this.editor.addEventListener('input', () => {
            this.applySyntaxHighlighting();
        });
        
        // Add line numbers
        this.addLineNumbers();
        
        // Set initial theme
        this.applyTheme();
    }
    
    addLineNumbers() {
        const lineNumbers = document.createElement('div');
        lineNumbers.className = 'line-numbers';
        lineNumbers.innerHTML = '<span>1</span>';
        
        const container = this.editor.parentElement;
        container.insertBefore(lineNumbers, this.editor);
        
        // Update line numbers on input
        this.editor.addEventListener('input', () => {
            this.updateLineNumbers(lineNumbers);
        });
        
        // Sync scrolling
        this.editor.addEventListener('scroll', () => {
            lineNumbers.scrollTop = this.editor.scrollTop;
        });
    }
    
    updateLineNumbers(lineNumbers) {
        const lines = this.editor.value.split('\n').length;
        let numbersHTML = '';
        
        for (let i = 1; i <= lines; i++) {
            numbersHTML += `<span>${i}</span>`;
        }
        
        lineNumbers.innerHTML = numbersHTML;
    }
    
    applySyntaxHighlighting() {
        const code = this.editor.value;
        const language = this.currentLanguage;
        
        // Simple syntax highlighting for demo purposes
        // In production, use a proper syntax highlighter like Prism or Highlight.js
        if (language === 'python') {
            this.highlightPython(code);
        } else if (language === 'html') {
            this.highlightHTML(code);
        } else if (language === 'css') {
            this.highlightCSS(code);
        } else if (language === 'javascript') {
            this.highlightJavaScript(code);
        }
    }
    
    highlightPython(code) {
        // Python keywords
        const keywords = [
            'def', 'class', 'return', 'if', 'elif', 'else', 'for', 'while',
            'try', 'except', 'finally', 'with', 'as', 'import', 'from',
            'True', 'False', 'None', 'and', 'or', 'not', 'in', 'is'
        ];
        
        // Python built-in functions
        const builtins = [
            'print', 'len', 'range', 'str', 'int', 'float', 'list', 'dict',
            'set', 'tuple', 'type', 'input', 'open', 'sum', 'max', 'min'
        ];
        
        let highlighted = code;
        
        // Highlight keywords
        keywords.forEach(keyword => {
            const regex = new RegExp(`\\b${keyword}\\b`, 'g');
            highlighted = highlighted.replace(regex, `<span class="keyword">${keyword}</span>`);
        });
        
        // Highlight builtins
        builtins.forEach(builtin => {
            const regex = new RegExp(`\\b${builtin}\\b`, 'g');
            highlighted = highlighted.replace(regex, `<span class="builtin">${builtin}</span>`);
        });
        
        // Highlight strings
        highlighted = highlighted.replace(/(['"])(.*?)\1/g, '<span class="string">$1$2$1</span>');
        
        // Highlight comments
        highlighted = highlighted.replace(/#.*$/gm, '<span class="comment">$&</span>');
        
        // Highlight numbers
        highlighted = highlighted.replace(/\b\d+\b/g, '<span class="number">$&</span>');
        
        this.editor.innerHTML = highlighted;
    }
    
    highlightHTML(code) {
        // HTML tags
        const tags = [
            'html', 'head', 'body', 'div', 'span', 'p', 'h1', 'h2', 'h3',
            'h4', 'h5', 'h6', 'a', 'img', 'ul', 'ol', 'li', 'table',
            'tr', 'td', 'th', 'form', 'input', 'button', 'script', 'style'
        ];
        
        let highlighted = code;
        
        // Highlight tags
        tags.forEach(tag => {
            const regex = new RegExp(`&lt;\/?${tag}[^&]*&gt;`, 'gi');
            highlighted = highlighted.replace(regex, '<span class="tag">$&</span>');
        });
        
        // Highlight attributes
        highlighted = highlighted.replace(/(\w+)=/g, '<span class="attribute">$1</span>=');
        
        // Highlight attribute values
        highlighted = highlighted.replace(/=["'][^"']*["']/g, '<span class="value">$&</span>');
        
        // Highlight comments
        highlighted = highlighted.replace(/&lt;!--.*?--&gt;/g, '<span class="comment">$&</span>');
        
        this.editor.innerHTML = highlighted;
    }
    
    highlightCSS(code) {
        let highlighted = code;
        
        // Highlight properties
        const properties = [
            'color', 'background', 'font', 'margin', 'padding', 'border',
            'width', 'height', 'display', 'position', 'float', 'clear'
        ];
        
        properties.forEach(prop => {
            const regex = new RegExp(`\\b${prop}\\b(?=\\s*:)`, 'g');
            highlighted = highlighted.replace(regex, '<span class="property">$&</span>');
        });
        
        // Highlight values
        highlighted = highlighted.replace(/:(.*?);/g, ':<span class="value">$1</span>;');
        
        // Highlight selectors
        highlighted = highlighted.replace(/([.#]?[^{]+){/g, '<span class="selector">$1</span>{');
        
        // Highlight comments
        highlighted = highlighted.replace(/\/\*.*?\*\//g, '<span class="comment">$&</span>');
        
        this.editor.innerHTML = highlighted;
    }
    
    highlightJavaScript(code) {
        // JavaScript keywords
        const keywords = [
            'function', 'var', 'let', 'const', 'if', 'else', 'for', 'while',
            'do', 'switch', 'case', 'break', 'continue', 'return', 'try',
            'catch', 'finally', 'throw', 'new', 'delete', 'typeof', 'instanceof',
            'true', 'false', 'null', 'undefined', 'this', 'class', 'extends',
            'import', 'export', 'default', 'async', 'await', 'yield'
        ];
        
        let highlighted = code;
        
        // Highlight keywords
        keywords.forEach(keyword => {
            const regex = new RegExp(`\\b${keyword}\\b`, 'g');
            highlighted = highlighted.replace(regex, `<span class="keyword">${keyword}</span>`);
        });
        
        // Highlight strings
        highlighted = highlighted.replace(/(['"])(.*?)\1/g, '<span class="string">$1$2$1</span>');
        
        // Highlight numbers
        highlighted = highlighted.replace(/\b\d+\b/g, '<span class="number">$&</span>');
        
        // Highlight comments
        highlighted = highlighted.replace(/\/\/.*$/gm, '<span class="comment">$&</span>');
        highlighted = highlighted.replace(/\/\*.*?\*\//g, '<span class="comment">$&</span>');
        
        // Highlight functions
        highlighted = highlighted.replace(/(\w+)(?=\s*\()/g, '<span class="function">$1</span>');
        
        this.editor.innerHTML = highlighted;
    }
    
    setupLanguageTabs() {
        const tabs = document.querySelectorAll('.language-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const language = e.target.dataset.lang;
                this.switchLanguage(language);
                
                // Update active tab
                tabs.forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
            });
        });
    }
    
    switchLanguage(language) {
        this.currentLanguage = language;
        this.editor.dataset.lang = language;
        
        // Update syntax highlighting
        this.applySyntaxHighlighting();
        
        // Save preference
        this.saveUserPreference('language', language);
        
        // Show language-specific hints
        this.showLanguageHints(language);
    }
    
    showLanguageHints(language) {
        const hints = {
            'python': 'Tip: Use print() to output results',
            'html': 'Tip: All HTML tags should be properly closed',
            'css': 'Tip: Use class selectors for reusable styles',
            'javascript': 'Tip: Use console.log() for debugging'
        };
        
        const hintElement = document.getElementById('codeHint');
        if (hintElement && hints[language]) {
            hintElement.textContent = hints[language];
        }
    }
    
    setupShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Enter to run code
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                this.runCode();
            }
            
            // Ctrl/Cmd + S to save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.saveCode();
            }
            
            // Tab key for indentation
            if (e.key === 'Tab') {
                e.preventDefault();
                this.insertTab();
            }
            
            // Ctrl/Cmd + / to comment/uncomment
            if ((e.ctrlKey || e.metaKey) && e.key === '/') {
                e.preventDefault();
                this.toggleComment();
            }
        });
    }
    
    runCode() {
        const runButton = document.querySelector('#runCode, #runMultiplayerBtn');
        if (runButton) {
            runButton.click();
        }
    }
    
    saveCode() {
        // Get the current code
        const code = this.getCode();
        const level = document.getElementById('levelNumber')?.textContent || '1';
        
        // Save to localStorage
        localStorage.setItem(`code_level_${level}`, code);
        
        // Show notification
        this.showNotification('Code saved locally', 'success');
    }
    
    insertTab() {
        const start = this.editor.selectionStart;
        const end = this.editor.selectionEnd;
        const value = this.editor.value;
        
        // Insert 4 spaces at cursor position
        this.editor.value = value.substring(0, start) + '    ' + value.substring(end);
        
        // Move cursor after inserted spaces
        this.editor.selectionStart = this.editor.selectionEnd = start + 4;
        
        // Trigger input event for syntax highlighting
        this.editor.dispatchEvent(new Event('input'));
    }
    
    toggleComment() {
        const start = this.editor.selectionStart;
        const end = this.editor.selectionEnd;
        const value = this.editor.value;
        const selectedText = value.substring(start, end);
        
        let commentedText;
        let newCursorPos;
        
        if (this.currentLanguage === 'python') {
            // Python comments
            if (selectedText.includes('# ')) {
                // Uncomment
                commentedText = selectedText.replace(/^# /gm, '');
                newCursorPos = end - (selectedText.match(/# /g) || []).length * 2;
            } else {
                // Comment
                commentedText = selectedText.replace(/^/gm, '# ');
                newCursorPos = end + (selectedText.match(/\n/g) || []).length * 2 + 2;
            }
        } else if (this.currentLanguage === 'javascript' || this.currentLanguage === 'css') {
            // JavaScript/CSS comments
            if (selectedText.includes('// ')) {
                // Uncomment
                commentedText = selectedText.replace(/^\/\/ /gm, '');
                newCursorPos = end - (selectedText.match(/\/\/ /g) || []).length * 3;
            } else {
                // Comment
                commentedText = selectedText.replace(/^/gm, '// ');
                newCursorPos = end + (selectedText.match(/\n/g) || []).length * 3 + 3;
            }
        } else {
            return; // No commenting for other languages
        }
        
        // Replace selected text
        this.editor.value = value.substring(0, start) + commentedText + value.substring(end);
        
        // Update cursor position
        this.editor.selectionStart = start;
        this.editor.selectionEnd = newCursorPos;
        
        // Trigger input event
        this.editor.dispatchEvent(new Event('input'));
    }
    
    applyTheme() {
        if (this.theme === 'cute') {
            this.editor.classList.add('cute-editor');
            this.editor.classList.remove('deadly-editor');
        } else {
            this.editor.classList.add('deadly-editor');
            this.editor.classList.remove('cute-editor');
        }
    }
    
    getCode() {
        return this.editor.value;
    }
    
    setCode(code) {
        this.editor.value = code;
        this.applySyntaxHighlighting();
    }
    
    clearCode() {
        this.editor.value = '';
        this.applySyntaxHighlighting();
    }
    
    formatCode() {
        const code = this.getCode();
        let formatted = code;
        
        if (this.currentLanguage === 'python') {
            // Simple Python formatting
            formatted = this.formatPython(code);
        }
        
        this.setCode(formatted);
        this.showNotification('Code formatted', 'success');
    }
    
    formatPython(code) {
        // Simple indentation formatting for Python
        const lines = code.split('\n');
        let indentLevel = 0;
        const formattedLines = [];
        
        for (let line of lines) {
            const trimmed = line.trim();
            
            // Decrease indent for dedent keywords
            if (trimmed.startsWith('elif ') || trimmed.startsWith('else:') || 
                trimmed.startsWith('except ') || trimmed.startsWith('finally:')) {
                indentLevel--;
            }
            
            // Add indentation
            formattedLines.push('    '.repeat(indentLevel) + trimmed);
            
            // Increase indent for indent keywords
            if (trimmed.endsWith(':') && !trimmed.startsWith('#') && 
                !trimmed.includes('elif ') && !trimmed.includes('except ')) {
                indentLevel++;
            }
            
            // Decrease indent after pass, return, etc.
            if (trimmed === 'pass' || trimmed === 'return' || trimmed.startsWith('return ') ||
                trimmed === 'break' || trimmed === 'continue') {
                indentLevel = Math.max(0, indentLevel - 1);
            }
        }
        
        return formattedLines.join('\n');
    }
    
    loadUserPreferences() {
        // Load saved language preference
        const savedLanguage = localStorage.getItem('editor_language');
        if (savedLanguage) {
            this.switchLanguage(savedLanguage);
            
            // Update active tab
            const tabs = document.querySelectorAll('.language-tab');
            tabs.forEach(tab => {
                tab.classList.remove('active');
                if (tab.dataset.lang === savedLanguage) {
                    tab.classList.add('active');
                }
            });
        }
        
        // Load saved theme
        const savedTheme = localStorage.getItem('editor_theme');
        if (savedTheme) {
            this.theme = savedTheme;
            this.applyTheme();
        }
        
        // Load saved font size
        const fontSize = localStorage.getItem('editor_font_size');
        if (fontSize) {
            this.editor.style.fontSize = fontSize + 'px';
        }
    }
    
    saveUserPreference(key, value) {
        localStorage.setItem(`editor_${key}`, value);
    }
    
    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `editor-notification ${type} ${this.theme}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: absolute;
            bottom: 10px;
            right: 10px;
            padding: 8px 16px;
            border-radius: 4px;
            z-index: 1000;
            animation: fadeIn 0.3s ease-out;
        `;
        
        const editorContainer = this.editor.parentElement;
        editorContainer.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.3s ease-out forwards';
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }
    
    // Auto-completion
    setupAutoComplete() {
        this.editor.addEventListener('input', (e) => {
            const cursorPos = this.editor.selectionStart;
            const textBeforeCursor = this.editor.value.substring(0, cursorPos);
            
            // Get current word
            const words = textBeforeCursor.split(/\s+/);
            const currentWord = words[words.length - 1];
            
            if (currentWord.length >= 2) {
                const suggestions = this.getSuggestions(currentWord);
                if (suggestions.length > 0) {
                    this.showAutoComplete(suggestions, cursorPos);
                }
            }
        });
    }
    
    getSuggestions(prefix) {
        const suggestions = {
            'python': [
                'print', 'def', 'class', 'if', 'else', 'elif', 'for', 'while',
                'import', 'from', 'as', 'try', 'except', 'finally', 'with',
                'return', 'True', 'False', 'None', 'and', 'or', 'not', 'in'
            ],
            'javascript': [
                'function', 'const', 'let', 'var', 'if', 'else', 'for', 'while',
                'switch', 'case', 'break', 'continue', 'return', 'try', 'catch',
                'finally', 'throw', 'new', 'class', 'extends', 'import', 'export'
            ]
        };
        
        const langSuggestions = suggestions[this.currentLanguage] || [];
        return langSuggestions.filter(word => 
            word.startsWith(prefix) && word !== prefix
        );
    }
    
    showAutoComplete(suggestions, cursorPos) {
        // Implementation for auto-complete dropdown
        // This is a simplified version
        console.log('Auto-complete suggestions:', suggestions);
    }
}

// Initialize code editor when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.codeEditor = new CodeEditor();
});

// Additional utility functions
function downloadCode(filename, code) {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(code));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        console.log('Code copied to clipboard');
    }).catch(err => {
        console.error('Failed to copy code:', err);
    });
}