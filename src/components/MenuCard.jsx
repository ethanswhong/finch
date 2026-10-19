import React from 'react';
import CharacterButton from './CharacterButton.jsx';
import Icon from './Icon.jsx';

export default function MenuCard({ item, restaurant, quantity, onAdd, onCharacter, active, talking, listening }) {
  return (
    <article className="menu-card" id={`menu-${item.id}`}>
      <div className="image-wrap menu-image-wrap">
        <img src={item.image} alt="" />
        <CharacterButton active={active} talking={talking} listening={listening} onClick={onCharacter} label={item.name} expression={item.character.expression} />
        <button
          type="button"
          className="add-button"
          onClick={onAdd}
          aria-label={`Add ${item.name} from ${restaurant.name} to cart. Currently ${quantity} in cart.`}
        >
          <Icon name="plus" size={27} />
        </button>
      </div>
      <div className="menu-copy">
        <h3>{item.name}</h3>
        <p className="price">${item.price.toFixed(2)}</p>
        <p className="menu-description">{item.description}</p>
      </div>
    </article>
  );
}
