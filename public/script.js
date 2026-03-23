// Elementos do DOM
const sidebar = document.getElementById('sidebar');
const menuBtn = document.getElementById('menuBtn');
const sidebarClose = document.getElementById('sidebarClose');
const overlay = document.getElementById('overlay');
const newChatBtn = document.getElementById('newChatBtn');
const welcomeScreen = document.getElementById('welcomeScreen');
const chatArea = document.getElementById('chatArea');
const messagesContainer = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const suggestionBtns = document.querySelectorAll('.suggestion-btn');

// Estado
let messages = [];
let isLoading = false;

// Funções do Sidebar
function openSidebar() {
  sidebar.classList.add('open');
  overlay.classList.add('active');
}

function closeSidebar() {
  sidebar.classList.remove('open');
  overlay.classList.remove('active');
}

// Event listeners do sidebar
menuBtn.addEventListener('click', openSidebar);
sidebarClose.addEventListener('click', closeSidebar);
overlay.addEventListener('click', closeSidebar);

// Nova conversa
newChatBtn.addEventListener('click', () => {
  messages = [];
  messagesContainer.innerHTML = '';
  welcomeScreen.classList.remove('hidden');
  chatArea.classList.remove('active');
  closeSidebar();
});

// Auto-resize do textarea
messageInput.addEventListener('input', () => {
  messageInput.style.height = 'auto';
  messageInput.style.height = Math.min(messageInput.scrollHeight, 200) + 'px';
  updateSendButton();
});

// Atualizar estado do botão de enviar
function updateSendButton() {
  if (messageInput.value.trim()) {
    sendBtn.classList.add('active');
  } else {
    sendBtn.classList.remove('active');
  }
}

// Enviar mensagem com Enter
messageInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// Click no botão de enviar
sendBtn.addEventListener('click', sendMessage);

// Sugestões
suggestionBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const suggestion = btn.dataset.suggestion;
    messageInput.value = suggestion;
    sendMessage();
  });
});

// Criar elemento de mensagem
function createMessageElement(content, role) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${role}`;

  const avatarDiv = document.createElement('div');
  avatarDiv.className = 'message-avatar';
  
  if (role === 'assistant') {
    avatarDiv.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 8V4H8M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8zM8 20h8M12 16v4"/>
      </svg>
    `;
  } else {
    avatarDiv.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/>
      </svg>
    `;
  }

  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';
  contentDiv.textContent = content;

  messageDiv.appendChild(avatarDiv);
  messageDiv.appendChild(contentDiv);

  return messageDiv;
}

// Criar elemento de loading
function createLoadingElement() {
  const messageDiv = document.createElement('div');
  messageDiv.className = 'message assistant loading';
  messageDiv.id = 'loadingMessage';

  const avatarDiv = document.createElement('div');
  avatarDiv.className = 'message-avatar';
  avatarDiv.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 8V4H8M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8zM8 20h8M12 16v4"/>
    </svg>
  `;

  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';
  contentDiv.innerHTML = `
    <div class="loading-dots">
      <span></span>
      <span></span>
      <span></span>
    </div>
  `;

  messageDiv.appendChild(avatarDiv);
  messageDiv.appendChild(contentDiv);

  return messageDiv;
}

// Scroll para o final
function scrollToBottom() {
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Função principal de enviar mensagem
async function sendMessage() {
  const content = messageInput.value.trim();
  if (!content || isLoading) return;

  // Limpar input
  messageInput.value = '';
  messageInput.style.height = 'auto';
  updateSendButton();

  // Mostrar área de chat
  welcomeScreen.classList.add('hidden');
  chatArea.classList.add('active');

  // Adicionar mensagem do usuário
  const userMessage = { role: 'user', content };
  messages.push(userMessage);
  messagesContainer.appendChild(createMessageElement(content, 'user'));
  scrollToBottom();

  // Mostrar loading
  isLoading = true;
  sendBtn.disabled = true;
  messagesContainer.appendChild(createLoadingElement());
  scrollToBottom();

  // TODO: Conecte sua IA aqui
  // Substitua o código abaixo pela sua implementação de IA
  // Exemplo com fetch:
  // const response = await fetch('/api/chat', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ messages })
  // });
  // const data = await response.json();
  // const aiResponse = data.message;

  // Simulação de resposta (remova quando conectar sua IA)
  await new Promise(resolve => setTimeout(resolve, 1000));
  const aiResponse = "Ola! Sou o Nexo. Esta e uma resposta de exemplo - conecte sua IA aqui para respostas reais.";

  // Remover loading
  const loadingEl = document.getElementById('loadingMessage');
  if (loadingEl) loadingEl.remove();

  // Adicionar resposta da IA
  const assistantMessage = { role: 'assistant', content: aiResponse };
  messages.push(assistantMessage);
  messagesContainer.appendChild(createMessageElement(aiResponse, 'assistant'));
  scrollToBottom();

  isLoading = false;
  sendBtn.disabled = false;
}

// Inicialização
updateSendButton();
