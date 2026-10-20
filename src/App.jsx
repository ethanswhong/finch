import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useConversation, useConversationClientTool } from '@elevenlabs/react';
import { categories, getMenuItem, getRestaurant, homeSections, restaurants } from './data/dummyData.js';
import RestaurantCard from './components/RestaurantCard.jsx';
import MenuCard from './components/MenuCard.jsx';
import UnifiedHeader from './components/UnifiedHeader.jsx';
import Icon from './components/Icon.jsx';
import CharacterFace from './components/CharacterFace.jsx';
import useFinchWakeWord, { isFinchStopPhrase } from './hooks/useFinchWakeWord.js';
import { playFinchCloseCue, playFinchOpenCue, primeFinchAudioCues, startFinchWaitingCue, stopFinchWaitingCue } from './audioFinchCues.js';

const AGENT_MODE = import.meta.env.VITE_AGENT_MODE || 'demo';
const AGENT_ID = import.meta.env.VITE_ELEVENLABS_AGENT_ID || '';
const USE_SIGNED_URL = import.meta.env.VITE_USE_SIGNED_URL === 'true';
const VOICEOVER_HANDOFF_DELAY_MS = Math.max(0, Number(import.meta.env.VITE_VOICEOVER_HANDOFF_DELAY_MS || 1700));
const ELEVENLABS_SPEECH_SPEED = Number(import.meta.env.VITE_ELEVENLABS_SPEED || 0);
const SONIOX_WAKE_ENABLED = String(import.meta.env.VITE_SONIOX_WAKE_ENABLED ?? 'true').toLowerCase() !== 'false';

const GENERAL_CONTEXT = Object.freeze({ type: 'general' });

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
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
  const cleaned = String(text)
    .toLowerCase()
    .replace(/[.!?,;:]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return /^(please )?(disconnect|end conversation|end the conversation|end this conversation|stop conversation|stop the conversation|stop this conversation|quit conversation|quit the conversation)( please| now| please now)?$/.test(cleaned);
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
    items: source.filter((item) => (item.menuSection || 'Menu') === title),
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
  { id: 'dessert', label: 'Dessert' },
];

const VEGGIE_TERMS = [
  'arugula', 'tomato', 'mushroom', 'mushrooms', 'vegetable', 'vegetables', 'pepper', 'peppers',
  'onion', 'onions', 'greens', 'lettuce', 'cabbage', 'cucumber', 'corn', 'carrot', 'carrots',
  'celery', 'pico', 'pico de gallo', 'avocado', 'basil', 'cilantro', 'beans', 'peas', 'green beans',
];
const PROTEIN_TERMS = [
  'chicken', 'grilled chicken', 'beef', 'steak', 'ham', 'prosciutto', 'pepperoni', 'salami', 'sausage',
  'turkey', 'salmon', 'tuna', 'tofu', 'lentils', 'egg', 'cheese', 'mozzarella', 'ricotta', 'parmesan',
  'protein', 'chicken wings',
];

function countIngredientMatches(item, terms) {
  const ingredients = (item?.ingredients || []).map((value) => String(value).toLowerCase());
  return ingredients.reduce((score, ingredient) => score + (terms.some((term) => ingredient.includes(term)) ? 1 : 0), 0);
}

function getDemoComparisonSignals(item) {
  return {
    proteinSignal: countIngredientMatches(item, PROTEIN_TERMS) + (item?.tags?.includes('high-protein') ? 2 : 0),
    vegetableSignal: countIngredientMatches(item, VEGGIE_TERMS),
    lighterSignal: (item?.tags?.includes('lighter') ? 3 : 0) + Math.max(0, Number(item?.healthScore || 0) - 5),
    richnessSignal: (item?.tags?.includes('rich') ? 3 : 0) + (item?.tags?.includes('lighter') ? -2 : 0),
  };
}

function contextsEqual(a, b) {
  if (!a || !b || a.type !== b.type) return false;
  if (a.type === 'restaurant') return a.restaurantId === b.restaurantId;
  if (a.type === 'menu') return a.itemId === b.itemId;
  return a.type === b.type;
}

