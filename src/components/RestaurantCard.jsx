import React from 'react';
import CharacterFace from './CharacterFace.jsx';
import CharacterButton from './CharacterButton.jsx';
import Icon from './Icon.jsx';

export default function RestaurantCard({ restaurant, onOpen, onCharacter, active, talking, listening, compact = false }) {
  const summary = `${restaurant.name}. ${restaurant.rating} stars, ${restaurant.reviews} reviews. ${restaurant.distance} miles away. ${restaurant.eta}. ${restaurant.feature}. ${restaurant.priceLevel}.`;
  return (
    <article className={`restaurant-card ${compact ? 'restaurant-card-home' : ''}`} id={`restaurant-${restaurant.id}`}>
      <div className="image-wrap restaurant-image-wrap">
        <button type="button" className="image-main-button" onClick={onOpen} aria-label={`Open ${summary}`}>
          <img src={restaurant.image} alt="" />
        </button>
        {active && (
          <div className="face-overlay">
            <CharacterFace expression={restaurant.character.expression} talking={talking} label={restaurant.name} />
          </div>
        )}
        <CharacterButton active={active} talking={talking} listening={listening} onClick={onCharacter} label={restaurant.name} expression={restaurant.character.expression} />
      </div>
      <div className="restaurant-summary-row">
        <button type="button" className="restaurant-summary" onClick={onOpen} aria-label={summary}>
          <span className="restaurant-name">{restaurant.name}</span>
          <span className="restaurant-meta"><strong>{restaurant.rating}</strong> <Icon name="star" size={15} strokeWidth={1.8} /> ({restaurant.reviews}) · {restaurant.distance} mi · {restaurant.eta}</span>
          <span className="restaurant-feature">{restaurant.feature}</span>
          {restaurant.section === 'deals' || restaurant.id === 'mountain-mikes' ? <span className="deal-badge">Free item on $15+</span> : null}
        </button>
        <button type="button" className="favorite-button" aria-label={`Save ${restaurant.name}`}>
          <Icon name="heart" size={27} />
        </button>
      </div>
    </article>
  );
}
