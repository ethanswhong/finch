import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useConversation, useConversationClientTool } from '@elevenlabs/react';
import { categories, getMenuItem, getRestaurant, homeSections, restaurants } from './data/dummyData.js';
import RestaurantCard from './components/RestaurantCard.jsx';
import MenuCard from './components/MenuCard.jsx';
import CharacterFace from './components/CharacterFace.jsx';
import Icon from './components/Icon.jsx';

const AGENT_MODE = import.meta.env.VITE_AGENT_MODE || 'demo';
const AGENT_ID = import.meta.env.VITE_ELEVENLABS_AGENT_ID || '';
const USE_SIGNED_URL = import.meta.env.VITE_USE_SIGNED_URL === 'true';

const VOICEOVER_HANDOFF_DELAY_MS = Math.max(0, Number(import.meta.env.VITE_VOICEOVER_HANDOFF_DELAY_MS || 2400));
const SCREEN_READER_LOCK_SETTING = String(import.meta.env.VITE_SCREEN_READER_LOCK || 'auto').toLowerCase();
const ELEVENLABS_SPEECH_SPEED = Number(import.meta.env.VITE_ELEVENLABS_SPEED || 0);

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function looksLikeAssistiveActivation(event) {
  if (SCREEN_READER_LOCK_SETTING === 'on' || SCREEN_READER_LOCK_SETTING === 'true') return true;
  if (SCREEN_READER_LOCK_SETTING === 'off' || SCREEN_READER_LOCK_SETTING === 'false') return false;
  const nativeEvent = event?.nativeEvent || event;
  if (!nativeEvent) return false;
  return nativeEvent.detail === 0 || ('mozInputSource' in nativeEvent && nativeEvent.mozInputSource === 0);
}

function normalizeMessage(message) {
  if (!message) return '';
  if (typeof message === 'string') return message;
  if (typeof message.message === 'string') return message.message;
  if (typeof message.text === 'string') return message.text;
  if (typeof message.content === 'string') return message.content;
  if (typeof message.message?.text === 'string') return message.message.text;
  if (typeof message.message?.content === 'string') return message.message.content;
  return '';
}

function getMessageSource(message) {
  if (!message || typeof message === 'string') return '';
  return String(message.source || message.role || message.message?.role || '').toLowerCase();
}

function isExplicitEndCommand(text = '') {
  const cleaned = text
    .toLowerCase()
    .replace(/[.!?,;:]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return /^(please )?(quit|exit|goodbye|bye|disconnect|shut down|shutdown|end conversation|end the conversation|end this conversation|stop conversation|stop the conversation|stop this conversation|quit conversation|quit the conversation)( please| now| please now)?$/.test(cleaned);
}


function slugify(value = '') {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}


function sanitizeCharacter(character) {
  if (!character) return null;
  const { voiceLabel, ...rest } = character;
  return rest;
}

function buildMenuSections(restaurant, filter = 'featured') {
  if (!restaurant) return [];
  const menu = restaurant.menu || [];
  const normalizedFilter = filter?.toLowerCase();
  const filtered = normalizedFilter && normalizedFilter !== 'featured'
    ? menu.filter((item) => item.tags?.includes(normalizedFilter))
    : menu;

  const source = normalizedFilter && normalizedFilter !== 'featured' ? filtered : menu;
  const order = [];
  source.forEach((item) => {
    const title = item.menuSection || 'Menu';
    if (!order.includes(title)) order.push(title);
  });

  return order.map((title) => ({
    id: slugify(title),
    title,
    items: source.filter((item) => (item.menuSection || 'Menu') === title)
  })).filter((section) => section.items.length);
}

const DISCOVERY_FILTERS = [
  { id: 'featured', label: 'Featured' },
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'high-protein', label: 'High protein' },
  { id: 'non-spicy', label: 'Non-spicy' },
  { id: 'lighter', label: 'Lighter' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'spicy', label: 'Spicy' },
  { id: 'shareable', label: 'Shareable' },
  { id: 'dessert', label: 'Dessert' }
];

