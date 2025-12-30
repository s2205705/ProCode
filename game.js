class PythonPathfinderGame {
    constructor() {
        this.currentLevel = 1;
        this.score = 0;
        this.theme = document.body.classList.contains('deadly-theme') ? 'deadly' : 'cute';
        this.init();
    }
    
    init() {
        this.loadLevel(this.currentLevel);
        this.setupEventListeners();
        this.updateProgressBar();
    }
    
    loadLevel(level) {
        // In a real implementation, this would fetch from server
        const levels = {
            1: {
                title: "Python Variables",
                description: "Create a variable called 'name' and assign your username to it",
                challenge: "Create a variable that stores your name",
                // simple static test: checks that the source contains a 'name =' assignment
                test: (code, safeEval) => {
                    // basic pattern check
                    const assignPattern = /\bname\s*=\s*['\"][^'\"]+['\"]/i;
                    if (assignPattern.test(code)) return { pass: true, message: 'Found `name` assignment.' };

                    // fallback: try to run code and see if it prints a name
                    try {
                        const res = safeEval(code);
                        if (res && typeof res.output === 'string' && /[A-Za-z0-9]{1,}/.test(res.output)) {
                            return { pass: true, message: 'Code produced output: ' + res.output.split('\n')[0] };
                        }
                    } catch (e) { /* ignore */ }

                    return { pass: false, message: 'No `name` assignment found. Try: name = "YourName"' };
                }
            },
            2: {
                title: "HTML Structure",
                description: "Create a basic HTML page structure",
                challenge: "Write HTML with a title and a heading",
                test: (code) => {
                    return code.includes('<html') && code.includes('<head') && code.includes('<body');
                }
            }
        };
        
        const levelData = levels[level] || levels[1];
        document.getElementById('levelTitle').textContent = levelData.title;
        document.getElementById('challengeText').textContent = levelData.description;
        document.getElementById('codeInput').value = `# ${levelData.challenge}\n# Write your code here\n\n`;
        
        this.currentChallenge = levelData;
    }
    
    setupEventListeners() {
        document.getElementById('runCode').addEventListener('click', () => this.runCode());
        document.getElementById('submitCode').addEventListener('click', () => this.submitCode());
        const runTestsBtn = document.getElementById('runTests');
        if (runTestsBtn) runTestsBtn.addEventListener('click', () => this.runTests());
        const hintBtn = document.getElementById('showHint');
        if (hintBtn) hintBtn.addEventListener('click', () => this.showHint());
        document.getElementById('nextLevel').addEventListener('click', () => this.nextLevel());
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
    }
    
    runCode() {
        const code = document.getElementById('codeInput').value;
        const outputElement = document.getElementById('output');
        
        try {
            // Create a safe execution environment
            const result = this.safeEval(code);
            outputElement.textContent = result;
            outputElement.className = 'success';
            
            if (this.theme === 'cute') {
                this.showCuteAnimation('🎉 Code ran successfully!');
            } else {
                this.showDeadlyAnimation('⚡ Execution complete');
            }
        } catch (error) {
            outputElement.textContent = `Error: ${error.message}`;
            outputElement.className = 'error';
            
            if (this.theme === 'cute') {
                this.showCuteAnimation('💔 Try again!', 'error');
            } else {
                this.showDeadlyAnimation('💥 Execution failed', 'error');
            }
        }
    }
    
    safeEval(code) {
        // Remove dangerous patterns
        const dangerousPatterns = [
            /require\(/g, /import\s*sys/g, /__import__/g, /eval\(/g,
            /exec\(/g, /open\(/g, /file\(/g, /subprocess/g, /os\./g
        ];
        
        dangerousPatterns.forEach(pattern => {
            if (pattern.test(code)) {
                throw new Error('Potentially dangerous code detected');
            }
        });
        
        // Create a safe context and capture console output
        const safeKeys = ['Math','String','Number','Array','Object','Date','JSON'];
        const safeValues = [Math,String,Number,Array,Object,Date,JSON];

        // build a function that captures console.log into __outputs
        const wrapper = `
            "use strict";
            const __outputs = [];
            const console = { log: (...args) => __outputs.push(args.map(a=>String(a)).join(' ')) };
            try {
                ${code}
                return { output: __outputs.join('\n'), error: null };
            } catch (e) {
                return { output: __outputs.join('\n'), error: e.message };
            }
        `;

        const func = new Function(...safeKeys, wrapper);
        try {
            const result = func(...safeValues);
            return result; // {output, error}
        } catch (e) {
            return { output: '', error: e.message };
        }
    }
    
    submitCode() {
        const code = document.getElementById('codeInput').value;
        const result = this.currentChallenge.test(code, this.safeEval.bind(this));
        const passed = result && result.pass;
        const message = result && result.message ? result.message : (passed ? 'Passed' : 'Failed');

        if (passed) {
            this.score += 100;
            this.updateScore();
            this.updateProgressBar();
            if (this.theme === 'cute') { this.showCuteAnimation('🌟 Level Complete! +100 points'); this.createHearts(); }
            else { this.showDeadlyAnimation('⚔️ Challenge conquered! +100 points'); this.createEnergyExplosion(); }
            // Save progress to localStorage (static)
            try { localStorage.setItem('pp_progress', JSON.stringify({ level: this.currentLevel, score: this.score })); } catch(e){}
            document.getElementById('nextLevel').disabled = false;
            const tr = document.getElementById('testResults'); if (tr) tr.innerHTML = `<div class="test-pass">${message}</div>`;
        } else {
            if (this.theme === 'cute') { this.showCuteAnimation('💡 Keep trying! Check your solution.', 'error'); }
            else { this.showDeadlyAnimation('💥 Incorrect solution. Try again.', 'error'); }
            const tr = document.getElementById('testResults'); if (tr) tr.innerHTML = `<div class="test-fail">${message}</div>`;
        }
    }

    runTests() {
        const code = document.getElementById('codeInput').value;
        const result = this.currentChallenge.test(code, this.safeEval.bind(this));
        const passed = result && result.pass;
        const message = result && result.message ? result.message : (passed ? 'Passed' : 'Failed');
        const tr = document.getElementById('testResults');
        if (tr) tr.innerHTML = passed ? `<div class="test-pass">✅ ${message}</div>` : `<div class="test-fail">❌ ${message}</div>`;
        if (passed) { this.showCuteAnimation('✅ Tests passed', 'success'); }
    }

    showHint() {
        const hint = this.currentChallenge && this.currentChallenge.hint ? this.currentChallenge.hint : 'Try breaking the problem into smaller steps.';
        alert('Hint: ' + hint);
    }
    
    nextLevel() {
        this.currentLevel++;
        this.loadLevel(this.currentLevel);
        document.getElementById('nextLevel').disabled = true;
        document.getElementById('output').textContent = '';
    }
    
    updateScore() {
        document.getElementById('scoreValue').textContent = this.score;
    }
    
    updateProgressBar() {
        const progress = (this.currentLevel / 10) * 100;
        document.getElementById('progressBar').style.width = `${progress}%`;
    }
    
    toggleTheme() {
        const body = document.body;
        const theme = body.classList.contains('cute-theme') ? 'deadly' : 'cute';
        
        // Update session via AJAX
        fetch('/update_theme', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ theme: theme })
        });
        
        // Switch themes
        body.classList.remove('cute-theme', 'deadly-theme');
        body.classList.add(`${theme}-theme`);
        
        // Update all theme-specific elements
        document.querySelectorAll('[class*="cute"], [class*="deadly"]').forEach(el => {
            el.className = el.className.replace(/cute|deadly/g, theme);
        });
        
        this.theme = theme;
        
        // Reload level with new theme
        this.loadLevel(this.currentLevel);
    }
    
    showCuteAnimation(message, type = 'success') {
        const animation = document.createElement('div');
        animation.className = `cute-animation ${type}`;
        animation.textContent = message;
        animation.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 20px 40px;
            border-radius: 50px;
            font-size: 1.5rem;
            font-weight: bold;
            z-index: 10000;
            animation: bounceIn 0.5s, fadeOut 1s 1.5s forwards;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        `;
        
        document.body.appendChild(animation);
        setTimeout(() => animation.remove(), 2500);
    }
    
    showDeadlyAnimation(message, type = 'success') {
        const animation = document.createElement('div');
        animation.className = `deadly-animation ${type} neon-text`;
        animation.textContent = message;
        animation.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(15, 25, 35, 0.9);
            padding: 20px 40px;
            border: 2px solid var(--deadly-accent);
            font-size: 1.5rem;
            font-weight: bold;
            z-index: 10000;
            animation: glitch 0.5s, fadeOut 1s 1.5s forwards;
        `;
        
        document.body.appendChild(animation);
        setTimeout(() => animation.remove(), 2500);
    }
    
    createHearts() {
        for (let i = 0; i < 15; i++) {
            const heart = document.createElement('div');
            heart.className = 'heart';
            heart.style.cssText = `
                position: fixed;
                top: 80%;
                left: ${Math.random() * 100}%;
                width: ${10 + Math.random() * 20}px;
                height: ${10 + Math.random() * 20}px;
                animation: float ${3 + Math.random() * 4}s ease-in-out forwards;
            `;
            
            document.body.appendChild(heart);
            setTimeout(() => heart.remove(), 7000);
        }
    }
    
    createEnergyExplosion() {
        const explosion = document.createElement('div');
        explosion.className = 'energy-explosion';
        explosion.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            width: 0;
            height: 0;
            border-radius: 50%;
            box-shadow: 0 0 0 0 rgba(31, 192, 255, 0.7);
            animation: pulse-energy 0.5s forwards;
            z-index: 9999;
        `;
        
        document.body.appendChild(explosion);
        setTimeout(() => explosion.remove(), 1000);
    }
    
    async saveProgress(code) {
        try {
            const response = await fetch('/save_progress', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    level: this.currentLevel,
                    score: this.score,
                    code_solution: code
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to save progress');
            }
        } catch (error) {
            console.error('Error saving progress:', error);
        }
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.game = new PythonPathfinderGame();
});