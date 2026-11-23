const osiLayers = [
  { n: 7, name: "Aplicacion", text: "Proporciona servicios de red directamente a las aplicaciones.", protocols: "HTTP · DNS · SMTP" },
  { n: 6, name: "Presentacion", text: "Transforma, cifra y comprime datos para una representacion comun.", protocols: "TLS · JPEG · UTF-8" },
  { n: 5, name: "Sesion", text: "Establece, administra y finaliza sesiones de comunicacion.", protocols: "RPC · SIP · NetBIOS" },
  { n: 4, name: "Transporte", text: "Entrega datos entre procesos mediante puertos y control de flujo.", protocols: "TCP · UDP · SCTP" },
  { n: 3, name: "Red", text: "Direcciona y encamina paquetes a traves de redes diferentes.", protocols: "IPv4 · IPv6 · ICMP" },
  { n: 2, name: "Enlace", text: "Transporta tramas dentro de un enlace local y controla acceso al medio.", protocols: "Ethernet · Wi-Fi · PPP" },
  { n: 1, name: "Fisica", text: "Transmite bits como señales electricas, luminosas o electromagneticas.", protocols: "Cable · Fibra · Radio" }
];

document.getElementById("layerGrid").innerHTML = osiLayers.map(layer => `
  <article class="layer" tabindex="0">
    <span class="layer-num">${layer.n}</span>
    <h3>${layer.name}</h3>
    <p>${layer.text}</p>
    <code>${layer.protocols}</code>
  </article>
`).join("");

const menuToggle = document.querySelector(".menu-toggle");
const nav = document.querySelector("nav");
menuToggle.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(open));
});
nav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
  nav.classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
}));

const chatPanel = document.getElementById("chatPanel");
const chatFab = document.getElementById("chatFab");
const openChat = document.getElementById("openChat");
const closeChat = document.getElementById("closeChat");
function toggleChat(open) {
  chatPanel.classList.toggle("open", open);
  chatPanel.setAttribute("aria-hidden", String(!open));
  if (open) document.getElementById("chatInput").focus();
}
openChat.addEventListener("click", () => toggleChat(true));
chatFab.addEventListener("click", () => toggleChat(!chatPanel.classList.contains("open")));
closeChat.addEventListener("click", () => toggleChat(false));

const keyInput = document.getElementById("apiKey");
const keyBox = document.getElementById("chatKey");
let apiKey = sessionStorage.getItem("nvidia_api_key") || "";
if (apiKey) { keyInput.value = apiKey; keyBox.classList.add("hidden"); }
document.getElementById("saveKey").addEventListener("click", () => {
  apiKey = keyInput.value.trim();
  if (!apiKey) return;
  sessionStorage.setItem("nvidia_api_key", apiKey);
  keyBox.classList.add("hidden");
  keyInput.value = "";
});

const chatMessages = document.getElementById("chatMessages");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const conversation = [{ role: "system", content: "Eres un asistente experto en redes, protocolos OSI y TCP/IP. Responde en español, con claridad y precisión técnica." }];

function addMessage(text, type) {
  const el = document.createElement("div");
  el.className = `message ${type}`;
  el.textContent = text;
  chatMessages.appendChild(el);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return el;
}

chatForm.addEventListener("submit", async event => {
  event.preventEvent && event.preventEvent();
  event.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;
  chatInput.value = "";
  addMessage(text, "user");
  conversation.push({ role: "user", content: text });
  const loading = addMessage("Pensando...", "assistant");

  try {
    let response;
    try {
      response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: conversation })
      });
      if (!response.ok) throw new Error(`proxy:${response.status}`);
    } catch {
      if (!apiKey) {
        keyBox.classList.remove("hidden");
        throw new Error("Introduce tu NVIDIA API key para usar el asistente en GitHub Pages.");
      }
      response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ model: "meta/llama-3.1-70b-instruct", messages: conversation, temperature: 0.2, max_tokens: 700 })
      });
    }
    if (!response.ok) throw new Error(`Error API (${response.status})`);
    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || "No recibí una respuesta válida.";
    loading.remove();
    addMessage(answer, "assistant");
    conversation.push({ role: "assistant", content: answer });
  } catch (error) {
    loading.remove();
    addMessage(error.message || "No se pudo conectar con el asistente.", "error");
  }
});

document.querySelectorAll(".terms button").forEach(button => {
  button.addEventListener("click", () => {
    toggleChat(true);
    addMessage(button.dataset.term, "assistant");
  });
});