function App() {
  const [view, setView] = useState('home');
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(null);
  const [resultTitle, setResultTitle] = useState('All restaurants');
  const [resultRestaurantIds, setResultRestaurantIds] = useState(restaurants.map((r) => r.id));
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState({});
  const [activeCharacter, setActiveCharacter] = useState(null);
  const [agentStatus, setAgentStatus] = useState('');
  const [pendingFocusId, setPendingFocusId] = useState(null);
  const [demoSpeaking, setDemoSpeaking] = useState(false);
  const [demoMuted, setDemoMuted] = useState(false);
  const [menuFilter, setMenuFilter] = useState('featured');
  const [heroHeaderProgress, setHeroHeaderProgress] = useState(0);
  const [screenReaderConversationMode, setScreenReaderConversationMode] = useState(false);
  const [conversationAnnouncementNonce, setConversationAnnouncementNonce] = useState(0);
  const [conversationButtonRect, setConversationButtonRect] = useState(null);
  const [pageHeadingFocusNonce, setPageHeadingFocusNonce] = useState(0);
  const heroRef = useRef(null);
  const appShellRef = useRef(null);
  const activeCharacterRef = useRef(activeCharacter);
  const voiceOverProxyRef = useRef(null);
  const subpageHeadingRef = useRef(null);
  const controlFocusMuteTimerRef = useRef(null);
  const activationGenerationRef = useRef(0);
  const screenReaderConversationModeRef = useRef(false);
  activeCharacterRef.current = activeCharacter;

  const conversation = useConversation({
    ...(ELEVENLABS_SPEECH_SPEED >= 0.7 && ELEVENLABS_SPEECH_SPEED <= 1.2
      ? { overrides: { tts: { speed: ELEVENLABS_SPEECH_SPEED } } }
      : {}),
    onMessage: (message) => {
      // Voice-first experience: the agent speaks aloud; no visible transcript/chat UI is shown.
      const text = normalizeMessage(message);
      const source = getMessageSource(message);
      if (text) console.debug(`Voice conversation message${source ? ` from ${source}` : ''}:`, text);

      // Hard client-side escape hatch. Do not wait for the LLM to decide what
      // "quit" means: explicit end-session commands immediately disconnect
      // the ElevenLabs session, even on a tentative user transcript.
      if (source === 'user' && isExplicitEndCommand(text)) {
        activationGenerationRef.current += 1;
        setActiveCharacter(null);
        setScreenReaderConversationMode(false);
        screenReaderConversationModeRef.current = false;
        setAgentStatus('Conversation ended.');
        void conversation.endSession().catch((error) => console.error('Could not end voice session:', error));
      }
    },
    onDisconnect: () => {
      activationGenerationRef.current += 1;
      setActiveCharacter(null);
      setScreenReaderConversationMode(false);
      screenReaderConversationModeRef.current = false;
      setAgentStatus('Conversation ended.');
    },
    onError: (error) => {
      console.error(error);
      activationGenerationRef.current += 1;
      setActiveCharacter(null);
      setScreenReaderConversationMode(false);
      screenReaderConversationModeRef.current = false;
      setAgentStatus('Voice conversation error. Please tap the character button again to retry.');
    }
  });

  const elevenConnected = AGENT_MODE === 'elevenlabs' && conversation.status === 'connected';
  const isSpeaking = AGENT_MODE === 'elevenlabs' ? Boolean(conversation.isSpeaking) : demoSpeaking;
  const isListening = AGENT_MODE === 'elevenlabs' ? Boolean(conversation.isListening) : false;
  const isMuted = AGENT_MODE === 'elevenlabs' ? Boolean(conversation.isMuted) : demoMuted;

  const voiceConversationActive = Boolean(activeCharacter);

  const conversationLockActive = Boolean(activeCharacter && screenReaderConversationMode);

  function getConversationButtonSelector(character = activeCharacterRef.current) {
    if (!character) return null;
    if (character.type === 'restaurant') {
      if (view === 'restaurant' && selectedRestaurantId === character.restaurantId) return '.restaurant-agent-avatar';
      return `#restaurant-${character.restaurantId} .character-trigger`;
    }
    if (character.type === 'menu') return `#menu-${character.itemId} .character-trigger`;
    if (character.type === 'cart') return '.talk-cart-button';
    return null;
  }

  function getConversationTargetElement(character = activeCharacterRef.current) {
    if (!character) return null;
    if (character.type === 'restaurant') {
      if (view === 'restaurant' && selectedRestaurantId === character.restaurantId) {
        return document.querySelector('.restaurant-hero-fullbleed');
      }
      return document.getElementById(`restaurant-${character.restaurantId}`);
    }
    if (character.type === 'menu') return document.getElementById(`menu-${character.itemId}`);
    if (character.type === 'cart') return document.querySelector('.talk-cart-button');
    return null;
  }

  function refreshConversationButtonRect(character = activeCharacterRef.current) {
    const selector = getConversationButtonSelector(character);
    if (!selector) return false;
    const el = document.querySelector(selector);
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    setConversationButtonRect({ left: rect.left, top: rect.top, width: rect.width, height: rect.height });
    return true;
  }

  function focusConversationProxy() {
    try { voiceOverProxyRef.current?.focus({ preventScroll: true }); } catch (_) {}
  }

  // When the active character changes while the page is locked, move the
  // *page* to that entity first, then move VoiceOver focus to the matching
  // external conversation control. This keeps the visual context and the
  // accessibility focus pointing at the same restaurant/product.
  function alignLockedConversationToCharacter(character = activeCharacterRef.current) {
    if (!screenReaderConversationModeRef.current || !character) return;

    const attempt = () => {
      const target = getConversationTargetElement(character);
      if (!target) return false;

      // User scrolling stays blocked, but a deliberate programmatic jump is
      // allowed when Finch itself changes the active restaurant/product.
      target.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'nearest' });

      window.requestAnimationFrame(() => {
        refreshConversationButtonRect(character);
        window.requestAnimationFrame(focusConversationProxy);
      });
      return true;
    };

    // React may still be committing the new list/detail view when the client
    // tool resolves, so retry briefly instead of leaving focus on Back.
    if (!attempt()) {
      window.setTimeout(attempt, 70);
      window.setTimeout(attempt, 180);
    } else {
      // iOS VoiceOver occasionally ignores the first DOM focus immediately
      // after a scroll. A second focus is harmless and makes the handoff stable.
      window.setTimeout(() => {
        refreshConversationButtonRect(character);
        focusConversationProxy();
      }, 120);
    }
  }

  // Screen-reader conversation mode is intentionally modal: the visible page
  // stays in place, but VoiceOver only sees the back control (when applicable)
  // and the active Finch conversation control. Background touch/scroll is blocked.
  useLayoutEffect(() => {
    const shell = appShellRef.current;
    if (!shell) return undefined;

    if (!conversationLockActive) {
      shell.removeAttribute('aria-hidden');
      shell.inert = false;
      document.documentElement.classList.remove('conversation-lock-active');
      return undefined;
    }

    document.documentElement.classList.add('conversation-lock-active');
    refreshConversationButtonRect();

    // Put focus on the external live control before hiding the app subtree.
    const focusTimer = window.setTimeout(() => {
      focusConversationProxy();
      shell.setAttribute('aria-hidden', 'true');
      shell.inert = true;
      alignLockedConversationToCharacter(activeCharacterRef.current);
    }, 40);

    const preventScroll = (event) => event.preventDefault();
    document.addEventListener('touchmove', preventScroll, { passive: false });
    document.addEventListener('wheel', preventScroll, { passive: false });

    return () => {
      window.clearTimeout(focusTimer);
      shell.removeAttribute('aria-hidden');
      shell.inert = false;
      document.documentElement.classList.remove('conversation-lock-active');
      document.removeEventListener('touchmove', preventScroll);
      document.removeEventListener('wheel', preventScroll);
    };
  }, [conversationLockActive]);

  // Character/page switches during a locked conversation must never briefly
  // reveal the background accessibility tree. Only move the external control
  // and let VoiceOver announce its updated label once.
  useLayoutEffect(() => {
    if (!conversationLockActive) return undefined;
    const timer = window.setTimeout(() => {
      alignLockedConversationToCharacter(activeCharacterRef.current);
    }, 70);
    return () => window.clearTimeout(timer);
  }, [conversationLockActive, activeCharacter, view, selectedRestaurantId, conversationAnnouncementNonce]);

  useEffect(() => {
    if (!conversationLockActive) return undefined;
    const update = () => refreshConversationButtonRect();
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, [conversationLockActive, activeCharacter, view, selectedRestaurantId]);

  const cartItems = useMemo(() => Object.entries(cart)
    .map(([itemId, quantity]) => {
      const item = getMenuItem(itemId);
      return item ? { ...item, quantity } : null;
    })
    .filter(Boolean), [cart]);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const selectedRestaurant = selectedRestaurantId ? getRestaurant(selectedRestaurantId) : null;

  function setQuantity(itemId, quantity) {
    setCart((current) => {
      const next = { ...current };
      if (quantity <= 0) delete next[itemId];
      else next[itemId] = quantity;
      return next;
    });
  }

  function addItem(itemId, quantity = 1) {
    setCart((current) => ({ ...current, [itemId]: (current[itemId] || 0) + Math.max(1, Number(quantity) || 1) }));
  }

  function getVisibleRestaurants() {
    if (view === 'home') return restaurants;
    if (view === 'results') return resultRestaurantIds.map(getRestaurant).filter(Boolean);
    if (view === 'restaurant' && selectedRestaurant) return [selectedRestaurant];
    return [];
  }

  function getRestaurantDirectory() {
    return restaurants.map((r) => ({
      id: r.id,
      name: r.name,
      rating: r.rating,
      distance: r.distance,
      eta: r.eta,
      feature: r.feature,
      categories: r.categories,
      summary: r.summary,
      priceLevel: r.priceLevel,
      character: sanitizeCharacter(r.character),
      menuPreview: r.menu.slice(0, 6).map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        tags: item.tags,
        menuSection: item.menuSection,
        description: item.description
      }))
    }));
  }

  function buildAgentContext(character = activeCharacterRef.current) {
    const visible = getVisibleRestaurants().map((r) => ({
      id: r.id, name: r.name, rating: r.rating, distance: r.distance, eta: r.eta,
      feature: r.feature, categories: r.categories, summary: r.summary
    }));
    const currentRestaurant = character?.restaurantId ? getRestaurant(character.restaurantId) : selectedRestaurant;
    const currentItem = character?.itemId ? getMenuItem(character.itemId) : null;
    return JSON.stringify({
      app: 'Doorbase narrative shopping prototype',
      screen: view,
      currentCharacter: character,
      currentRestaurant: currentRestaurant ? {
        id: currentRestaurant.id,
        name: currentRestaurant.name,
        rating: currentRestaurant.rating,
        distance: currentRestaurant.distance,
        eta: currentRestaurant.eta,
        feature: currentRestaurant.feature,
        summary: currentRestaurant.summary,
        character: sanitizeCharacter(currentRestaurant.character),
        menu: currentRestaurant.menu.map((item) => ({
          id: item.id, name: item.name, price: item.price, description: item.description,
          ingredients: item.ingredients, tags: item.tags, menuSection: item.menuSection, healthScore: item.healthScore, character: sanitizeCharacter(item.character)
        }))
      } : null,
      currentItem: currentItem ? {
        id: currentItem.id, name: currentItem.name, price: currentItem.price,
        description: currentItem.description, ingredients: currentItem.ingredients,
        tags: currentItem.tags, menuSection: currentItem.menuSection, healthScore: currentItem.healthScore, character: sanitizeCharacter(currentItem.character),
        restaurantId: currentItem.restaurantId, restaurantName: currentItem.restaurantName
      } : null,
      visibleRestaurants: visible,
      restaurantDirectory: getRestaurantDirectory(),
      cart: cartItems.map((item) => ({
        id: item.id, name: item.name, quantity: item.quantity, price: item.price,
        tags: item.tags, healthScore: item.healthScore, restaurantId: item.restaurantId,
        restaurantName: item.restaurantName, character: sanitizeCharacter(item.character)
      })),
      cartTotal,
      rules: [
        'Only use facts in this context. Never invent ingredients, allergens, nutrition, prices, or restaurant facts.',
        'Keep spoken turns concise: usually one to three sentences, then let the shopper respond.',
        'restaurantDirectory is available on every screen. Any active restaurant or dish may use it to suggest another restaurant.',
        'If a restaurant character is asked about its menu while the shopper is not already on the restaurant page, call openRestaurant for that restaurant before describing the menu.',
        'If recommending a different restaurant, ask permission before calling focusRestaurant.',
        'When the shopper explicitly asks to change the cart, use the cart client tools rather than only saying you did it.'
      ]
    });
  }

  function getInitialCharacterIntro(character) {
    const entity = getCharacterEntity(character);
    if (character?.type === 'cart') {
      return `Hi, I'm your cart. You have ${cartCount} ${cartCount === 1 ? 'item' : 'items'} with me right now. Ask me to compare what you've picked, keep the best options, add something, or remove something.`;
    }
    return entity?.character?.intro || `Hi, I'm ${entity?.name || 'your Doorbase guide'}. Ask me anything about what I offer.`;
  }

  function triggerCharacterIntro(character) {
    const target = getCharacterEntity(character);
    conversation.sendContextualUpdate(`APP_CONTEXT: ${buildAgentContext(character)}`);
    conversation.sendUserMessage(
      `SYSTEM EVENT: The shopper switched to ${target?.name || 'the narrative character'} during an active conversation. ` +
      `Introduce yourself now in first person, briefly, using only APP_CONTEXT. ` +
      `Do not wait for the shopper to say hello and do not mention this system event.`
    );
  }

  async function startElevenLabs(character) {
    if (!AGENT_ID) {
      activationGenerationRef.current += 1;
      setActiveCharacter(null);
      setScreenReaderConversationMode(false);
      screenReaderConversationModeRef.current = false;
      setAgentStatus('Live voice is not configured yet. Add the ElevenLabs agent ID to enable continuous conversation.');
      return;
    }
    try {
      // If a voice session is already live, hand the same agent to the new character immediately.
      if (conversation.status === 'connected') {
        triggerCharacterIntro(character);
        return;
      }

      // ElevenLabs normally waits for the shopper to speak when First message is blank.
      // We pass a per-character dynamic variable so the dashboard First message
      // ({{character_intro}}) is spoken automatically as soon as the session connects.
      const dynamicVariables = {
        character_intro: getInitialCharacterIntro(character),
      };

      if (navigator.mediaDevices?.getUserMedia) {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      if (USE_SIGNED_URL) {
        const response = await fetch('/api/elevenlabs-signed-url');
        if (!response.ok) throw new Error('Could not get ElevenLabs signed URL');
        const { signedUrl } = await response.json();
        await conversation.startSession({ signedUrl, dynamicVariables });
      } else {
        await conversation.startSession({ agentId: AGENT_ID, dynamicVariables });
      }
    } catch (error) {
      console.error(error);
      activationGenerationRef.current += 1;
      setActiveCharacter(null);
      setScreenReaderConversationMode(false);
      screenReaderConversationModeRef.current = false;
      setAgentStatus('Could not start the live voice agent. Check microphone permission and ElevenLabs setup.');
    }
  }

  function speakDemo(text) {
    if (demoMuted || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.03;
    utterance.onstart = () => setDemoSpeaking(true);
    utterance.onend = () => setDemoSpeaking(false);
    utterance.onerror = () => setDemoSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }

  function getCharacterEntity(character) {
    if (!character) return null;
    if (character.type === 'restaurant') return getRestaurant(character.restaurantId);
    if (character.type === 'menu') return getMenuItem(character.itemId);
    if (character.type === 'cart') return { name: 'Your cart', character: { expression: 'friendly', intro: `I'm your cart. You have ${cartCount} items, and I can help compare, remove, or add items.` } };
    return null;
  }

  async function waitForScreenReaderHandoff(character, { muteExistingSession = false } = {}) {
    if (!screenReaderConversationModeRef.current) return;

    const wasMuted = Boolean(conversation.isMuted);
    if (muteExistingSession && conversation.status === 'connected' && !wasMuted) {
      try { conversation.setMuted(true); } catch (_) {}
    }

    setConversationAnnouncementNonce((value) => value + 1);
    alignLockedConversationToCharacter(character);
    await wait(VOICEOVER_HANDOFF_DELAY_MS);

    if (muteExistingSession && conversation.status === 'connected' && !wasMuted) {
      try { conversation.setMuted(false); } catch (_) {}
    }
  }

  function handleConversationControlFocus() {
    if (!screenReaderConversationModeRef.current || conversation.status !== 'connected') return;
    try { conversation.sendUserActivity?.(); } catch (_) {}
    try { conversation.setMuted(true); } catch (_) {}
    if (controlFocusMuteTimerRef.current) window.clearTimeout(controlFocusMuteTimerRef.current);
    controlFocusMuteTimerRef.current = window.setTimeout(() => {
      if (conversation.status === 'connected' && screenReaderConversationModeRef.current) {
        try { conversation.setMuted(false); } catch (_) {}
      }
      controlFocusMuteTimerRef.current = null;
    }, VOICEOVER_HANDOFF_DELAY_MS);
  }

  async function activateCharacter(character, event) {
    const same = activeCharacter && JSON.stringify(activeCharacter) === JSON.stringify(character);
    if (same) {
      await endCharacter();
      return;
    }

    const generation = ++activationGenerationRef.current;
    const alreadyConnected = AGENT_MODE === 'elevenlabs' && conversation.status === 'connected';
    const enteringConversation = !activeCharacter;

    if (enteringConversation) {
      const useScreenReaderLock = looksLikeAssistiveActivation(event);
      screenReaderConversationModeRef.current = useScreenReaderLock;
      setScreenReaderConversationMode(useScreenReaderLock);
    }

    setActiveCharacter(character);
    const entity = getCharacterEntity(character);
    setAgentStatus(`Conversation started with ${entity?.name || 'character'}.`);

    if (screenReaderConversationModeRef.current) {
      // Delay the ENTIRE ElevenLabs startup (including getUserMedia / WebRTC)
      // so VoiceOver can finish the handoff announcement without audio ducking.
      await waitForScreenReaderHandoff(character, { muteExistingSession: alreadyConnected });
      if (generation !== activationGenerationRef.current) return;
    }

    if (AGENT_MODE === 'elevenlabs') {
      await startElevenLabs(character);
    } else {
      if (!screenReaderConversationModeRef.current) await wait(350);
      if (generation !== activationGenerationRef.current) return;
      speakDemo(entity?.character?.intro || 'Ready to talk.');
    }
  }

  async function endCharacter() {
    activationGenerationRef.current += 1;
    if (controlFocusMuteTimerRef.current) {
      window.clearTimeout(controlFocusMuteTimerRef.current);
      controlFocusMuteTimerRef.current = null;
    }
    if (AGENT_MODE === 'elevenlabs' && conversation.status !== 'disconnected') {
      try { await conversation.endSession(); } catch (error) { console.error(error); }
    }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setDemoSpeaking(false);
    setActiveCharacter(null);
    setScreenReaderConversationMode(false);
    screenReaderConversationModeRef.current = false;
    setConversationButtonRect(null);
    setAgentStatus('Conversation ended.');
  }


  useEffect(() => {
    if (AGENT_MODE !== 'elevenlabs' || conversation.status !== 'connected') return;
    conversation.sendContextualUpdate(`APP_CONTEXT UPDATED: ${buildAgentContext()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, selectedRestaurantId, resultRestaurantIds.join('|'), JSON.stringify(cart), JSON.stringify(activeCharacter), conversation.status]);

  useEffect(() => {
    if (!pendingFocusId) return;

    // Never move DOM focus while a voice conversation is active. On iOS,
    // programmatic focus is enough to make VoiceOver announce the destination,
    // even when that navigation was initiated by the agent itself.
    if (activeCharacter) {
      setPendingFocusId(null);
      return;
    }

    const timer = window.setTimeout(() => {
      const el = document.querySelector(`#${CSS.escape(pendingFocusId)} .restaurant-summary, #${CSS.escape(pendingFocusId)} .character-trigger, #${CSS.escape(pendingFocusId)} button`);
      if (el?.focus) el.focus({ preventScroll: true });
      setPendingFocusId(null);
    }, 80);
    return () => clearTimeout(timer);
  }, [pendingFocusId, view, resultRestaurantIds, selectedRestaurantId, activeCharacter]);

  useEffect(() => {
    if (!pageHeadingFocusNonce || view !== 'results' || activeCharacter) return undefined;
    const timer = window.setTimeout(() => {
      try { subpageHeadingRef.current?.focus({ preventScroll: true }); } catch (_) {}
    }, 90);
    return () => window.clearTimeout(timer);
  }, [pageHeadingFocusNonce, view, activeCharacter]);

  useEffect(() => {
    if (view !== 'restaurant') {
      setHeroHeaderProgress(0);
      return undefined;
    }
    const updateHeader = () => {
      const hero = heroRef.current;
      if (!hero) return;
      const rect = hero.getBoundingClientRect();
      const start = 170;
      const end = 78;
      const progress = Math.max(0, Math.min(1, (start - rect.bottom) / (start - end)));
      setHeroHeaderProgress(progress);
    };
    updateHeader();
    window.addEventListener('scroll', updateHeader, { passive: true });
    window.addEventListener('resize', updateHeader);
    return () => {
      window.removeEventListener('scroll', updateHeader);
      window.removeEventListener('resize', updateHeader);
    };
  }, [view, selectedRestaurantId]);

  // ElevenLabs client tools. Add matching tools with the exact same names in the ElevenLabs dashboard.
  useConversationClientTool('focusRestaurant', async ({ restaurantId }) => {
    const restaurant = getRestaurant(restaurantId);
    if (!restaurant) return `Restaurant ${restaurantId} was not found.`;
    const nextCharacter = { type: 'restaurant', restaurantId };
    setResultTitle('Recommended restaurant');
    // Keep the existing list order whenever possible. Reordering the selected
    // restaurant to the top made the visual page and VoiceOver focus feel like
    // they jumped to two different places. If it is not in the current list,
    // append it and then scroll directly to that card.
    setResultRestaurantIds((current) => current.includes(restaurantId) ? current : [...current, restaurantId]);
    setView('results');
    setPendingFocusId(`restaurant-${restaurantId}`);
    setActiveCharacter(nextCharacter);
    if (screenReaderConversationModeRef.current) {
      window.setTimeout(() => alignLockedConversationToCharacter(nextCharacter), 60);
      await waitForScreenReaderHandoff(nextCharacter, { muteExistingSession: true });
    }
    return `Focused ${restaurant.name}. Continue speaking as ${restaurant.name}.`;
  });

  useConversationClientTool('openRestaurant', ({ restaurantId }) => {
    const restaurant = getRestaurant(restaurantId);
    if (!restaurant) return `Restaurant ${restaurantId} was not found.`;
    setSelectedRestaurantId(restaurantId);
    setMenuFilter('featured');
    setView('restaurant');
    window.scrollTo(0, 0);
    return `Opened ${restaurant.name}'s detail page and menu. If the shopper asked about the menu, describe or recommend dishes now.`;
  });

  useConversationClientTool('focusMenuItem', async ({ itemId }) => {
    const item = getMenuItem(itemId);
    if (!item) return `Menu item ${itemId} was not found.`;
    const nextCharacter = { type: 'menu', restaurantId: item.restaurantId, itemId };
    setSelectedRestaurantId(item.restaurantId);
    setView('restaurant');
    setPendingFocusId(`menu-${itemId}`);
    setActiveCharacter(nextCharacter);
    if (screenReaderConversationModeRef.current) {
      window.setTimeout(() => alignLockedConversationToCharacter(nextCharacter), 60);
      await waitForScreenReaderHandoff(nextCharacter, { muteExistingSession: true });
    }
    return `Focused ${item.name}. Continue speaking as ${item.name}.`;
  });

  useConversationClientTool('addCartItem', ({ itemId, quantity = 1 }) => {
    const item = getMenuItem(itemId);
    if (!item) return `Menu item ${itemId} was not found.`;
    addItem(itemId, quantity);
    return `Added ${quantity} ${item.name} to the cart.`;
  });

  useConversationClientTool('removeCartItem', ({ itemId }) => {
    const item = getMenuItem(itemId);
    if (!item) return `Menu item ${itemId} was not found.`;
    setQuantity(itemId, 0);
    return `Removed ${item.name} from the cart.`;
  });

  useConversationClientTool('setCartItemQuantity', ({ itemId, quantity }) => {
    const item = getMenuItem(itemId);
    if (!item) return `Menu item ${itemId} was not found.`;
    setQuantity(itemId, Number(quantity));
    return `Set ${item.name} quantity to ${Number(quantity)}.`;
  });

  useConversationClientTool('openCart', () => {
    setView('cart');
    window.scrollTo(0, 0);
    return `Opened the cart with ${cartCount} items.`;
  });

  function openCategory(name) {
    if (name === 'Deals') {
      const dealSection = homeSections.find((section) => section.id === 'deals');
      setResultTitle('Deals for you');
      setResultRestaurantIds(dealSection?.restaurantIds || []);
      setView('results');
      setPageHeadingFocusNonce((value) => value + 1);
      window.scrollTo(0, 0);
      return;
    }
    const matches = restaurants.filter((restaurant) => restaurant.categories.some((category) => category.toLowerCase() === name.toLowerCase()));
    setResultTitle(`${name} restaurants`);
    setResultRestaurantIds(matches.length ? matches.map((r) => r.id) : restaurants.slice(0, 5).map((r) => r.id));
    setView('results');
    setPageHeadingFocusNonce((value) => value + 1);
    window.scrollTo(0, 0);
  }

  function submitSearch(event) {
    event?.preventDefault();
    const q = search.trim().toLowerCase();
    if (!q) return;
    const matches = restaurants.filter((restaurant) =>
      restaurant.name.toLowerCase().includes(q) ||
      restaurant.categories.some((category) => category.toLowerCase().includes(q)) ||
      restaurant.feature.toLowerCase().includes(q)
    );
    setResultTitle(matches.length ? `Results for “${search.trim()}”` : 'Try one of these restaurants');
    setResultRestaurantIds((matches.length ? matches : restaurants.slice(0, 6)).map((r) => r.id));
    setView('results');
    setPageHeadingFocusNonce((value) => value + 1);
    window.scrollTo(0, 0);
  }

  function openRestaurant(id) {
    setSelectedRestaurantId(id);
    setMenuFilter('featured');
    setView('restaurant');
    window.scrollTo(0, 0);
  }

  async function goBack() {
    if (activeCharacterRef.current) {
      await endCharacter();
    }
    if (view === 'restaurant') setView('results');
    else if (view === 'cart') setView(selectedRestaurantId ? 'restaurant' : 'home');
    else setView('home');
    window.scrollTo(0, 0);
  }

  const activeEntity = getCharacterEntity(activeCharacter);
  const restaurantMenuSections = buildMenuSections(selectedRestaurant, menuFilter);
  const filteredMenuCount = restaurantMenuSections.reduce((sum, section) => sum + section.items.length, 0);

  function scrollToElement(id) {
    window.requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function openHomeSection(section) {
    setResultTitle(section.title);
    setResultRestaurantIds(section.restaurantIds);
    setView('results');
    setPageHeadingFocusNonce((value) => value + 1);
    window.scrollTo(0, 0);
  }

  function scrollToNextHomeSection(index) {
    const next = homeSections[index + 1];
    if (next) scrollToElement(`home-section-${next.id}`);
  }

  const headerTitle = view === 'results' ? resultTitle : view === 'cart' ? 'Cart' : '';

  return (
    <>
    <div className="app-shell" ref={appShellRef}>
      {view !== 'restaurant' && (
        <header className={`top-header ${view === 'home' ? 'home-header' : 'subpage-header'}`}>
          {view === 'home' ? (
            <div className="home-top-row">
              <button className="location-button" type="button" aria-label="Delivery location 91234">
                <span>91234</span><Icon name="chevronDown" size={18} />
              </button>
              <div className="home-header-actions">
                <button className="round-header-button" type="button" aria-label="Profile"><Icon name="user" /></button>
                <button className="round-header-button" type="button" aria-label="Notifications"><Icon name="bell" /></button>
                <button className="round-header-button cart-header" type="button" onClick={() => setView('cart')} aria-label={`Open cart, ${cartCount} items`}>
                  <Icon name="cart" /><span>{cartCount}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="subpage-top-row">
              <button className="plain-icon-button" onClick={goBack} aria-label="Go back"><Icon name="back" size={30} /></button>
              <h1 ref={subpageHeadingRef} tabIndex="-1">{headerTitle}</h1>
              {view !== 'cart' ? (
                <button className="plain-icon-button" aria-label="Filter restaurants"><Icon name="sliders" size={28} /></button>
              ) : <span />}
            </div>
          )}
        </header>
      )}

      <main id="main-content" tabIndex="-1">
        {view === 'home' && (
          <>
            <section className="welcome-section" id="home-top" aria-labelledby="welcome-heading">
              <div className="section-heading-row welcome-heading-row">
                <h1 id="welcome-heading">Hello Weekend!</h1>
                <button className="section-icon-button" type="button" onClick={() => scrollToElement(`home-section-${homeSections[0]?.id}`)} aria-label="Skip to National Favorites">
                  <Icon name="arrowDown" />
                </button>
              </div>
              <div className="category-grid" aria-label="Food categories">
                {categories.map((category) => (
                  <button key={category.name} className="category-card" onClick={() => openCategory(category.name)}>
                    <span className="category-icon-wrap" aria-hidden="true">
                      <img
                        src={category.icon}
                        alt=""
                        onError={(event) => {
                          event.currentTarget.style.display = 'none';
                          const fallback = event.currentTarget.nextElementSibling;
                          if (fallback) fallback.style.display = 'grid';
                        }}
                      />
                      <span className="category-fallback">{category.emoji}</span>
                    </span>
                    <span>{category.name}</span>
                  </button>
                ))}
              </div>
            </section>

            {homeSections.map((section, index) => (
              <section className="home-section" id={`home-section-${section.id}`} key={section.id} aria-labelledby={`section-${section.id}`}>
                <div className="section-heading-row">
                  <h2 id={`section-${section.id}`}>{section.title}</h2>
                  <div className="section-actions">
                    {index < homeSections.length - 1 && (
                      <button className="section-icon-button" type="button" onClick={() => scrollToNextHomeSection(index)} aria-label={`Skip to ${homeSections[index + 1].title}`}>
                        <Icon name="arrowDown" />
                      </button>
                    )}
                    <button className="section-icon-button" type="button" onClick={() => openHomeSection(section)} aria-label={`View all ${section.title}`}>
                      <Icon name="arrowRight" />
                    </button>
                  </div>
                </div>
                <div className="home-restaurant-strip" aria-label={section.title}>
                  {section.restaurantIds.map((id) => {
                    const restaurant = getRestaurant(id);
                    const active = activeCharacter?.type === 'restaurant' && activeCharacter.restaurantId === id;
                    return <RestaurantCard compact key={id} restaurant={restaurant} onOpen={() => openRestaurant(id)} onCharacter={(event) => activateCharacter({ type: 'restaurant', restaurantId: id }, event)} active={active} talking={active && isSpeaking} listening={active && isListening} />;
                  })}
                </div>
              </section>
            ))}
          </>
        )}

        {view === 'results' && (
          <section className="results-section">
            <div className="restaurant-list">
              {resultRestaurantIds.map((id) => {
                const restaurant = getRestaurant(id);
                if (!restaurant) return null;
                const active = activeCharacter?.type === 'restaurant' && activeCharacter.restaurantId === id;
                return <RestaurantCard key={id} restaurant={restaurant} onOpen={() => openRestaurant(id)} onCharacter={(event) => activateCharacter({ type: 'restaurant', restaurantId: id }, event)} active={active} talking={active && isSpeaking} listening={active && isListening} />;
              })}
            </div>
          </section>
        )}

        {view === 'restaurant' && selectedRestaurant && (
          <section className="restaurant-page" aria-labelledby="restaurant-title" style={{ '--detail-progress': heroHeaderProgress }}>
            <header className="restaurant-floating-header">
              <div className="restaurant-floating-row">
                <button className="detail-header-button" type="button" onClick={goBack} aria-label="Go back">
                  <Icon name="back" size={30} strokeWidth={2.35} />
                </button>
                <strong className="restaurant-floating-title">{selectedRestaurant.name}</strong>
                <div className="restaurant-floating-actions">
                  <button className="detail-header-button" type="button" aria-label={`Save ${selectedRestaurant.name}`}><Icon name="heart" size={27} strokeWidth={2.25} /></button>
                  <button className="detail-header-button" type="button" aria-label={`Share ${selectedRestaurant.name}`}><Icon name="share" size={26} strokeWidth={2.25} /></button>
                  <button className="detail-header-button" type="button" aria-label="More restaurant options"><Icon name="more" size={27} /></button>
                </div>
              </div>
            </header>

            <div className={`restaurant-hero-fullbleed ${activeCharacter?.type === 'restaurant' && activeCharacter.restaurantId === selectedRestaurant.id ? 'conversation-active-card' : ''}`} ref={heroRef}>
              <img src={selectedRestaurant.image} alt={selectedRestaurant.imageAlt} className="restaurant-hero-image" />
              <div className="restaurant-hero-shade" />


              <div className={`hero-restaurant-copy ${activeCharacter?.type === 'restaurant' && activeCharacter.restaurantId === selectedRestaurant.id ? 'conversation-active' : ''}`}>
                <button
                  type="button"
                  className={`restaurant-agent-avatar ${activeCharacter?.type === 'restaurant' && activeCharacter.restaurantId === selectedRestaurant.id ? 'active' : ''} ${activeCharacter?.type === 'restaurant' && activeCharacter.restaurantId === selectedRestaurant.id && isListening ? 'is-listening' : ''}`}
                  onClick={(event) => activateCharacter({ type: 'restaurant', restaurantId: selectedRestaurant.id }, event)}
                  aria-label={activeCharacter?.type === 'restaurant' && activeCharacter.restaurantId === selectedRestaurant.id ? `Conversing with ${selectedRestaurant.name}. Select again to end conversation.` : `Talk to ${selectedRestaurant.name}`}
                >
                  <CharacterFace small expression={selectedRestaurant.character.expression} talking={activeCharacter?.type === 'restaurant' && activeCharacter.restaurantId === selectedRestaurant.id && isSpeaking} />
                </button>
                <div>
                  <h1 id="restaurant-title">{selectedRestaurant.name}</h1>
                  <p>{selectedRestaurant.priceLevel} · {selectedRestaurant.categories.join(' · ')} · {selectedRestaurant.distance} mi · Pricing &amp; fees</p>
                </div>
              </div>
            </div>

            <div className="restaurant-content">
              <section className="service-card" aria-label="Delivery options">
                <div className="service-top-row">
                  <div className="segmented-control" aria-label="Fulfillment method">
                    <button type="button" className="selected">Delivery</button>
                    <button type="button">Pickup</button>
                  </div>
                  <button className="group-order-button" type="button">Group order</button>
                </div>
                <div className="service-meta-grid">
                  <div><strong>{selectedRestaurant.distance} mi away</strong><span>distance <Icon name="info" size={15} /></span></div>
                  <div className="service-eta"><strong>{selectedRestaurant.eta.split('–')[0]} min</strong><span>delivery time</span></div>
                  <button className="section-icon-button" aria-label="Change delivery time"><Icon name="chevronDown" /></button>
                </div>
              </section>

              <section className="restaurant-block deals-section" aria-labelledby="deals-title">
                <div className="section-heading-row">
                  <h2 id="deals-title">Deals &amp; benefits</h2>
                  <button className="section-icon-button" type="button" aria-label="View all deals"><Icon name="arrowRight" /></button>
                </div>
                <div className="deal-card-row" aria-label="Restaurant deals">
                  {(selectedRestaurant.deals || []).map((deal, index) => (
                    <article className="benefit-card" key={`${deal.title}-${index}`}>
                      <Icon name="tag" size={30} />
                      <div><strong>{deal.title}</strong><span>{deal.subtitle}</span></div>
                      <button type="button">{deal.cta || 'See items'}</button>
                    </article>
                  ))}
                </div>
              </section>

              <section className="restaurant-block discovery-section" aria-labelledby="discovery-title">
                <h2 id="discovery-title">What can we help you find?</h2>
                <div className="filter-chip-row" aria-label="Menu filters">
                  {DISCOVERY_FILTERS.map((filter) => {
                    const count = filter.id === 'featured'
                      ? selectedRestaurant.menu.length
                      : selectedRestaurant.menu.filter((item) => item.tags?.includes(filter.id)).length;
                    if (filter.id !== 'featured' && count === 0) return null;
                    return (
                      <button
                        key={filter.id}
                        className={menuFilter === filter.id ? 'active' : ''}
                        type="button"
                        aria-pressed={menuFilter === filter.id}
                        onClick={() => {
                          setMenuFilter(filter.id);
                          window.setTimeout(() => scrollToElement('restaurant-menu-nav'), 30);
                        }}
                      >
                        {filter.label}
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="restaurant-block reviews-section" id="reviews-section" aria-labelledby="reviews-title">
                <div className="section-heading-row">
                  <div>
                    <h2 id="reviews-title">Reviews</h2>
                    <p>{selectedRestaurant.reviews} ratings · 50+ public reviews</p>
                  </div>
                  <button className="soft-button" type="button">Add review</button>
                </div>
                <div className="review-highlight-card">
                  <div className="rating-orb"><strong>{selectedRestaurant.rating}</strong><Icon name="star" size={18} /></div>
                  <div>
                    <h3>✦ Review highlights</h3>
                    <p>{selectedRestaurant.reviewHighlight}</p>
                    <span>AI-generated based on reviews</span>
                  </div>
                </div>
              </section>

              <nav className="restaurant-menu-nav" id="restaurant-menu-nav" aria-label="Menu categories">
                <div className="menu-nav-tools" aria-hidden="true">
                  <span className="menu-nav-icon"><Icon name="menu" size={27} /></span>
                  <span className="menu-nav-icon"><Icon name="search" size={25} /></span>
                </div>
                <div className="restaurant-tab-strip">
                  {restaurantMenuSections.map((section, index) => (
                    <button type="button" className={index === 0 ? 'selected' : ''} key={section.id} onClick={() => scrollToElement(`menu-section-${section.id}`)}>{section.title}</button>
                  ))}
                </div>
              </nav>

              {filteredMenuCount === 0 && (
                <section className="restaurant-block empty-filter-state">
                  <h2>No exact matches</h2>
                  <p>Try another filter to browse the rest of the menu.</p>
                  <button type="button" className="soft-button" onClick={() => setMenuFilter('featured')}>Show full menu</button>
                </section>
              )}

              {restaurantMenuSections.map((section, sectionIndex) => (
                <section className="menu-section restaurant-block" id={`menu-section-${section.id}`} key={section.id} aria-labelledby={`menu-heading-${section.id}`}>
                  <h2 id={`menu-heading-${section.id}`}>{section.title}</h2>
                  {sectionIndex === 0 && menuFilter !== 'featured' && <p className="section-help">Showing {filteredMenuCount} items tagged “{DISCOVERY_FILTERS.find((filter) => filter.id === menuFilter)?.label}”.</p>}
                  {sectionIndex === 0 && menuFilter === 'featured' && <p className="section-help">Use the character button on a dish to hear it introduce itself. Add with the plus button.</p>}
                  <div className="menu-grid">
                    {section.items.map((item) => {
                      const active = activeCharacter?.type === 'menu' && activeCharacter.itemId === item.id;
                      return (
                        <MenuCard key={item.id} item={item} restaurant={selectedRestaurant} quantity={cart[item.id] || 0} onAdd={() => addItem(item.id)} onCharacter={(event) => activateCharacter({ type: 'menu', restaurantId: selectedRestaurant.id, itemId: item.id }, event)} active={active} talking={active && isSpeaking} listening={active && isListening} />
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          </section>
        )}

        {view === 'cart' && (
          <section className="cart-page" aria-labelledby="cart-title">
            <h1 className="sr-only" id="cart-title">Cart</h1>
            {!cartItems.length ? <p className="empty-state">Your cart is empty.</p> : (
              <>
                <div className="cart-list">
                  {cartItems.map((item) => (
                    <article className="cart-item" key={item.id} id={`cart-${item.id}`}>
                      <div className="cart-thumb-wrap">
                        <img src={item.image} alt={item.imageAlt} />
                        {activeCharacter?.type === 'cart' && <div className="cart-face"><CharacterFace small expression={item.character.expression} talking={isSpeaking} /></div>}
                      </div>
                      <div className="cart-item-copy">
                        <strong>{item.name}</strong>
                        <span>{item.restaurantName}</span>
                        <span>${item.price.toFixed(2)}</span>
                      </div>
                      <div className="quantity-control" aria-label={`${item.name} quantity controls`}>
                        <button onClick={() => setQuantity(item.id, item.quantity - 1)} aria-label={`Decrease ${item.name} quantity`}>−</button>
                        <span aria-label={`${item.quantity} in cart`}>{item.quantity}</span>
                        <button onClick={() => setQuantity(item.id, item.quantity + 1)} aria-label={`Increase ${item.name} quantity`}>+</button>
                      </div>
                    </article>
                  ))}
                </div>
                <button
                  className={`talk-cart-button ${activeCharacter?.type === 'cart' ? 'active' : ''}`}
                  onClick={(event) => activateCharacter({ type: 'cart' }, event)}
                  aria-label={activeCharacter?.type === 'cart' ? 'Conversing with your cart. Select again to end conversation.' : 'Talk to cart'}
                >
                  <CharacterFace small expression="friendly" talking={activeCharacter?.type === 'cart' && isSpeaking} />
                  <span aria-hidden="true">{activeCharacter?.type === 'cart' ? 'End cart conversation' : 'Talk to my cart'}</span>
                </button>
                <div className="cart-total"><span>Total</span><strong>${cartTotal.toFixed(2)}</strong></div>
                <button className="primary-button">Continue</button>
              </>
            )}
          </section>
        )}
      </main>

      {(view === 'home' || view === 'results') && (
        <div className="search-dock">
          <form className="bottom-search" onSubmit={submitSearch} role="search">
            <label className="sr-only" htmlFor="restaurant-search">Search restaurants or cuisines</label>
            <Icon name="search" size={28} />
            <input id="restaurant-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search restaurants or cuisines" />
            <button type="submit" aria-label="Search"><Icon name="sparkle" size={19} /><span>Ask</span></button>
          </form>
        </div>
      )}

      {view === 'restaurant' && cartCount > 0 && (
        <button className="sticky-cart" onClick={() => setView('cart')} aria-label={`Open cart. ${cartCount} items. $${cartTotal.toFixed(2)} total.`}>
          <span><Icon name="cart" size={23} /> {cartCount}</span><span>${cartTotal.toFixed(2)} · View cart</span>
        </button>
      )}

      <div className="sr-only" aria-hidden="true">
        {agentStatus}
      </div>
    </div>

    {conversationLockActive && activeEntity && (
      <>
        <div className="conversation-lock-scrim" aria-hidden="true" />
        <div className="conversation-lock-controls">
          <button
            ref={voiceOverProxyRef}
            type="button"
            className={`conversation-lock-button ${isListening ? 'is-listening' : ''}`}
            style={conversationButtonRect ? {
              left: `${conversationButtonRect.left}px`,
              top: `${conversationButtonRect.top}px`,
              width: `${conversationButtonRect.width}px`,
              height: `${conversationButtonRect.height}px`
            } : undefined}
            aria-label={`Conversing with ${activeEntity.name}. Select again to end conversation.`}
            onFocus={handleConversationControlFocus}
            onClick={endCharacter}
          >
            <CharacterFace small expression={activeEntity.character?.expression || 'friendly'} talking={isSpeaking} />
          </button>
          {view !== 'home' && (
            <button
              type="button"
              className="conversation-lock-back"
              aria-label="Go back and end conversation"
              onFocus={handleConversationControlFocus}
              onClick={goBack}
            >
              <Icon name="back" size={30} strokeWidth={2.35} />
            </button>
          )}
        </div>
      </>
    )}
    </>
  );

}

export default App;