function App() {
  const [view, setView] = useState('home');
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(null);
  const [resultTitle, setResultTitle] = useState('All restaurants');
  const [resultRestaurantIds, setResultRestaurantIds] = useState(restaurants.map((r) => r.id));
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState({});
  const [menuFilter, setMenuFilter] = useState('featured');
  const [currentContext, setCurrentContext] = useState(GENERAL_CONTEXT);
  const [activeCharacter, setActiveCharacter] = useState(null);
  const [agentStatus, setAgentStatus] = useState('');
  const [demoSpeaking, setDemoSpeaking] = useState(false);
  const [demoMuted] = useState(false);

  const mainInteractionRef = useRef(null);
  const finchButtonRef = useRef(null);
  const cartRef = useRef(cart);
  const currentContextRef = useRef(currentContext);
  const activeCharacterRef = useRef(activeCharacter);
  const activationGenerationRef = useRef(0);
  const focusRestoreTimerRef = useRef(null);
  const endingConversationRef = useRef(false);
  cartRef.current = cart;
  currentContextRef.current = currentContext;
  activeCharacterRef.current = activeCharacter;

  // Prime non-speech cue audio after the first genuine user interaction.
  // This is deliberately isolated from Finch navigation/client-tool handling.
  useEffect(() => {
    const prime = () => { void primeFinchAudioCues(); };
    window.addEventListener('pointerdown', prime, { once: true, capture: true, passive: true });
    window.addEventListener('keydown', prime, { once: true, capture: true });
    return () => {
      window.removeEventListener('pointerdown', prime, true);
      window.removeEventListener('keydown', prime, true);
    };
  }, []);

  const cartItems = useMemo(() => Object.entries(cart)
    .map(([itemId, quantity]) => {
      const item = getMenuItem(itemId);
      return item ? { ...item, quantity } : null;
    })
    .filter(Boolean), [cart]);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const selectedRestaurant = selectedRestaurantId ? getRestaurant(selectedRestaurantId) : null;

  const conversation = useConversation({
    ...(ELEVENLABS_SPEECH_SPEED >= 0.7 && ELEVENLABS_SPEECH_SPEED <= 1.2
      ? { overrides: { tts: { speed: ELEVENLABS_SPEECH_SPEED } } }
      : {}),
    onMessage: (message) => {
      const text = normalizeMessage(message);
      const source = getMessageSource(message);
      if (text) console.debug(`Voice conversation message${source ? ` from ${source}` : ''}:`, text);
      if (source === 'user') {
        const directedFinchStop = isFinchStopPhrase(text);
        const elevenLabsFallbackStop = isExplicitEndCommand(text) || (!SONIOX_WAKE_ENABLED && directedFinchStop);
        if (directedFinchStop && SONIOX_WAKE_ENABLED) {
          console.debug('[FINCH END] ElevenLabs transcript also heard a directed stop; Soniox remains the primary detector', { transcript: text });
        }
        if (elevenLabsFallbackStop) {
          console.warn('[FINCH END] source=elevenlabs-user-transcript', { transcript: text });
          void endCharacter({ reason: 'elevenlabs-user-transcript' });
        }
      }
    },
    onDisconnect: (details) => {
      console.warn('[FINCH DISCONNECT] ElevenLabs session disconnected', details || {});
      activationGenerationRef.current += 1;
      setAgentStatus('Conversation ended.');
      finishConversationState({ restoreFocus: true });
    },
    onError: (error) => {
      console.error(error);
      activationGenerationRef.current += 1;
      setAgentStatus('Voice conversation error. Finch is ready to try again.');
      finishConversationState({ restoreFocus: true });
    },
  });

  const isSpeaking = AGENT_MODE === 'elevenlabs' ? Boolean(conversation.isSpeaking) : demoSpeaking;
  const isListening = AGENT_MODE === 'elevenlabs' ? Boolean(conversation.isListening) : false;
  const conversationLockActive = Boolean(activeCharacter);

  function setContext(next) {
    const normalized = next || GENERAL_CONTEXT;
    currentContextRef.current = normalized;
    setCurrentContext(normalized);
  }

  function getContextEntity(context = currentContextRef.current) {
    if (!context) return { name: 'Finch', character: { expression: 'friendly' } };
    if (context.type === 'restaurant') return getRestaurant(context.restaurantId);
    if (context.type === 'menu') return getMenuItem(context.itemId);
    if (context.type === 'cart') return { name: 'your cart', character: { expression: 'friendly' } };
    return { name: 'Finch', character: { expression: 'friendly' } };
  }

  function getContextName(context = currentContextRef.current) {
    if (!context || context.type === 'general') return '';
    if (context.type === 'cart') return 'your cart';
    return getContextEntity(context)?.name || '';
  }

  function getContextTarget(context = currentContextRef.current) {
    if (!context) return null;
    if (context.type === 'restaurant') {
      const card = document.querySelector(`#restaurant-${CSS.escape(context.restaurantId)} .restaurant-card-focus-target`);
      if (card) return card;
      return document.querySelector(`[data-finch-restaurant-detail="${CSS.escape(context.restaurantId)}"]`);
    }
    if (context.type === 'menu') {
      return document.getElementById(`menu-${context.itemId}`) || document.getElementById(`cart-${context.itemId}`);
    }
    if (context.type === 'cart') return document.querySelector('.cart-page');
    return null;
  }

  function scrollToContext(context, behavior = 'smooth') {
    const tryScroll = (attempt = 0) => {
      const target = getContextTarget(context);
      if (target) {
        target.scrollIntoView({ behavior, block: 'center', inline: 'nearest' });
        return;
      }
      if (attempt < 5) window.setTimeout(() => tryScroll(attempt + 1), 70 + attempt * 35);
    };
    window.requestAnimationFrame(() => tryScroll());
  }

  function restoreContextFocus(context = currentContextRef.current) {
    if (focusRestoreTimerRef.current) window.clearTimeout(focusRestoreTimerRef.current);
    const attempt = (count = 0) => {
      const target = getContextTarget(context);
      if (target?.focus) {
        try { target.focus({ preventScroll: true }); } catch (_) { target.focus(); }
        return;
      }
      if (count < 5) focusRestoreTimerRef.current = window.setTimeout(() => attempt(count + 1), 70);
      else {
        try { finchButtonRef.current?.focus({ preventScroll: true }); } catch (_) {}
      }
    };
    focusRestoreTimerRef.current = window.setTimeout(() => attempt(), 90);
  }

  function finishConversationState({ restoreFocus = true } = {}) {
    const restoreContext = currentContextRef.current;
    setActiveCharacter(null);
    activeCharacterRef.current = null;
    setDemoSpeaking(false);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    if (restoreFocus) restoreContextFocus(restoreContext);
  }

  useEffect(() => {
    const layer = mainInteractionRef.current;
    if (!layer) return;
    layer.inert = conversationLockActive;
    if (conversationLockActive) layer.setAttribute('aria-hidden', 'true');
    else layer.removeAttribute('aria-hidden');
  }, [conversationLockActive]);

  useEffect(() => {
    if (!conversationLockActive || !activeCharacter) return;
    const timer = window.setTimeout(() => scrollToContext(activeCharacter, 'smooth'), 90);
    return () => window.clearTimeout(timer);
  }, [conversationLockActive, activeCharacter, view, selectedRestaurantId]);

  function commitCart(next, { source = 'unknown', itemId = null } = {}) {
    cartRef.current = next;
    setCart(next);
    console.warn('[CART] state updated', { source, itemId, cart: next });
    return next;
  }

  function setQuantity(itemId, quantity, { source = 'ui' } = {}) {
    const normalizedQuantity = Math.max(0, Math.floor(Number(quantity) || 0));
    const next = { ...cartRef.current };
    if (normalizedQuantity <= 0) delete next[itemId];
    else next[itemId] = normalizedQuantity;
    commitCart(next, { source, itemId });
    return normalizedQuantity;
  }

  function addItem(itemId, quantity = 1, { source = 'ui' } = {}) {
    const increment = Math.max(1, Math.floor(Number(quantity) || 1));
    const nextQuantity = (cartRef.current[itemId] || 0) + increment;
    commitCart({ ...cartRef.current, [itemId]: nextQuantity }, { source, itemId });
    return nextQuantity;
  }

  function getVisibleRestaurants({
    screen = view,
    selectedId = selectedRestaurantId,
    restaurantIds = resultRestaurantIds,
  } = {}) {
    if (screen === 'home') return restaurants;
    if (screen === 'results') return restaurantIds.map(getRestaurant).filter(Boolean);
    if (screen === 'restaurant' && selectedId) {
      const restaurant = getRestaurant(selectedId);
      return restaurant ? [restaurant] : [];
    }
    return [];
  }

  function getBrowseContext({
    screen = view,
    title = resultTitle,
    selectedId = selectedRestaurantId,
    query = search,
  } = {}) {
    if (screen === 'results') {
      return {
        screen,
        title,
        query: title.startsWith('Results for') ? query.trim() : '',
        description: `The shopper is browsing ${title}.`,
      };
    }
    if (screen === 'restaurant' && selectedId) {
      const restaurant = getRestaurant(selectedId);
      return { screen, title: restaurant?.name || 'Restaurant menu', query: '', description: `The shopper is on ${restaurant?.name || 'a restaurant'}'s menu page.` };
    }
    if (screen === 'cart') return { screen, title: 'Cart', query: '', description: 'The shopper is viewing the cart.' };
    return { screen: 'home', title: 'Home', query: '', description: 'The shopper is on the food-delivery home screen.' };
  }

  function getRestaurantDirectory() {
    return restaurants.map((restaurant) => ({
      id: restaurant.id,
      name: restaurant.name,
      rating: restaurant.rating,
      distance: restaurant.distance,
      eta: restaurant.eta,
      feature: restaurant.feature,
      categories: restaurant.categories,
      summary: restaurant.summary,
      priceLevel: restaurant.priceLevel,
      character: sanitizeCharacter(restaurant.character),
      menuPreview: restaurant.menu.slice(0, 8).map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        tags: item.tags,
        menuSection: item.menuSection,
        description: item.description,
        ingredients: item.ingredients,
        demoSignals: getDemoComparisonSignals(item),
      })),
    }));
  }

  function buildAgentContext(character = activeCharacterRef.current || currentContextRef.current, overrides = {}) {
    const screen = overrides.view ?? view;
    const selectedId = Object.prototype.hasOwnProperty.call(overrides, 'selectedRestaurantId') ? overrides.selectedRestaurantId : selectedRestaurantId;
    const resultIds = overrides.resultRestaurantIds ?? resultRestaurantIds;
    const browseTitle = overrides.resultTitle ?? resultTitle;
    const currentRestaurant = character?.restaurantId ? getRestaurant(character.restaurantId) : (selectedId ? getRestaurant(selectedId) : null);
    const currentItem = character?.itemId ? getMenuItem(character.itemId) : null;
    const contextCart = overrides.cart ?? cartRef.current;
    const contextCartItems = Object.entries(contextCart)
      .map(([itemId, quantity]) => {
        const item = getMenuItem(itemId);
        return item ? { ...item, quantity } : null;
      })
      .filter(Boolean);
    const contextCartTotal = contextCartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    return JSON.stringify({
      app: 'Doorbase narrative shopping prototype with Finch',
      screen,
      browseContext: getBrowseContext({ screen, title: browseTitle, selectedId, query: search }),
      currentCharacter: character || GENERAL_CONTEXT,
      currentFocusContext: currentContextRef.current,
      currentRestaurant: currentRestaurant ? {
        id: currentRestaurant.id,
        name: currentRestaurant.name,
        rating: currentRestaurant.rating,
        distance: currentRestaurant.distance,
        eta: currentRestaurant.eta,
        feature: currentRestaurant.feature,
        summary: currentRestaurant.summary,
        priceLevel: currentRestaurant.priceLevel,
        character: sanitizeCharacter(currentRestaurant.character),
        menu: currentRestaurant.menu.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          description: item.description,
          ingredients: item.ingredients,
          tags: item.tags,
          menuSection: item.menuSection,
          healthScore: item.healthScore,
          demoSignals: getDemoComparisonSignals(item),
          character: sanitizeCharacter(item.character),
        })),
      } : null,
      currentItem: currentItem ? {
        id: currentItem.id,
        name: currentItem.name,
        price: currentItem.price,
        description: currentItem.description,
        ingredients: currentItem.ingredients,
        tags: currentItem.tags,
        menuSection: currentItem.menuSection,
        healthScore: currentItem.healthScore,
        demoSignals: getDemoComparisonSignals(currentItem),
        character: sanitizeCharacter(currentItem.character),
        restaurantId: currentItem.restaurantId,
        restaurantName: currentItem.restaurantName,
      } : null,
      visibleRestaurants: getVisibleRestaurants({ screen, selectedId, restaurantIds: resultIds }).map((restaurant) => ({
        id: restaurant.id,
        name: restaurant.name,
        rating: restaurant.rating,
        distance: restaurant.distance,
        eta: restaurant.eta,
        feature: restaurant.feature,
        categories: restaurant.categories,
        summary: restaurant.summary,
      })),
      restaurantDirectory: getRestaurantDirectory(),
      cart: contextCartItems.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        description: item.description,
        ingredients: item.ingredients,
        tags: item.tags,
        healthScore: item.healthScore,
        demoSignals: getDemoComparisonSignals(item),
        restaurantId: item.restaurantId,
        restaurantName: item.restaurantName,
        character: sanitizeCharacter(item.character),
      })),
      cartTotal: contextCartTotal,
      interactionRules: [
        'This is a testing prototype: answer low-stakes qualitative shopping questions naturally and decisively from ingredients, tags, descriptions, and demoSignals.',
        'Do not mention APP_CONTEXT, missing prototype data, or prototype scores unless the shopper explicitly asks how the demo works.',
        'Never invent exact allergens, calories, medical claims, or exact nutrition numbers.',
        'For app-wide navigation or general questions, speak as neutral Finch rather than as a restaurant or food character.',
        'Entity ownership: when the shopper singles out one exact dish by name or clear reference — even casually, such as “I’m interested in Fiori”, “what about Fiori?”, or “tell me about this one” — make that dish the active character with focusMenuItem before answering as it. No explicit navigation verb is required.',
        'A restaurant speaks for restaurant-level questions and for comparisons spanning multiple dishes from that restaurant. A single named dish speaks for itself.',
        'In cart comparisons, name the item before or with any first-person phrase. Never answer with an ambiguous bare “me”.',
        'Keep turns concise and interruption-friendly.',
      ],
    });
  }

  function getInitialCharacterIntro(character) {
    if (!character || character.type === 'general') {
      if (view === 'results' && resultTitle) return `Hey, I’m Finch. You’re browsing ${resultTitle}. What would you like to figure out?`;
      return 'Hey, I’m Finch. What can I help you figure out?';
    }
    if (character.type === 'cart') return `Hey, I’m Finch. You have ${cartCount} ${cartCount === 1 ? 'item' : 'items'} in your cart. I can compare them or help you narrow things down.`;
    const entity = getContextEntity(character);
    return entity?.character?.intro || `Hey, I’m ${entity?.name || 'Finch'}. What would you like to know?`;
  }

  function getActiveEntityName(character = activeCharacterRef.current) {
    if (!character || character.type === 'general') return 'Finch';
    if (character.type === 'cart') return 'Finch';
    return getContextEntity(character)?.name || 'Finch';
  }

  function pushContextUpdate(character, overrides = {}) {
    if (AGENT_MODE !== 'elevenlabs' || conversation.status !== 'connected') return;
    conversation.sendContextualUpdate(`APP_CONTEXT UPDATED: ${buildAgentContext(character, overrides)}`);
  }

  async function startElevenLabs(character) {
    if (!AGENT_ID) {
      finishConversationState({ restoreFocus: false });
      setAgentStatus('Live voice is not configured. Add VITE_ELEVENLABS_AGENT_ID.');
      return;
    }

    try {
      if (conversation.status === 'connected') {
        pushContextUpdate(character);
        return;
      }

      const dynamicVariables = { character_intro: getInitialCharacterIntro(character) };
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
      finishConversationState({ restoreFocus: true });
      setAgentStatus('Could not start Finch. Check microphone permission and ElevenLabs setup.');
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

  async function startConversation(character, { source = 'button', event = null } = {}) {
    const target = character || GENERAL_CONTEXT;
    console.warn('[FINCH BEGIN] requested', { source, character: getActiveEntityName(target) });
    if (activeCharacterRef.current) {
      if (contextsEqual(activeCharacterRef.current, target)) {
        await endCharacter({ reason: 'button' });
        return;
      }
      activeCharacterRef.current = target;
      setActiveCharacter(target);
      setContext(target);
      scrollToContext(target, 'smooth');
      pushContextUpdate(target);
      return;
    }

    const generation = ++activationGenerationRef.current;
    activeCharacterRef.current = target;
    setActiveCharacter(target);
    setAgentStatus(`Finch conversation started with ${getActiveEntityName(target)}.`);

    // Keep Soniox running during the handoff. This avoids tearing down and
    // recreating the iOS microphone route while VoiceOver is finishing its
    // announcement. Once ElevenLabs is active, Soniox ignores wake phrases
    // and listens only for an explicit stop/bye Finch command.

    if (source === 'button') {
      // Always give the button announcement a clean lane before ElevenLabs opens
      // its WebRTC audio session. Web Safari does not expose reliable VoiceOver
      // detection, so a predictable, tunable delay is safer than a heuristic.
      await wait(VOICEOVER_HANDOFF_DELAY_MS);
      if (generation !== activationGenerationRef.current) return;
    }

    if (AGENT_MODE === 'elevenlabs') {
      await startElevenLabs(target);
    } else {
      await wait(220);
      if (generation !== activationGenerationRef.current) return;
      speakDemo(getInitialCharacterIntro(target));
    }
  }

  async function endCharacter({ reason = 'ui' } = {}) {
    if (endingConversationRef.current) {
      console.warn('[FINCH END] duplicate end request ignored', { reason, status: conversation.status });
      return;
    }

    endingConversationRef.current = true;
    console.warn('[FINCH END] requested', {
      reason,
      status: conversation.status,
      character: getActiveEntityName(activeCharacterRef.current),
    });

    activationGenerationRef.current += 1;
    const shouldCallEnd = AGENT_MODE === 'elevenlabs' && conversation.status !== 'disconnected';
    try {
      if (shouldCallEnd) await conversation.endSession();
    } catch (error) {
      console.warn('[FINCH END] ElevenLabs endSession failed', { reason, error });
    } finally {
      if (reason !== 'disconnect') finishConversationState({ restoreFocus: true });
      setAgentStatus('Conversation ended.');
      endingConversationRef.current = false;
    }
  }

  const wake = useFinchWakeWord({
    enabled: SONIOX_WAKE_ENABLED,
    conversationActive: conversationLockActive,
    onWake: async (transcript) => {
      console.warn('[FINCH BEGIN] Soniox wake accepted', { transcript });
      void playFinchOpenCue();
      startFinchWaitingCue({ delayMs: 380 });
      try {
        await startConversation(currentContextRef.current || GENERAL_CONTEXT, { source: 'wake' });
      } finally {
        stopFinchWaitingCue();
      }
    },
    onStop: async (transcript) => {
      console.warn('[FINCH END] Soniox stop accepted', { transcript });
      stopFinchWaitingCue();
      void playFinchCloseCue();
      if (activeCharacterRef.current) await endCharacter({ reason: 'soniox-stop' });
    },
  });

  useEffect(() => {
    if (AGENT_MODE !== 'elevenlabs' || conversation.status !== 'connected') return;
    conversation.sendContextualUpdate(`APP_CONTEXT UPDATED: ${buildAgentContext()}`);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, selectedRestaurantId, resultRestaurantIds.join('|'), JSON.stringify(cart), JSON.stringify(activeCharacter), conversation.status]);

  useConversationClientTool('focusRestaurant', async ({ restaurantId }) => {
    const restaurant = getRestaurant(restaurantId);
    if (!restaurant) return `Restaurant ${restaurantId} was not found.`;

    const next = { type: 'restaurant', restaurantId };
    const nextResultIds = resultRestaurantIds.includes(restaurantId)
      ? resultRestaurantIds
      : [...resultRestaurantIds, restaurantId];
    const nextTitle = view === 'results' && resultTitle ? resultTitle : 'Restaurants';

    // Non-blocking experiment: semantic context changes immediately. Visual
    // scroll/focus follows independently and is not treated as agent state.
    setResultRestaurantIds(nextResultIds);
    setResultTitle(nextTitle);
    setSelectedRestaurantId(null);
    setView('results');
    setContext(next);
    activeCharacterRef.current = next;
    setActiveCharacter(next);
    pushContextUpdate(next, {
      view: 'results',
      selectedRestaurantId: null,
      resultTitle: nextTitle,
      resultRestaurantIds: nextResultIds,
    });
    scrollToContext(next, 'smooth');
    console.warn('[NAV TOOL] focusRestaurant dispatched (non-blocking)', { restaurantId, restaurantName: restaurant.name });
    return `${restaurant.name} is now the active restaurant.`;
  });

  useConversationClientTool('openRestaurant', async ({ restaurantId }) => {
    const restaurant = getRestaurant(restaurantId);
    if (!restaurant) return `Restaurant ${restaurantId} was not found.`;

    const next = { type: 'restaurant', restaurantId };
    setSelectedRestaurantId(restaurantId);
    setMenuFilter('featured');
    setView('restaurant');
    setContext(next);
    activeCharacterRef.current = next;
    setActiveCharacter(next);
    pushContextUpdate(next, { view: 'restaurant', selectedRestaurantId: restaurantId });
    scrollToContext(next, 'smooth');
    console.warn('[NAV TOOL] openRestaurant dispatched (non-blocking)', { restaurantId, restaurantName: restaurant.name });
    return `${restaurant.name}'s menu is open and ${restaurant.name} is the active restaurant.`;
  });

  useConversationClientTool('focusMenuItem', async ({ itemId }) => {
    const item = getMenuItem(itemId);
    if (!item) return `Menu item ${itemId} was not found.`;

    const next = { type: 'menu', restaurantId: item.restaurantId, itemId };
    setSelectedRestaurantId(item.restaurantId);
    setMenuFilter('featured');
    setView('restaurant');
    setContext(next);
    activeCharacterRef.current = next;
    setActiveCharacter(next);
    pushContextUpdate(next, { view: 'restaurant', selectedRestaurantId: item.restaurantId });
    scrollToContext(next, 'smooth');
    console.warn('[NAV TOOL] focusMenuItem dispatched (non-blocking)', { itemId, itemName: item.name, restaurantId: item.restaurantId });
    return `${item.name} is now the active dish.`;
  });

  useConversationClientTool('addCartItem', async ({ itemId, quantity = 1 }) => {
    const item = getMenuItem(itemId);
    if (!item) {
      console.warn('[CART TOOL] addCartItem rejected: unknown item', { itemId, quantity });
      return `Menu item ${itemId} was not found.`;
    }
    const increment = Math.max(1, Math.floor(Number(quantity) || 1));
    const nextQuantity = addItem(itemId, increment, { source: 'elevenlabs:addCartItem' });
    console.warn('[CART TOOL] addCartItem applied', { itemId, itemName: item.name, increment, nextQuantity });
    await wait(0);
    pushContextUpdate(activeCharacterRef.current || currentContextRef.current || GENERAL_CONTEXT, { cart: cartRef.current });
    return `Added ${increment} ${item.name} to the cart. ${item.name} now has quantity ${nextQuantity}.`;
  });

  useConversationClientTool('removeCartItem', async ({ itemId }) => {
    const item = getMenuItem(itemId);
    if (!item) {
      console.warn('[CART TOOL] removeCartItem rejected: unknown item', { itemId });
      return `Menu item ${itemId} was not found.`;
    }
    setQuantity(itemId, 0, { source: 'elevenlabs:removeCartItem' });
    console.warn('[CART TOOL] removeCartItem applied', { itemId, itemName: item.name });
    await wait(0);
    pushContextUpdate(activeCharacterRef.current || currentContextRef.current || GENERAL_CONTEXT, { cart: cartRef.current });
    return `Removed ${item.name} from the cart.`;
  });

  useConversationClientTool('setCartItemQuantity', async ({ itemId, quantity }) => {
    const item = getMenuItem(itemId);
    if (!item) {
      console.warn('[CART TOOL] setCartItemQuantity rejected: unknown item', { itemId, quantity });
      return `Menu item ${itemId} was not found.`;
    }
    const nextQuantity = setQuantity(itemId, Number(quantity), { source: 'elevenlabs:setCartItemQuantity' });
    console.warn('[CART TOOL] setCartItemQuantity applied', { itemId, itemName: item.name, nextQuantity });
    await wait(0);
    pushContextUpdate(activeCharacterRef.current || currentContextRef.current || GENERAL_CONTEXT, { cart: cartRef.current });
    return nextQuantity > 0
      ? `Set ${item.name} quantity to ${nextQuantity}.`
      : `Removed ${item.name} from the cart.`;
  });

  useConversationClientTool('openCart', async () => {
    const next = { type: 'cart' };
    setView('cart');
    setContext(next);
    activeCharacterRef.current = next;
    setActiveCharacter(next);
    pushContextUpdate(next, { view: 'cart' });
    scrollToContext(next, 'smooth');
    console.warn('[NAV TOOL] openCart dispatched (non-blocking)', { cartCount });
    return `The cart is open with ${cartCount} items.`;
  });

  useConversationClientTool('goBack', async () => {
    let nextView = 'home';
    let nextSelectedId = null;
    let nextContext = GENERAL_CONTEXT;

    if (view === 'restaurant') {
      nextView = 'results';
      nextSelectedId = null;
    } else if (view === 'cart' && selectedRestaurantId) {
      nextView = 'restaurant';
      nextSelectedId = selectedRestaurantId;
      nextContext = { type: 'restaurant', restaurantId: selectedRestaurantId };
    }

    navigateBack({ keepConversation: true });
    activeCharacterRef.current = nextContext;
    setActiveCharacter(nextContext);
    setContext(nextContext);
    pushContextUpdate(nextContext, {
      view: nextView,
      selectedRestaurantId: nextSelectedId,
      resultTitle,
      resultRestaurantIds,
    });
    if (nextContext.type !== 'general') scrollToContext(nextContext, 'smooth');
    console.warn('[NAV TOOL] goBack dispatched (non-blocking)', { nextView, nextContext });
    return nextContext.type === 'general'
      ? 'Went back one screen. Continue as neutral Finch.'
      : `Went back to ${getContextName(nextContext)}.`;
  });

  function openCategory(name) {
    const matches = name === 'Deals'
      ? (homeSections.find((section) => section.id === 'deals')?.restaurantIds || []).map(getRestaurant).filter(Boolean)
      : restaurants.filter((restaurant) => restaurant.categories.some((category) => category.toLowerCase() === name.toLowerCase()));
    setResultTitle(name === 'Deals' ? 'Deals for you' : `${name} restaurants`);
    setResultRestaurantIds((matches.length ? matches : restaurants.slice(0, 5)).map((restaurant) => restaurant.id));
    setView('results');
    setContext(GENERAL_CONTEXT);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function submitSearch(event) {
    event?.preventDefault();
    const q = search.trim().toLowerCase();
    if (!q) return;
    const matches = restaurants.filter((restaurant) =>
      restaurant.name.toLowerCase().includes(q) ||
      restaurant.categories.some((category) => category.toLowerCase().includes(q)) ||
      restaurant.feature.toLowerCase().includes(q));
    setResultTitle(matches.length ? `Results for “${search.trim()}”` : 'Try one of these restaurants');
    setResultRestaurantIds((matches.length ? matches : restaurants.slice(0, 6)).map((restaurant) => restaurant.id));
    setView('results');
    setContext(GENERAL_CONTEXT);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function openRestaurant(id) {
    const next = { type: 'restaurant', restaurantId: id };
    setSelectedRestaurantId(id);
    setMenuFilter('featured');
    setView('restaurant');
    setContext(next);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function openCartFromUI() {
    setView('cart');
    setContext({ type: 'cart' });
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function navigateBack({ keepConversation = false } = {}) {
    if (view === 'restaurant') {
      setView('results');
      setSelectedRestaurantId(null);
      setContext(GENERAL_CONTEXT);
    } else if (view === 'cart') {
      if (selectedRestaurantId) {
        setView('restaurant');
        setContext({ type: 'restaurant', restaurantId: selectedRestaurantId });
      } else {
        setView('home');
        setContext(GENERAL_CONTEXT);
      }
    } else {
      setView('home');
      setContext(GENERAL_CONTEXT);
    }
    if (!keepConversation) window.scrollTo({ top: 0, behavior: 'auto' });
    else window.setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 70);
  }

  async function goBackFromUI() {
    if (activeCharacterRef.current) await endCharacter({ reason: 'back-button' });
    navigateBack({ keepConversation: false });
  }

  function openHomeSection(section) {
    setResultTitle(section.title);
    setResultRestaurantIds(section.restaurantIds);
    setView('results');
    setContext(GENERAL_CONTEXT);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function scrollToElement(id) {
    window.requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  function scrollToNextHomeSection(index) {
    const next = homeSections[index + 1];
    if (next) scrollToElement(`home-section-${next.id}`);
  }

  const restaurantMenuSections = buildMenuSections(selectedRestaurant, menuFilter);
  const filteredMenuCount = restaurantMenuSections.reduce((sum, section) => sum + section.items.length, 0);
  const headerTitle = view === 'results' ? resultTitle : view === 'cart' ? 'Cart' : '';
  const headerContextName = getContextName(currentContext) || (view === 'results' ? resultTitle : view === 'cart' ? 'your cart' : '');

  return (
    <div className={`app-shell ${conversationLockActive ? 'conversation-lock-active' : ''}`}>
      <UnifiedHeader
        view={view}
        title={headerTitle}
        selectedRestaurant={selectedRestaurant}
        cartCount={cartCount}
        conversationActive={conversationLockActive}
        contextName={headerContextName}
        onFinch={(event) => conversationLockActive
          ? void endCharacter({ reason: 'header-button' })
          : void startConversation(currentContextRef.current || GENERAL_CONTEXT, { source: 'button', event })}
        finchButtonRef={finchButtonRef}
        onBack={goBackFromUI}
        onCart={openCartFromUI}
        onGeneralFocus={() => setContext(GENERAL_CONTEXT)}
      />

      <div
        className="main-interaction-layer"
        ref={mainInteractionRef}
        onFocusCapture={(event) => {
          const target = event.target;
          if (!(target instanceof Element)) return;
          if (target.closest('[data-finch-target]')) return;
          if (target.closest('[data-finch-preserve-context]')) return;
          setContext(GENERAL_CONTEXT);
        }}
      >
        <div id="main-content">
          {view === 'home' && (
            <>
              <div className="welcome-section" id="home-top">
                <div className="section-heading-row welcome-heading-row">
                  <h1 role="presentation" id="welcome-heading">Hello Weekend!</h1>
                  <button className="section-icon-button" type="button" onClick={() => scrollToElement(`home-section-${homeSections[0]?.id}`)} aria-label="Skip to National Favorites">
                    <Icon name="arrowDown" />
                  </button>
                </div>
                <div className="category-grid">
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
              </div>

              {homeSections.map((section, index) => (
                <div className="home-section" id={`home-section-${section.id}`} key={section.id}>
                  <div className="section-heading-row">
                    <h2 role="presentation" id={`section-${section.id}`}>{section.title}</h2>
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
                  <div className="home-restaurant-strip">
                    {section.restaurantIds.map((id) => {
                      const restaurant = getRestaurant(id);
                      const active = activeCharacter?.type === 'restaurant' && activeCharacter.restaurantId === id;
                      return (
                        <RestaurantCard
                          compact
                          key={id}
                          restaurant={restaurant}
                          onOpen={() => openRestaurant(id)}
                          onContext={() => setContext({ type: 'restaurant', restaurantId: id })}
                          active={active}
                          talking={active && isSpeaking}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </>
          )}

          {view === 'results' && (
            <div className="results-section">
              <div className="restaurant-list">
                {resultRestaurantIds.map((id) => {
                  const restaurant = getRestaurant(id);
                  if (!restaurant) return null;
                  const active = activeCharacter?.type === 'restaurant' && activeCharacter.restaurantId === id;
                  return (
                    <RestaurantCard
                      key={id}
                      restaurant={restaurant}
                      onOpen={() => openRestaurant(id)}
                      onContext={() => setContext({ type: 'restaurant', restaurantId: id })}
                      active={active}
                      talking={active && isSpeaking}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {view === 'restaurant' && selectedRestaurant && (
            <div className="restaurant-page">
              <div
                className={`restaurant-hero-fullbleed ${activeCharacter?.type === 'restaurant' && activeCharacter.restaurantId === selectedRestaurant.id ? 'conversation-active-card' : ''}`}
                data-finch-restaurant-detail={selectedRestaurant.id}
                data-finch-target="restaurant"
                tabIndex={0}
                aria-label={`${selectedRestaurant.name}. ${selectedRestaurant.rating} stars. ${selectedRestaurant.distance} miles away. ${selectedRestaurant.eta}. ${selectedRestaurant.summary}`}
                onFocus={() => setContext({ type: 'restaurant', restaurantId: selectedRestaurant.id })}
                onPointerDown={() => setContext({ type: 'restaurant', restaurantId: selectedRestaurant.id })}
              >
                <img src={selectedRestaurant.image} alt="" className="restaurant-hero-image" aria-hidden="true" />
                <div className="restaurant-hero-shade" aria-hidden="true" />
                {activeCharacter?.type === 'restaurant' && activeCharacter.restaurantId === selectedRestaurant.id && isSpeaking && (
                  <div className="context-character-overlay context-character-overlay-hero" aria-hidden="true">
                    <CharacterFace expression={selectedRestaurant.character.expression} talking label={selectedRestaurant.name} />
                  </div>
                )}
                <div className="hero-restaurant-copy" aria-hidden="true">
                  <div>
                    <h1 role="presentation" id="restaurant-title">{selectedRestaurant.name}</h1>
                    <p>{selectedRestaurant.priceLevel} · {selectedRestaurant.categories.join(' · ')} · {selectedRestaurant.distance} mi · Pricing &amp; fees</p>
                  </div>
                </div>
              </div>

              <div className="restaurant-content">
                <div className="service-card">
                  <div className="service-top-row">
                    <div className="segmented-control">
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
                </div>

                <div className="restaurant-block deals-section">
                  <div className="section-heading-row">
                    <h2 role="presentation" id="deals-title">Deals &amp; benefits</h2>
                    <button className="section-icon-button" type="button" aria-label="View all deals"><Icon name="arrowRight" /></button>
                  </div>
                  <div className="deal-card-row">
                    {(selectedRestaurant.deals || []).map((deal, index) => (
                      <div className="benefit-card" key={`${deal.title}-${index}`}>
                        <Icon name="tag" size={30} />
                        <div><strong>{deal.title}</strong><span>{deal.subtitle}</span></div>
                        <button type="button">{deal.cta || 'See items'}</button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="restaurant-block discovery-section">
                  <h2 role="presentation" id="discovery-title">What can we help you find?</h2>
                  <div className="filter-chip-row">
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
                </div>

                <div className="restaurant-menu-nav" id="restaurant-menu-nav">
                  <div className="menu-nav-tools" aria-hidden="true">
                    <span className="menu-nav-icon"><Icon name="menu" size={27} /></span>
                    <span className="menu-nav-icon"><Icon name="search" size={25} /></span>
                  </div>
                  <div className="restaurant-tab-strip">
                    {restaurantMenuSections.map((section, index) => (
                      <button type="button" className={index === 0 ? 'selected' : ''} key={section.id} onClick={() => scrollToElement(`menu-section-${section.id}`)}>{section.title}</button>
                    ))}
                  </div>
                </div>

                {filteredMenuCount === 0 && (
                  <div className="restaurant-block empty-filter-state">
                    <h2 role="presentation">No exact matches</h2>
                    <p>Try another filter to browse the rest of the menu.</p>
                    <button type="button" className="soft-button" onClick={() => setMenuFilter('featured')}>Show full menu</button>
                  </div>
                )}

                {restaurantMenuSections.map((section, sectionIndex) => (
                  <div className="menu-section restaurant-block" id={`menu-section-${section.id}`} key={section.id}>
                    <h2 role="presentation" id={`menu-heading-${section.id}`}>{section.title}</h2>
                    {sectionIndex === 0 && menuFilter !== 'featured' && <p className="section-help">Showing {filteredMenuCount} items tagged “{DISCOVERY_FILTERS.find((filter) => filter.id === menuFilter)?.label}”.</p>}
                    {sectionIndex === 0 && menuFilter === 'featured' && <p className="section-help">Move through dishes one at a time, then use Finch in the top bar whenever you want to ask about the focused item.</p>}
                    <div className="menu-grid">
                      {section.items.map((item) => {
                        const active = activeCharacter?.type === 'menu' && activeCharacter.itemId === item.id;
                        return (
                          <MenuCard
                            key={item.id}
                            item={item}
                            restaurant={selectedRestaurant}
                            quantity={cart[item.id] || 0}
                            onAdd={() => addItem(item.id, 1, { source: 'menu-card' })}
                            onContext={() => setContext({ type: 'menu', restaurantId: selectedRestaurant.id, itemId: item.id })}
                            active={active}
                            talking={active && isSpeaking}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}

                <div className="restaurant-block reviews-section" id="reviews-section">
                  <div className="section-heading-row">
                    <div>
                      <h2 role="presentation" id="reviews-title">Reviews</h2>
                      <p>{selectedRestaurant.reviews} ratings · 50+ public reviews</p>
                    </div>
                    <button className="soft-button" type="button">Add review</button>
                  </div>
                  <div className="review-highlight-card">
                    <div className="rating-orb"><strong>{selectedRestaurant.rating}</strong><Icon name="star" size={18} /></div>
                    <div>
                      <h3 role="presentation">✦ Review highlights</h3>
                      <p>{selectedRestaurant.reviewHighlight}</p>
                      <span>AI-generated based on reviews</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {view === 'cart' && (
            <div className="cart-page" tabIndex={-1}>
              <h1 role="presentation" className="sr-only" id="cart-title">Cart</h1>
              {!cartItems.length ? <p className="empty-state">Your cart is empty.</p> : (
                <>
                  <div className="cart-list">
                    {cartItems.map((item) => {
                      const selectItemContext = () => setContext({ type: 'menu', restaurantId: item.restaurantId, itemId: item.id });
                      const active = activeCharacter?.type === 'menu' && activeCharacter.itemId === item.id;
                      return (
                        <div
                          className={`cart-item cart-item-focus-target ${active ? 'conversation-active-card' : ''}`}
                          key={item.id}
                          id={`cart-${item.id}`}
                          tabIndex={0}
                          data-finch-target="menu"
                          aria-label={`${item.name}. ${item.restaurantName}. ${item.price.toFixed(2)} dollars. Quantity ${item.quantity}.`}
                          onFocus={selectItemContext}
                          onPointerDown={selectItemContext}
                        >
                          <div className="cart-product-side" aria-hidden="true">
                            <div className="cart-thumb-wrap">
                              <img src={item.image} alt="" />
                              {active && isSpeaking && (
                                <div className="context-character-overlay context-character-overlay-cart">
                                  <CharacterFace expression={item.character.expression} talking label={item.name} />
                                </div>
                              )}
                            </div>
                            <div className="cart-item-copy">
                              <strong>{item.name}</strong><span>{item.restaurantName}</span><span>${item.price.toFixed(2)}</span>
                            </div>
                          </div>
                          <div className="quantity-control" onFocusCapture={selectItemContext} onPointerDownCapture={selectItemContext}>
                            <button
                              type="button"
                              aria-label={`Decrease ${item.name} quantity. Current quantity ${item.quantity}.`}
                              onClick={(event) => { event.stopPropagation(); setQuantity(item.id, item.quantity - 1, { source: 'cart-minus' }); }}
                            >−</button>
                            <span aria-hidden="true">{item.quantity}</span>
                            <button
                              type="button"
                              aria-label={`Increase ${item.name} quantity. Current quantity ${item.quantity}.`}
                              onClick={(event) => { event.stopPropagation(); setQuantity(item.id, item.quantity + 1, { source: 'cart-plus' }); }}
                            >+</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="cart-total"><span>Total</span><strong>${cartTotal.toFixed(2)}</strong></div>
                  <button className="primary-button">Continue</button>
                </>
              )}
            </div>
          )}
        </div>

        {(view === 'home' || view === 'results') && (
          <div className="search-dock">
            <form className="bottom-search" onSubmit={submitSearch}>
              <label className="sr-only" htmlFor="restaurant-search">Search restaurants or cuisines</label>
              <Icon name="search" size={28} />
              <input id="restaurant-search" type="search" enterKeyHint="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search restaurants or cuisines" />
            </form>
          </div>
        )}

        {view === 'restaurant' && cartCount > 0 && (
          <button className="sticky-cart" onClick={openCartFromUI} aria-label={`Open cart. ${cartCount} items. $${cartTotal.toFixed(2)} total.`}>
            <span><Icon name="cart" size={23} /> {cartCount}</span><span>${cartTotal.toFixed(2)} · View cart</span>
          </button>
        )}
      </div>

      {conversationLockActive && (
        <div
          className="conversation-lock-scrim"
          aria-hidden="true"
          onWheel={(event) => event.preventDefault()}
          onTouchMove={(event) => event.preventDefault()}
        />
      )}

      <div className="sr-only" aria-hidden="true">{agentStatus} Wake listener: {wake.status}. Speaking: {String(isSpeaking)}. Listening: {String(isListening)}.</div>
    </div>
  );
}

export default App;
