class ChatInterface {
    constructor() {
        this.messages = [];
        this.messageContainer = document.getElementById('chatMessages');
        this.userInput = document.getElementById('userInput');
        this.sendButton = document.getElementById('sendButton');
        
        this.setupEventListeners();
        this.setupMarkdown();
    }
    
    setupEventListeners() {
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        
        this.userInput.addEventListener('input', () => {
            this.userInput.style.height = 'auto';
            this.userInput.style.height = this.userInput.scrollHeight + 'px';
        });
    }
    
    setupMarkdown() {
        marked.setOptions({
            highlight: function(code, lang) {
                if (lang && hljs.getLanguage(lang)) {
                    return hljs.highlight(code, { language: lang }).value;
                }
                return hljs.highlightAuto(code).value;
            },
            breaks: true
        });
    }
    
    addMessage(content, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
        
        if (isUser) {
            messageDiv.textContent = content;
        } else {
            messageDiv.innerHTML = marked.parse(content);
            
            messageDiv.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightBlock(block);
            });
        }
        
        this.messageContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }
    
    addTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'typingIndicator';
        indicator.className = 'typing-indicator';
        indicator.textContent = 'AI is typing...';
        this.messageContainer.appendChild(indicator);
        this.scrollToBottom();
    }
    
    removeTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) {
            indicator.remove();
        }
    }
    
    scrollToBottom() {
        this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
    }
    
    async sendMessage() {
        const content = this.userInput.value.trim();
        if (!content) return;
        
        
        this.addMessage(content, true);
        this.messages.push({ role: 'user', content });
        
        
        this.userInput.value = '';
        this.userInput.style.height = 'auto';
        
        
        this.addTypingIndicator();
        
        try {
            
            const eventSource = new EventSource('http://localhost:3000/chat?' + new URLSearchParams({ messages: JSON.stringify(this.messages) }));
            let aiResponse = '';
            
            eventSource.onmessage = (event) => {
                if (event.data === '[DONE]') {
                    eventSource.close();
                    this.removeTypingIndicator();
                    this.messages.push({ role: 'assistant', content: aiResponse });
                    return;
                }
                
                const data = JSON.parse(event.data);
                aiResponse += data.content;
                
                
                const lastMessage = this.messageContainer.lastElementChild;
                if (lastMessage && lastMessage.classList.contains('ai-message')) {
                    lastMessage.remove();
                }
                
                
                this.addMessage(aiResponse);
                this.scrollToBottom();
            };
            
            eventSource.onerror = (error) => {
                console.error('SSE Error:', error);
                eventSource.close();
                this.removeTypingIndicator();
            };
            
        } catch (error) {
            console.error('Error:', error);
            this.removeTypingIndicator();
            this.addMessage('Sorry, an error occurred. Please try again.');
        }
    }
}


const chat = new ChatInterface();