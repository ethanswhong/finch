import React from 'react';
import Icon from './Icon.jsx';

export default function MenuCard({ item, restaurant, quantity, onAdd, onContext, active = false }) {
  const label = `${item.name}. $${item.price.toFixed(2)}. ${item.description} From ${restaurant.name}. Currently ${quantity} in cart.`;
  return (
    <article
      className={`menu-card menu-card-focus-target ${active ? 'conversation-active-card' : ''}`}
      id={`menu-${item.id}`}
      tabIndex={0}
      role="group"
      aria-label={label}
      data-finch-target="menu"
      onFocus={onContext}
      onPointerDown={onContext}
    >
      <div className="image-wrap menu-image-wrap" aria-hidden="true">
        <img src={item.image} alt="" />
        <button
          type="button"
          className="add-button"
          onClick={(event) => {
            event.stopPropagation();
            onAdd();
          }}
          tabIndex={-1}
          aria-hidden="true"
        >
          <Icon name="plus" size={27} />
        </button>
      </div>
      <div className="menu-copy" aria-hidden="true">
        <h3>{item.name}</h3>
        <p className="price">${item.price.toFixed(2)}</p>
        <p className="menu-description">{item.description}</p>
      </div>
    </article>
  );
}
