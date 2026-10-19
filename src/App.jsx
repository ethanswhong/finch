import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useConversation, useConversationClientTool } from '@elevenlabs/react';
import { categories, getMenuItem, getRestaurant, homeSections, restaurants } from './data/dummyData.js';
import RestaurantCard from './components/RestaurantCard.jsx';
import MenuCard from './components/MenuCard.jsx';
import CharacterFace from './components/CharacterFace.jsx';
import Icon from './components/Icon.jsx';

const AGENT_MODE = import.meta.env.VITE_AGENT_MODE || 'demo';
const AGENT_ID = import.meta.env.VITE_ELEVENLABS_AGENT_ID || '';
const USE_SIGNED_URL = import.meta.env.VITE_USE_SIGNED_URL === 'true';

function normalizeMessage(message) {
  if (!message) return '';
  if (typeof message === 'string') return message;
  return message.message || message.text || message.source || '';
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
  const heroRef = useRef(null);
  const activeCharacterRef = useRef(activeCharacter);
  activeCharacterRef.current = activeCharacter;

  const conversation = useConversation({
    onMessage: (message) => {
      // Voice-first experience: the agent speaks aloud; no visible transcript/chat UI is shown.
      const text = normalizeMessage(message);
      if (text) console.debug('Voice agent message:', text);
    },
    onError: (error) => {
      console.error(error);
      setAgentStatus('Voice conversation error. Please tap the character button again to retry.');
    }
  });

  const elevenConnected = AGENT_MODE === 'elevenlabs' && conversation.status === 'connected';
  const isSpeaking = AGENT_MODE === 'elevenlabs' ? Boolean(conversation.isSpeaking) : demoSpeaking;
  const isListening = AGENT_MODE === 'elevenlabs' ? Boolean(conversation.isListening) : false;
  const isMuted = AGENT_MODE === 'elevenlabs' ? Boolean(conversation.isMuted) : demoMuted;

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

  async function activateCharacter(character) {
    const same = activeCharacter && JSON.stringify(activeCharacter) === JSON.stringify(character);
    if (same) {
      await endCharacter();
      return;
    }
    setActiveCharacter(character);
    const entity = getCharacterEntity(character);
    setAgentStatus(`Conversation started with ${entity?.name || 'character'}. Tap the character button again to end.`);
    if (AGENT_MODE === 'elevenlabs') await startElevenLabs(character);
    else speakDemo(entity?.character?.intro || 'Ready to talk.');
  }

  async function endCharacter() {
    if (AGENT_MODE === 'elevenlabs' && conversation.status === 'connected') {
      try { await conversation.endSession(); } catch (error) { console.error(error); }
    }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setDemoSpeaking(false);
    setActiveCharacter(null);
    setAgentStatus('Conversation ended.');
  }

  useEffect(() => {
    if (AGENT_MODE !== 'elevenlabs' || conversation.status !== 'connected') return;
    conversation.sendContextualUpdate(`APP_CONTEXT UPDATED: ${buildAgentContext()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, selectedRestaurantId, resultRestaurantIds.join('|'), JSON.stringify(cart), JSON.stringify(activeCharacter), conversation.status]);

  useEffect(() => {
    if (!pendingFocusId) return;
    const timer = window.setTimeout(() => {
      const el = document.querySelector(`#${CSS.escape(pendingFocusId)} .restaurant-summary, #${CSS.escape(pendingFocusId)} .character-trigger, #${CSS.escape(pendingFocusId)} button`);
      if (el?.focus) el.focus();
      setPendingFocusId(null);
    }, 80);
    return () => clearTimeout(timer);
  }, [pendingFocusId, view, resultRestaurantIds, selectedRestaurantId]);

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
  useConversationClientTool('focusRestaurant', ({ restaurantId }) => {
    const restaurant = getRestaurant(restaurantId);
    if (!restaurant) return `Restaurant ${restaurantId} was not found.`;
    setResultTitle('Recommended restaurant');
    setResultRestaurantIds([restaurantId, ...restaurants.filter((r) => r.id !== restaurantId).slice(0, 4).map((r) => r.id)]);
    setView('results');
    setPendingFocusId(`restaurant-${restaurantId}`);
    setActiveCharacter({ type: 'restaurant', restaurantId });
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

  useConversationClientTool('focusMenuItem', ({ itemId }) => {
    const item = getMenuItem(itemId);
    if (!item) return `Menu item ${itemId} was not found.`;
    setSelectedRestaurantId(item.restaurantId);
    setView('restaurant');
    setPendingFocusId(`menu-${itemId}`);
    setActiveCharacter({ type: 'menu', restaurantId: item.restaurantId, itemId });
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
      window.scrollTo(0, 0);
      return;
    }
    const matches = restaurants.filter((restaurant) => restaurant.categories.some((category) => category.toLowerCase() === name.toLowerCase()));
    setResultTitle(`${name} restaurants`);
    setResultRestaurantIds(matches.length ? matches.map((r) => r.id) : restaurants.slice(0, 5).map((r) => r.id));
    setView('results');
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
    window.scrollTo(0, 0);
  }

  function openRestaurant(id) {
    setSelectedRestaurantId(id);
    setMenuFilter('featured');
    setView('restaurant');
    window.scrollTo(0, 0);
  }

  function goBack() {
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
    window.scrollTo(0, 0);
  }

  function scrollToNextHomeSection(index) {
    const next = homeSections[index + 1];
    if (next) scrollToElement(`home-section-${next.id}`);
  }

  const headerTitle = view === 'results' ? resultTitle : view === 'cart' ? 'Cart' : '';

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>

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
              <h1>{headerTitle}</h1>
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
                  <button key={category.name} className="category-card" onClick={() => openCategory(category.name)} aria-label={`Browse ${category.name} restaurants`}>
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
                    return <RestaurantCard compact key={id} restaurant={restaurant} onOpen={() => openRestaurant(id)} onCharacter={() => activateCharacter({ type: 'restaurant', restaurantId: id })} active={active} talking={active && isSpeaking} listening={active && isListening} />;
                  })}
                </div>
              </section>
            ))}
          </>
        )}

        {view === 'results' && (
          <section className="results-section" aria-labelledby="results-title">
            <h2 className="sr-only" id="results-title">{resultTitle}</h2>
            <div className="restaurant-list">
              {resultRestaurantIds.map((id) => {
                const restaurant = getRestaurant(id);
                if (!restaurant) return null;
                const active = activeCharacter?.type === 'restaurant' && activeCharacter.restaurantId === id;
                return <RestaurantCard key={id} restaurant={restaurant} onOpen={() => openRestaurant(id)} onCharacter={() => activateCharacter({ type: 'restaurant', restaurantId: id })} active={active} talking={active && isSpeaking} listening={active && isListening} />;
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

            <div className="restaurant-hero-fullbleed" ref={heroRef}>
              <img src={selectedRestaurant.image} alt={selectedRestaurant.imageAlt} className="restaurant-hero-image" />
              <div className="restaurant-hero-shade" />

              {activeCharacter?.type === 'restaurant' && activeCharacter.restaurantId === selectedRestaurant.id && (
                <div className="face-overlay"><CharacterFace expression={selectedRestaurant.character.expression} talking={isSpeaking} /></div>
              )}

              <div className="hero-restaurant-copy">
                <button
                  type="button"
                  className={`restaurant-agent-avatar ${activeCharacter?.type === 'restaurant' && activeCharacter.restaurantId === selectedRestaurant.id ? 'active' : ''} ${activeCharacter?.type === 'restaurant' && activeCharacter.restaurantId === selectedRestaurant.id && isListening ? 'is-listening' : ''}`}
                  onClick={() => activateCharacter({ type: 'restaurant', restaurantId: selectedRestaurant.id })}
                  aria-label={activeCharacter?.type === 'restaurant' && activeCharacter.restaurantId === selectedRestaurant.id ? `End conversation with ${selectedRestaurant.name}` : `Introduce ${selectedRestaurant.name} and start a voice conversation`}
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
                <section className="restaurant-block empty-filter-state" aria-live="polite">
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
                        <MenuCard key={item.id} item={item} restaurant={selectedRestaurant} quantity={cart[item.id] || 0} onAdd={() => addItem(item.id)} onCharacter={() => activateCharacter({ type: 'menu', restaurantId: selectedRestaurant.id, itemId: item.id })} active={active} talking={active && isSpeaking} listening={active && isListening} />
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
                <button className={`talk-cart-button ${activeCharacter?.type === 'cart' ? 'active' : ''}`} onClick={() => activateCharacter({ type: 'cart' })} aria-pressed={activeCharacter?.type === 'cart'}>
                  <CharacterFace small expression="friendly" talking={activeCharacter?.type === 'cart' && isSpeaking} />
                  {activeCharacter?.type === 'cart' ? 'End cart conversation' : 'Talk to my cart'}
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

      <div className="sr-only" role="status" aria-live="polite">
        {agentStatus}
        {activeCharacter && activeEntity ? ` ${activeEntity.name} voice conversation is active. ${isSpeaking ? 'Character is speaking.' : isListening ? 'Character is listening.' : elevenConnected ? 'Character is ready.' : ''}` : ''}
      </div>
    </div>
  );

}

export default App;
