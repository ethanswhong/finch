import React from 'react';
import Icon from './Icon.jsx';
import FinchHeaderButton from './FinchHeaderButton.jsx';

export default function UnifiedHeader({
  view,
  title,
  selectedRestaurant,
  cartCount,
  conversationActive,
  contextName,
  onFinch,
  finchButtonRef,
  onBack,
  onCart,
  onGeneralFocus,
}) {
  const isHome = view === 'home';
  const isRestaurant = view === 'restaurant';
  const controlsHidden = conversationActive;
  const finchSurface = isHome ? 'round' : 'plain';

  return (
    <div className={`top-header unified-header ${isHome ? 'home-header' : 'subpage-header'}`}>
      <div className="unified-header-row">
        <div className="unified-header-left" aria-hidden={controlsHidden ? 'true' : undefined} onFocusCapture={onGeneralFocus}>
          {isHome ? (
            <button className="location-button" type="button" disabled={controlsHidden} aria-label="Delivery location 91234">
              <span>91234</span><Icon name="chevronDown" size={18} />
            </button>
          ) : (
            <button className="plain-icon-button" type="button" disabled={controlsHidden} onClick={onBack} aria-label="Go back">
              <Icon name="back" size={30} strokeWidth={2.35} />
            </button>
          )}
        </div>

        <div className="unified-header-center" aria-hidden={controlsHidden || view === 'cart' ? 'true' : undefined}>
          {!isHome && <strong className="unified-header-title">{isRestaurant ? selectedRestaurant?.name : title}</strong>}
        </div>

        <div className="unified-header-actions">
          <div className="unified-header-secondary-actions" aria-hidden={controlsHidden ? 'true' : undefined} onFocusCapture={onGeneralFocus}>
            {isHome && (
              <>
                <button className="round-header-button" type="button" disabled={controlsHidden} aria-label="Profile"><Icon name="user" /></button>
                <button className="round-header-button" type="button" disabled={controlsHidden} aria-label="Notifications"><Icon name="bell" /></button>
                <button className="round-header-button cart-header" type="button" disabled={controlsHidden} onClick={onCart} aria-label={`Open cart, ${cartCount} items`}>
                  <Icon name="cart" /><span>{cartCount}</span>
                </button>
              </>
            )}
            {view === 'results' && (
              <button className="plain-icon-button" type="button" disabled={controlsHidden} aria-label="Filter restaurants"><Icon name="sliders" size={28} /></button>
            )}
            {isRestaurant && (
              <>
                <button className="plain-icon-button" type="button" disabled={controlsHidden} aria-label={`Save ${selectedRestaurant?.name || 'restaurant'}`}><Icon name="heart" size={25} strokeWidth={2.15} /></button>
                <button className="plain-icon-button" type="button" disabled={controlsHidden} aria-label="More restaurant options"><Icon name="more" size={26} /></button>
              </>
            )}
          </div>
          <FinchHeaderButton
            active={conversationActive}
            contextName={contextName}
            onClick={onFinch}
            buttonRef={finchButtonRef}
            surface={finchSurface}
          />
        </div>
      </div>
    </div>
  );
}
