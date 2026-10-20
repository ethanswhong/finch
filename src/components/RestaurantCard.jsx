import React from 'react';
import Icon from './Icon.jsx';
import CharacterFace from './CharacterFace.jsx';

export default function RestaurantCard({ restaurant, onOpen, onContext, active = false, talking = false, compact = false }) {
  const summary = `${restaurant.name}. ${restaurant.rating} stars, ${restaurant.reviews} reviews. ${restaurant.distance} miles away. ${restaurant.eta}. ${restaurant.feature}.`;
  return (
    <div className={`restaurant-card ${compact ? 'restaurant-card-home' : ''} ${active ? 'conversation-active-card' : ''}`} id={`restaurant-${restaurant.id}`}>
      <button
        type="button"
        className="restaurant-card-focus-target"
        aria-label={summary}
        data-finch-target="restaurant"
        onFocus={onContext}
        onPointerDown={onContext}
        onClick={onOpen}
      >
        <div className="image-wrap restaurant-image-wrap" aria-hidden="true">
          <img src={restaurant.image} alt="" />
          {active && talking && (
            <div className="context-character-overlay">
              <CharacterFace expression={restaurant.character.expression} talking label={restaurant.name} />
            </div>
          )}
        </div>
        <div className="restaurant-summary-row" aria-hidden="true">
          <div className="restaurant-summary">
            <span className="restaurant-name">{restaurant.name}</span>
            <span className="restaurant-meta"><strong>{restaurant.rating}</strong> <Icon name="star" size={15} strokeWidth={1.8} /> ({restaurant.reviews}) · {restaurant.distance} mi · {restaurant.eta}</span>
            <span className="restaurant-feature">{restaurant.feature}</span>
            {restaurant.section === 'deals' || restaurant.id === 'mountain-mikes' ? <span className="deal-badge">Free item on $15+</span> : null}
          </div>
          <span className="favorite-button" aria-hidden="true"><Icon name="heart" size={27} /></span>
        </div>
      </button>
    </div>
  );
}
