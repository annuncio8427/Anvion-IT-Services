/**
 * ANVION IT SERVICES — Universal AI Assistant & Communication Suite
 * Handles floating ANVION AI chat interface and WhatsApp direct integration.
 */

(function () {
  'use strict';

  // Remove any pre-existing duplicate floating WhatsApp elements to guarantee a single unified dock
  document.querySelectorAll('#anvionWhatsAppFloat, .whatsapp-float').forEach(el => el.remove());

  // Prevent multiple injections
  if (document.getElementById('anvionAiLauncher')) return;

  // Session state
  const chatHistory = [];
  let isOpen = false;

  // 1. Create Floating Widget Elements
  const container = document.createElement('div');
  container.id = 'anvionCommunicationSuite';
  container.className = 'fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3 pointer-events-none select-none';

  container.innerHTML = `
    <!-- AI Chat Window (Hidden by default) -->
    <div id="anvionAiWindow" class="hidden pointer-events-auto w-[90vw] sm:w-[380px] md:w-[420px] h-[520px] max-h-[80vh] rounded-2xl bg-[#090B10]/95 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl flex flex-col overflow-hidden transition-all duration-300 scale-95 opacity-0 origin-bottom-right">
      
      <!-- Chat Header -->
      <div class="px-5 py-4 border-b border-white/10 bg-[#0E1118] flex items-center justify-between shrink-0">
        <div class="flex items-center gap-3">
          <div class="relative w-9 h-9 rounded-xl bg-brand-blue/15 border border-brand-blue/40 flex items-center justify-center text-brand-blue">
            <span class="material-symbols-outlined text-lg">smart_toy</span>
            <span class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0E1118]"></span>
          </div>
          <div>
            <div class="flex items-center gap-1.5">
              <span class="font-display font-bold text-sm text-white">ANVION AI</span>
              <span class="text-[9px] font-mono px-1.5 py-0.2 rounded bg-brand-blue/20 text-brand-blue font-bold">SOLUTIONS</span>
            </div>
            <p class="text-[10px] text-neutral-400 font-mono">Live Technical Engineering Desk</p>
          </div>
        </div>

        <div class="flex items-center gap-1">
          <a href="https://wa.me/919150270802" target="_blank" rel="noopener noreferrer" title="Escalate to Human WhatsApp" class="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors">
            <span class="material-symbols-outlined text-base">support_agent</span>
          </a>
          <button id="anvionAiCloseBtn" class="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer">
            <span class="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      </div>

      <!-- Messages Stream Area -->
      <div id="anvionAiMessages" class="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs text-neutral-300 leading-relaxed font-sans">
        
        <!-- Welcome Message -->
        <div class="flex gap-2.5 items-start">
          <div class="w-6 h-6 rounded-lg bg-brand-blue/20 border border-brand-blue/30 flex items-center justify-center text-brand-blue shrink-0 mt-0.5 text-[11px] font-bold">
            A
          </div>
          <div class="p-3 rounded-2xl rounded-tl-sm bg-[#121622] border border-white/5 text-neutral-200 max-w-[85%] shadow-sm">
            <p class="font-semibold text-white text-xs mb-1">Greetings! I am ANVION AI.</p>
            <p>I can help you explore our engineering services, calculate project budgets, explain our technology stacks (React, Flutter, Python, Postgres), or schedule a consultation.</p>
          </div>
        </div>

        <!-- Suggestion Chips -->
        <div id="anvionAiChips" class="flex flex-wrap gap-1.5 pt-1 pl-8">
          <button class="ai-chip px-2.5 py-1 rounded-full bg-white/5 border border-white/10 hover:border-brand-blue/50 hover:bg-brand-blue/10 text-neutral-300 hover:text-white text-[11px] font-mono transition-all text-left cursor-pointer" data-prompt="What core services does ANVION offer?">
            Services & Stacks
          </button>
          <button class="ai-chip px-2.5 py-1 rounded-full bg-white/5 border border-white/10 hover:border-brand-blue/50 hover:bg-brand-blue/10 text-neutral-300 hover:text-white text-[11px] font-mono transition-all text-left cursor-pointer" data-prompt="How much does a Flutter mobile app cost?">
            Pricing & Timelines
          </button>
          <button class="ai-chip px-2.5 py-1 rounded-full bg-white/5 border border-white/10 hover:border-brand-blue/50 hover:bg-brand-blue/10 text-neutral-300 hover:text-white text-[11px] font-mono transition-all text-left cursor-pointer" data-prompt="Tell me about your real case studies and client projects.">
            Verified Case Studies
          </button>
          <button class="ai-chip px-2.5 py-1 rounded-full bg-white/5 border border-white/10 hover:border-brand-blue/50 hover:bg-brand-blue/10 text-neutral-300 hover:text-white text-[11px] font-mono transition-all text-left cursor-pointer" data-prompt="How do I book a technical discovery call?">
            Book Discovery Call
          </button>
        </div>

      </div>

      <!-- Typing Indicator (Hidden by default) -->
      <div id="anvionAiTyping" class="hidden px-5 py-2 text-[11px] font-mono text-brand-blue flex items-center gap-2 border-t border-white/5 bg-[#090B10]">
        <span class="w-1.5 h-1.5 rounded-full bg-brand-blue animate-ping"></span>
        <span>Synthesizing response...</span>
      </div>

      <!-- Input Bar -->
      <form id="anvionAiForm" class="p-3 border-t border-white/10 bg-[#0E1118] flex items-center gap-2 shrink-0">
        <input 
          id="anvionAiInput" 
          type="text" 
          placeholder="Ask a technical or service question..." 
          autocomplete="off"
          class="flex-1 px-3.5 py-2.5 rounded-xl bg-surface border border-white/10 text-white text-xs placeholder:text-neutral-500 focus:outline-none focus:border-brand-blue transition-all"
        />
        <button 
          type="submit" 
          class="w-9 h-9 rounded-xl bg-brand-blue hover:bg-brand-blue-hover text-white flex items-center justify-center shrink-0 transition-colors shadow-md shadow-brand-blue/20 cursor-pointer"
          title="Send message"
        >
          <span class="material-symbols-outlined text-sm">send</span>
        </button>
      </form>

    </div>

    <!-- Floating Trigger Buttons Dock -->
    <div class="pointer-events-auto flex items-center gap-2.5">
      
      <!-- ANVION AI Assistant Floating Launcher (Electric Blue) -->
      <button 
        id="anvionAiLauncher" 
        type="button"
        class="h-12 px-4 rounded-full bg-[#00A3FF] hover:bg-[#008CE0] text-white flex items-center gap-2 shadow-lg shadow-blue-500/25 transition-all hover:scale-105 active:scale-95 group border border-blue-300/30 cursor-pointer"
        title="Open ANVION AI Assistant"
        aria-label="Open ANVION AI Assistant"
      >
        <span class="material-symbols-outlined text-xl group-hover:rotate-12 transition-transform">smart_toy</span>
        <span class="font-display font-bold text-xs tracking-wide hidden sm:inline">ANVION AI</span>
        <span class="w-2 h-2 rounded-full bg-white animate-pulse"></span>
      </button>

      <!-- Single Official WhatsApp Floating Trigger (Emerald Green) -->
      <a 
        id="anvionWhatsAppFloat"
        href="https://wa.me/919150270802?text=Hello%20ANVION%20IT%20SERVICES,%20I%20would%20like%20to%20discuss%20a%20new%20project." 
        target="_blank" 
        rel="noopener noreferrer"
        title="Chat on WhatsApp (+91 9150270802)" 
        class="h-12 px-4 rounded-full bg-[#25D366] hover:bg-[#20BA56] text-white flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition-all hover:scale-105 active:scale-95 font-sans font-bold text-xs cursor-pointer border border-emerald-300/30"
        aria-label="Chat on WhatsApp with ANVION IT SERVICES"
      >
        <span class="w-2 h-2 rounded-full bg-white animate-pulse"></span>
        <svg class="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.04-1.077-.077-.282-.086-.632-.23-1.092-.432-1.928-.844-3.177-2.803-3.275-2.933-.095-.128-.778-1.036-.778-1.975 0-.94.492-1.403.666-1.597.174-.194.38-.243.507-.243.127 0 .254.002.366.007.119.006.277-.045.433.329.162.388.552 1.345.602 1.442.049.097.082.212.016.34-.065.13-.098.21-.194.321-.097.112-.204.25-.292.336-.098.096-.2.2-.086.396.114.195.508.839 1.09 1.357.75.669 1.382.876 1.578.973.196.098.312.083.428-.05.116-.134.494-.576.626-.774.133-.198.265-.165.446-.098.181.066 1.149.542 1.347.64.198.099.33.148.379.231.049.083.049.48-.095.885zM12 2C6.477 2 2 6.477 2 12c0 1.891.524 3.661 1.434 5.176L2 22l4.982-1.309A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.2c-1.637 0-3.167-.47-4.464-1.282l-.32-.2-2.957.776.79-2.883-.21-.334A8.175 8.175 0 013.8 12c0-4.521 3.679-8.2 8.2-8.2 4.521 0 8.2 3.679 8.2 8.2 0 4.521-3.679 8.2-8.2 8.2z"/>
        </svg>
        <span class="hidden sm:inline">Chat with us</span>
      </a>

    </div>
  `;

  document.body.appendChild(container);

  // 2. DOM Elements
  const aiWindow = document.getElementById('anvionAiWindow');
  const aiLauncher = document.getElementById('anvionAiLauncher');
  const aiCloseBtn = document.getElementById('anvionAiCloseBtn');
  const aiForm = document.getElementById('anvionAiForm');
  const aiInput = document.getElementById('anvionAiInput');
  const aiMessages = document.getElementById('anvionAiMessages');
  const aiTyping = document.getElementById('anvionAiTyping');

  // Toggle Function
  function toggleChat(show) {
    isOpen = typeof show === 'boolean' ? show : !isOpen;
    if (isOpen) {
      aiWindow.classList.remove('hidden');
      setTimeout(() => {
        aiWindow.classList.remove('scale-95', 'opacity-0');
        aiWindow.classList.add('scale-100', 'opacity-100');
        aiInput.focus();
      }, 10);
    } else {
      aiWindow.classList.remove('scale-100', 'opacity-100');
      aiWindow.classList.add('scale-95', 'opacity-0');
      setTimeout(() => {
        aiWindow.classList.add('hidden');
      }, 300);
    }
  }

  aiLauncher.addEventListener('click', () => toggleChat());
  aiCloseBtn.addEventListener('click', () => toggleChat(false));

  // Helper: Append Message Bubble
  function appendMessage(text, isUser = false) {
    const bubbleWrapper = document.createElement('div');
    bubbleWrapper.className = `flex gap-2.5 items-start ${isUser ? 'justify-end' : ''}`;

    // Format basic bold and markdown links
    let formattedText = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-brand-blue underline hover:text-white">$1</a>')
      .replace(/\n/g, '<br/>');

    if (isUser) {
      bubbleWrapper.innerHTML = `
        <div class="p-3 rounded-2xl rounded-tr-sm bg-brand-blue text-white max-w-[85%] shadow-md">
          <p>${formattedText}</p>
        </div>
      `;
    } else {
      bubbleWrapper.innerHTML = `
        <div class="w-6 h-6 rounded-lg bg-brand-blue/20 border border-brand-blue/30 flex items-center justify-center text-brand-blue shrink-0 mt-0.5 text-[11px] font-bold">
          A
        </div>
        <div class="p-3 rounded-2xl rounded-tl-sm bg-[#121622] border border-white/5 text-neutral-200 max-w-[85%] shadow-sm">
          <p>${formattedText}</p>
        </div>
      `;
    }

    aiMessages.appendChild(bubbleWrapper);
    aiMessages.scrollTop = aiMessages.scrollHeight;
  }

  // Handle Send Message
  async function handleSend(userText) {
    if (!userText || !userText.trim()) return;

    appendMessage(userText, true);
    aiInput.value = '';
    aiTyping.classList.remove('hidden');
    aiMessages.scrollTop = aiMessages.scrollHeight;

    chatHistory.push({ role: 'user', content: userText });

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, history: chatHistory.slice(-6) }),
      });

      aiTyping.classList.add('hidden');

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      const botReply = data.reply || "Thank you. Let's discuss your project further on WhatsApp (+91 9150270802).";
      appendMessage(botReply, false);
      chatHistory.push({ role: 'assistant', content: botReply });
    } catch (err) {
      aiTyping.classList.add('hidden');
      appendMessage(
        "I'm momentarily offline. You can chat directly with our engineering team on WhatsApp: [Chat on WhatsApp (+91 9150270802)](https://wa.me/919150270802) or submit a brief on our [Start a Project](start-a-project.html) page.",
        false
      );
    }
  }

  aiForm.addEventListener('submit', (e) => {
    e.preventDefault();
    handleSend(aiInput.value);
  });

  // Suggestion Chips Click
  document.querySelectorAll('.ai-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      handleSend(chip.getAttribute('data-prompt'));
    });
  });

})();

