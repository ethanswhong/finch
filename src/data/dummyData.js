const categoryIcon = (slug) => `https://img.cdn4dd.com/p/fit=contain,width=220,height=220,format=png,quality=100/managed/dineout/cuisine-icons-v2/${slug}.png`;

export const categories = [
  ['Pizza', 'pizza', '🍕'], ['Burgers', 'burgers', '🍔'], ['Mexican', 'mexican', '🌮'], ['Thai', 'thai', '🍜'],
  ['Coffee', 'coffee', '☕'], ['Breakfast', 'breakfast', '🍳'], ['Asian', 'asian', '🥢'], ['Salad', 'salad', '🥗'],
  ['Korean', 'korean', '🍱'], ['Halal', 'halal', '🧆'], ['Chicken', 'chicken', '🍗'], ['Chinese', 'chinese', '🥡'],
  ['Deals', 'deals', '🏷️'], ['Indian', 'indian', '🍛'], ['Healthy', 'healthy', '🥑'], ['Pho', 'pho', '🍲'],
  ['Sushi', 'sushi', '🍣'], ['Soup', 'soup', '🥣'], ['Fast Food', 'fast-food', '🍟'], ['Vegan', 'vegan', '🌱'],
  ['Vietnamese', 'vietnamese', '🥖'], ['Sandwiches', 'sandwiches', '🥪'], ['Noodles', 'noodles', '🍜']
].map(([name, slug, emoji]) => ({ name, slug, emoji, icon: categoryIcon(slug) }));

const REMOTE = {
  pizza: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=82',
  pepperoni: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&q=82',
  burger: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=82',
  salad: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=82',
  noodles: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&w=1200&q=82',
  sushi: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=1200&q=82',
  tacos: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=1200&q=82',
  chicken: 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=1200&q=82',
  indian: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=1200&q=82',
  coffee: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=82',
  dessert: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=1200&q=82',
  thai: 'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=1200&q=82'
};

const LOCAL = {
  fiori: '/images/menu/fiori.jpg', tiramisu: '/images/menu/tiramisu.jpg', gnocchi: '/images/menu/gnocchi.jpg', diavola: '/images/menu/diavola.jpg',
  cannavaro: '/images/menu/cannavaro.jpg', jovanotti: '/images/menu/jovanotti.jpg', bellucci: '/images/menu/bellucci.jpg', gelato: '/images/menu/gelato.jpg',
  mozzarella: '/images/menu/mozzarella-sticks.jpg', chicken: '/images/menu/chicken-tenders.jpg', creamyPasta: '/images/menu/creamy-pasta.jpg', cheesePizza: '/images/menu/cheese-pizza.jpg',
  garlicBread: '/images/menu/garlic-bread.jpg', alfredo: '/images/menu/alfredo-pasta.jpg', cateringPizza: '/images/menu/catering-pizza.jpg', heroPizza: '/images/menu/hero-pizza.jpg',
  pepperoni: '/images/menu/pepperoni-close.jpg', prosciutto: '/images/menu/prosciutto-close.jpg', whitePizza: '/images/menu/white-pizza.jpg', margherita: '/images/menu/margherita-close.jpg',
  pastaRose: '/images/menu/pasta-rose.jpg', pastaHerb: '/images/menu/pasta-herb.jpg', crispyChicken: '/images/menu/crispy-chicken.jpg', friedApp: '/images/menu/fried-appetizer.jpg',
  dessertCream: '/images/menu/dessert-cream.jpg', pizzaParty: '/images/menu/pizza-party.jpg', garlicToast: '/images/menu/garlic-toast.jpg', gelatoVanilla: '/images/menu/gelato-vanilla.jpg',
  variant01: '/images/menu/variant-01.jpg', variant02: '/images/menu/variant-02.jpg', variant03: '/images/menu/variant-03.jpg', variant04: '/images/menu/variant-04.jpg',
  variant05: '/images/menu/variant-05.jpg', variant06: '/images/menu/variant-06.jpg', variant07: '/images/menu/variant-07.jpg', variant08: '/images/menu/variant-08.jpg',
  variant09: '/images/menu/variant-09.jpg', variant10: '/images/menu/variant-10.jpg', variant11: '/images/menu/variant-11.jpg', variant12: '/images/menu/variant-12.jpg'
};

function characterFor(name, personality = 'friendly, concise, helpful', expression = 'friendly', voiceLabel = 'warm') {
  return {
    personality,
    expression,
    voiceLabel,
    intro: `Hi, I'm ${name}. I can tell you what I'm like, compare myself with the other choices here, or help you decide if I fit what you're craving.`
  };
}

function item({ key, name, price, image, description, ingredients, tags = [], section = 'Featured', healthScore = 6, personality, expression = 'friendly', voiceLabel = 'warm', imageAlt }) {
  const normalizedTags = [...new Set(tags.map((tag) => tag.toLowerCase()))];
  return {
    key,
    name,
    price,
    image,
    imageAlt: imageAlt || `${name}, photographed for a food delivery menu.`,
    description,
    ingredients,
    tags: normalizedTags,
    menuSection: section,
    healthScore,
    character: characterFor(name, personality, expression, voiceLabel)
  };
}

function makeMenu(prefix, templates) {
  return templates.map((template, index) => ({
    ...template,
    id: `${prefix}-${template.key || index + 1}`,
    key: undefined
  }));
}

const italianTemplates = [
  item({ key:'fiori', name:'Fiori', price:26, image:LOCAL.fiori, description:'Prosciutto, arugula, mozzarella, tomato.', ingredients:['prosciutto','arugula','mozzarella','tomato'], tags:['featured','lighter','non-spicy','high-protein'], section:'Pinsa Romana', healthScore:7, personality:'elegant, fresh, refined', expression:'calm', voiceLabel:'calm' }),
  item({ key:'diavola', name:'Diavola', price:25, image:LOCAL.diavola, description:'Spicy salami, tomato, mozzarella, olives.', ingredients:['spicy salami','tomato','mozzarella','olives'], tags:['featured','spicy','high-protein','rich'], section:'Pinsa Romana', healthScore:4, personality:'fiery, bold, mischievous', expression:'bold', voiceLabel:'bold' }),
  item({ key:'cannavaro', name:'Cannavaro', price:22, image:LOCAL.cannavaro, description:'Tomato, mozzarella, basil, olive oil.', ingredients:['tomato','mozzarella','basil','olive oil'], tags:['featured','vegetarian','non-spicy','classic'], section:'Pinsa Romana', healthScore:7 }),
  item({ key:'jovanotti', name:'Jovanotti', price:27, image:LOCAL.jovanotti, description:'Pepperoni, mushrooms, ham, tomato, mozzarella.', ingredients:['pepperoni','mushrooms','ham','tomato','mozzarella'], tags:['high-protein','rich','non-spicy'], section:'Pinsa Romana', healthScore:5, personality:'lively, layered, extroverted', expression:'playful', voiceLabel:'bright' }),
  item({ key:'bellucci', name:'Bellucci', price:25, image:LOCAL.bellucci, description:'Sausage, ricotta, mozzarella, tomato.', ingredients:['sausage','ricotta','mozzarella','tomato'], tags:['high-protein','rich','non-spicy'], section:'Pinsa Romana', healthScore:5 }),
  item({ key:'margherita', name:'Margherita', price:20, image:LOCAL.margherita, description:'Tomato, mozzarella, basil.', ingredients:['tomato','mozzarella','basil'], tags:['vegetarian','non-spicy','lighter'], section:'Pizza 16"', healthScore:7 }),
  item({ key:'white-pizza', name:'Bianca', price:23, image:LOCAL.whitePizza, description:'Mozzarella, ricotta, garlic, herbs.', ingredients:['mozzarella','ricotta','garlic','herbs'], tags:['vegetarian','non-spicy','creamy'], section:'Pizza 16"', healthScore:5 }),
  item({ key:'gnocchi', name:'Gnocchi Cacio E Pepe', price:22, image:LOCAL.gnocchi, description:'Potato gnocchi, pecorino, black pepper, cream.', ingredients:['potato gnocchi','pecorino','black pepper','cream'], tags:['vegetarian','non-spicy','comforting'], section:'Pasta', healthScore:5 }),
  item({ key:'alfredo', name:'Chicken Alfredo', price:24, image:LOCAL.alfredo, description:'Penne, grilled chicken, parmesan cream.', ingredients:['penne','grilled chicken','parmesan','cream'], tags:['high-protein','non-spicy','comforting'], section:'Pasta', healthScore:5 }),
  item({ key:'rose', name:'Rosé Penne', price:20, image:LOCAL.pastaRose, description:'Penne, tomato cream, parmesan, herbs.', ingredients:['penne','tomato','cream','parmesan','herbs'], tags:['vegetarian','non-spicy','creamy'], section:'Pasta', healthScore:6 }),
  item({ key:'garlic-bread', name:'Garlic Bread', price:8, image:LOCAL.garlicBread, description:'Toasted bread, garlic butter, parsley.', ingredients:['bread','garlic butter','parsley'], tags:['vegetarian','non-spicy','shareable'], section:'Sides', healthScore:4 }),
  item({ key:'mozzarella', name:'Mozzarella Cheese Sticks', price:12, image:LOCAL.mozzarella, description:'Breaded mozzarella with tomato dipping sauce.', ingredients:['mozzarella','breadcrumbs','tomato sauce'], tags:['vegetarian','non-spicy','shareable'], section:'Sides', healthScore:3 }),
  item({ key:'tiramisu', name:'Tiramisu', price:10, image:LOCAL.tiramisu, description:'Coffee-soaked cake, mascarpone, cocoa.', ingredients:['coffee-soaked cake','mascarpone','cocoa'], tags:['vegetarian','non-spicy','dessert','sweet'], section:'Dessert', healthScore:3, personality:'sweet, dreamy, charming', expression:'playful', voiceLabel:'bright' }),
  item({ key:'gelato', name:'Vanilla Gelato Pint', price:10, image:LOCAL.gelato, description:'Vanilla gelato with a waffle cone.', ingredients:['milk','cream','vanilla','sugar'], tags:['vegetarian','non-spicy','dessert','sweet'], section:'Dessert', healthScore:4, personality:'soft, sweet, calm', expression:'calm', voiceLabel:'bright' })
];

const pizzaTemplates = [
  item({key:'pepperoni',name:'Crispy Pepperoni',price:21,image:LOCAL.pepperoni,description:'Pepperoni cups, mozzarella, tomato.',ingredients:['pepperoni','mozzarella','tomato'],tags:['featured','high-protein','non-spicy','rich'],section:'Popular',healthScore:4,expression:'bold',voiceLabel:'bold'}),
  item({key:'cheese',name:'Classic Cheese Pizza',price:18,image:LOCAL.cheesePizza,description:'Mozzarella and tomato on a crisp crust.',ingredients:['mozzarella','tomato','dough'],tags:['featured','vegetarian','non-spicy'],section:'Popular',healthScore:6}),
  item({key:'margherita',name:'Margherita Pizza',price:19,image:LOCAL.margherita,description:'Tomato, mozzarella, basil.',ingredients:['tomato','mozzarella','basil'],tags:['vegetarian','non-spicy','lighter'],section:'Pizza',healthScore:7}),
  item({key:'garden',name:'Garden Veggie',price:22,image:LOCAL.fiori,description:'Greens, peppers, mushrooms, tomato, mozzarella.',ingredients:['greens','peppers','mushrooms','tomato','mozzarella'],tags:['vegetarian','non-spicy','lighter'],section:'Pizza',healthScore:8}),
  item({key:'meat',name:'Meat Lovers',price:27,image:LOCAL.jovanotti,description:'Pepperoni, sausage, ham, mozzarella.',ingredients:['pepperoni','sausage','ham','mozzarella'],tags:['high-protein','rich','non-spicy'],section:'Pizza',healthScore:3}),
  item({key:'spicy',name:'Hot Honey Pepperoni',price:24,image:LOCAL.diavola,description:'Pepperoni, chili, hot honey, mozzarella.',ingredients:['pepperoni','chili','hot honey','mozzarella'],tags:['spicy','high-protein','rich'],section:'Pizza',healthScore:3,expression:'bold',voiceLabel:'bold'}),
  item({key:'white',name:'Garlic White Pie',price:22,image:LOCAL.whitePizza,description:'Ricotta, mozzarella, garlic, herbs.',ingredients:['ricotta','mozzarella','garlic','herbs'],tags:['vegetarian','non-spicy','creamy'],section:'Pizza',healthScore:5}),
  item({key:'sticks',name:'Mozzarella Sticks',price:10,image:LOCAL.mozzarella,description:'Breaded mozzarella with marinara.',ingredients:['mozzarella','breadcrumbs','marinara'],tags:['vegetarian','non-spicy','shareable'],section:'Sides',healthScore:3}),
  item({key:'garlic',name:'Garlic Knots',price:8,image:LOCAL.garlicToast,description:'Warm garlic butter bread with herbs.',ingredients:['bread','garlic butter','herbs'],tags:['vegetarian','non-spicy','shareable'],section:'Sides',healthScore:4}),
  item({key:'tenders',name:'Chicken Tenders',price:14,image:LOCAL.chicken,description:'Crispy chicken tenders with dipping sauce.',ingredients:['chicken','breadcrumbs','seasoning'],tags:['high-protein','non-spicy','crispy'],section:'Sides',healthScore:5}),
  item({key:'party',name:'Party Pizza',price:34,image:LOCAL.pizzaParty,description:'Large combination pizza for a group.',ingredients:['dough','tomato','mozzarella','pepperoni','vegetables'],tags:['high-protein','shareable','non-spicy'],section:'Bundles',healthScore:4}),
  item({key:'dessert',name:'Tiramisu Cup',price:9,image:LOCAL.dessertCream,description:'Creamy coffee dessert with cocoa.',ingredients:['mascarpone','coffee','cocoa'],tags:['vegetarian','non-spicy','dessert','sweet'],section:'Dessert',healthScore:3})
];

const mexicanTemplates = [
  item({key:'street-tacos',name:'Street Taco Trio',price:13,image:LOCAL.cateringPizza,description:'Three tacos with onion, cilantro, salsa, and lime.',ingredients:['tortillas','protein','onion','cilantro','salsa','lime'],tags:['featured','high-protein','non-spicy'],section:'Tacos',healthScore:6}),
  item({key:'veggie-tacos',name:'Veggie Taco Trio',price:12,image:LOCAL.fiori,description:'Roasted vegetables, beans, salsa, avocado.',ingredients:['tortillas','vegetables','beans','salsa','avocado'],tags:['featured','vegetarian','vegan','non-spicy','lighter'],section:'Tacos',healthScore:9}),
  item({key:'chicken-tacos',name:'Chicken Tacos',price:14,image:LOCAL.crispyChicken,description:'Grilled chicken, cabbage, pico, lime.',ingredients:['chicken','cabbage','pico de gallo','lime'],tags:['high-protein','non-spicy','lighter'],section:'Tacos',healthScore:8}),
  item({key:'spicy-tacos',name:'Spicy Beef Tacos',price:15,image:LOCAL.diavola,description:'Beef, chili salsa, onion, cilantro.',ingredients:['beef','chili salsa','onion','cilantro'],tags:['spicy','high-protein'],section:'Tacos',healthScore:5}),
  item({key:'veggie-bowl',name:'Veggie Bowl',price:13,image:LOCAL.fiori,description:'Rice, beans, greens, avocado, salsa.',ingredients:['rice','beans','greens','avocado','salsa'],tags:['vegetarian','vegan','non-spicy','lighter'],section:'Bowls',healthScore:9}),
  item({key:'chicken-bowl',name:'Chicken Protein Bowl',price:16,image:LOCAL.chicken,description:'Chicken, rice, beans, greens, pico.',ingredients:['chicken','rice','beans','greens','pico'],tags:['high-protein','non-spicy','lighter'],section:'Bowls',healthScore:8}),
  item({key:'burrito',name:'Classic Burrito',price:15,image:LOCAL.garlicBread,description:'Rice, beans, cheese, salsa, choice of protein.',ingredients:['tortilla','rice','beans','cheese','salsa'],tags:['non-spicy','comforting'],section:'Burritos',healthScore:6}),
  item({key:'vegan-burrito',name:'Vegan Burrito',price:14,image:LOCAL.garlicToast,description:'Rice, black beans, vegetables, avocado salsa.',ingredients:['tortilla','rice','black beans','vegetables','avocado salsa'],tags:['vegan','vegetarian','non-spicy'],section:'Burritos',healthScore:8}),
  item({key:'quesadilla',name:'Cheese Quesadilla',price:11,image:LOCAL.cheesePizza,description:'Melted cheese in a toasted tortilla.',ingredients:['tortilla','cheese'],tags:['vegetarian','non-spicy'],section:'Sides',healthScore:5}),
  item({key:'chips',name:'Chips & Guacamole',price:8,image:LOCAL.mozzarella,description:'Corn chips with avocado guacamole.',ingredients:['corn chips','avocado','lime','cilantro'],tags:['vegan','vegetarian','non-spicy','shareable'],section:'Sides',healthScore:7}),
  item({key:'rice',name:'Cilantro Lime Rice',price:5,image:LOCAL.creamyPasta,description:'Rice with cilantro and lime.',ingredients:['rice','cilantro','lime'],tags:['vegan','vegetarian','non-spicy'],section:'Sides',healthScore:8}),
  item({key:'churro',name:'Cinnamon Churros',price:7,image:LOCAL.tiramisu,description:'Warm cinnamon sugar churros.',ingredients:['flour','cinnamon','sugar'],tags:['vegetarian','non-spicy','dessert','sweet'],section:'Dessert',healthScore:3})
];

const chickenTemplates = [
  item({key:'tenders',name:'Crispy Chicken Tenders',price:13,image:LOCAL.chicken,description:'Crispy chicken tenders with dipping sauce.',ingredients:['chicken','seasoned breading'],tags:['featured','high-protein','non-spicy','crispy'],section:'Chicken',healthScore:5,expression:'bold',voiceLabel:'bold'}),
  item({key:'spicy-tenders',name:'Spicy Chicken Tenders',price:14,image:LOCAL.crispyChicken,description:'Crispy tenders tossed in hot seasoning.',ingredients:['chicken','seasoned breading','chili seasoning'],tags:['featured','high-protein','spicy'],section:'Chicken',healthScore:4,expression:'bold',voiceLabel:'bold'}),
  item({key:'sandwich',name:'Classic Chicken Sandwich',price:12,image:LOCAL.garlicBread,description:'Crispy chicken, pickles, mayo, brioche bun.',ingredients:['chicken','pickles','mayo','brioche bun'],tags:['high-protein','non-spicy'],section:'Sandwiches',healthScore:5}),
  item({key:'spicy-sandwich',name:'Spicy Chicken Sandwich',price:13,image:LOCAL.diavola,description:'Crispy chicken, spicy sauce, pickles.',ingredients:['chicken','spicy sauce','pickles','bun'],tags:['high-protein','spicy'],section:'Sandwiches',healthScore:4}),
  item({key:'grilled',name:'Grilled Chicken Sandwich',price:13,image:LOCAL.fiori,description:'Grilled chicken, lettuce, tomato, herb sauce.',ingredients:['grilled chicken','lettuce','tomato','herb sauce'],tags:['high-protein','non-spicy','lighter'],section:'Sandwiches',healthScore:8}),
  item({key:'wings',name:'Classic Wings',price:15,image:LOCAL.chicken,description:'Chicken wings with house seasoning.',ingredients:['chicken wings','seasoning'],tags:['high-protein','non-spicy'],section:'Chicken',healthScore:5}),
  item({key:'hot-wings',name:'Hot Wings',price:16,image:LOCAL.crispyChicken,description:'Chicken wings with hot sauce.',ingredients:['chicken wings','hot sauce'],tags:['high-protein','spicy'],section:'Chicken',healthScore:4}),
  item({key:'fries',name:'Cajun Fries',price:6,image:LOCAL.mozzarella,description:'Crispy fries with Cajun seasoning.',ingredients:['potato','cajun seasoning'],tags:['vegan','vegetarian','spicy'],section:'Sides',healthScore:4}),
  item({key:'biscuit',name:'Buttermilk Biscuit',price:4,image:LOCAL.garlicBread,description:'Warm flaky buttermilk biscuit.',ingredients:['flour','buttermilk','butter'],tags:['vegetarian','non-spicy'],section:'Sides',healthScore:4}),
  item({key:'slaw',name:'Cool Slaw',price:5,image:LOCAL.fiori,description:'Cabbage slaw with creamy dressing.',ingredients:['cabbage','carrot','dressing'],tags:['vegetarian','non-spicy','lighter'],section:'Sides',healthScore:7}),
  item({key:'mac',name:'Creamy Mac & Cheese',price:7,image:LOCAL.creamyPasta,description:'Creamy macaroni with cheese sauce.',ingredients:['pasta','cheese','cream'],tags:['vegetarian','non-spicy','comforting'],section:'Sides',healthScore:3}),
  item({key:'dessert',name:'Chocolate Cream Cup',price:6,image:LOCAL.tiramisu,description:'Chocolate cream dessert cup.',ingredients:['chocolate','cream','sugar'],tags:['vegetarian','non-spicy','dessert','sweet'],section:'Dessert',healthScore:3})
];

const healthyTemplates = [
  item({key:'harvest',name:'Harvest Bowl',price:16,image:LOCAL.fiori,description:'Greens, quinoa, roasted vegetables, avocado, seeds.',ingredients:['greens','quinoa','roasted vegetables','avocado','seeds'],tags:['featured','vegan','vegetarian','non-spicy','lighter'],section:'Bowls',healthScore:10,expression:'calm',voiceLabel:'calm'}),
  item({key:'tofu',name:'Crispy Tofu Salad',price:15,image:LOCAL.mozzarella,description:'Tofu, greens, cabbage, cucumber, sesame.',ingredients:['tofu','greens','cabbage','cucumber','sesame'],tags:['featured','vegan','vegetarian','high-protein','non-spicy','lighter'],section:'Salads',healthScore:9}),
  item({key:'chicken',name:'Herb Chicken Bowl',price:18,image:LOCAL.chicken,description:'Grilled chicken, greens, quinoa, cucumber.',ingredients:['grilled chicken','greens','quinoa','cucumber'],tags:['high-protein','non-spicy','lighter'],section:'Bowls',healthScore:9}),
  item({key:'salmon',name:'Protein Power Bowl',price:20,image:LOCAL.cateringPizza,description:'Roasted protein, grains, greens, vegetables.',ingredients:['protein','grains','greens','vegetables'],tags:['high-protein','non-spicy','lighter'],section:'Bowls',healthScore:9}),
  item({key:'avocado',name:'Avocado Greens',price:14,image:LOCAL.fiori,description:'Greens, avocado, cucumber, tomato, seeds.',ingredients:['greens','avocado','cucumber','tomato','seeds'],tags:['vegan','vegetarian','non-spicy','lighter'],section:'Salads',healthScore:10}),
  item({key:'caesar',name:'Light Caesar',price:14,image:LOCAL.fiori,description:'Romaine, parmesan, crunchy crumbs, light dressing.',ingredients:['romaine','parmesan','breadcrumbs','dressing'],tags:['vegetarian','non-spicy','lighter'],section:'Salads',healthScore:8}),
  item({key:'lentil',name:'Warm Lentil Bowl',price:15,image:LOCAL.gnocchi,description:'Lentils, vegetables, herbs, tahini.',ingredients:['lentils','vegetables','herbs','tahini'],tags:['vegan','vegetarian','high-protein','non-spicy'],section:'Bowls',healthScore:10}),
  item({key:'soup',name:'Garden Soup',price:10,image:LOCAL.gnocchi,description:'Vegetable broth, greens, beans, herbs.',ingredients:['vegetable broth','greens','beans','herbs'],tags:['vegan','vegetarian','non-spicy','lighter'],section:'Soup',healthScore:9}),
  item({key:'wrap',name:'Green Goddess Wrap',price:13,image:LOCAL.garlicBread,description:'Greens, avocado, cucumber, herbs in a wrap.',ingredients:['greens','avocado','cucumber','herbs','wrap'],tags:['vegetarian','non-spicy','lighter'],section:'Handhelds',healthScore:8}),
  item({key:'protein-wrap',name:'Chicken Protein Wrap',price:16,image:LOCAL.chicken,description:'Grilled chicken, greens, tomato, yogurt sauce.',ingredients:['chicken','greens','tomato','yogurt sauce'],tags:['high-protein','non-spicy','lighter'],section:'Handhelds',healthScore:8}),
  item({key:'parfait',name:'Berry Parfait',price:8,image:LOCAL.gelato,description:'Yogurt, berries, granola, honey.',ingredients:['yogurt','berries','granola','honey'],tags:['vegetarian','non-spicy','lighter','sweet'],section:'Snacks',healthScore:8}),
  item({key:'juice',name:'Green Juice',price:7,image:LOCAL.gelatoVanilla,description:'Apple, cucumber, spinach, lemon.',ingredients:['apple','cucumber','spinach','lemon'],tags:['vegan','vegetarian','non-spicy','lighter'],section:'Drinks',healthScore:9})
];

const asianTemplates = [
  item({key:'miso',name:'Miso Ramen',price:19,image:LOCAL.gnocchi,description:'Miso broth, noodles, egg, corn, scallions.',ingredients:['miso broth','noodles','egg','corn','scallions'],tags:['featured','non-spicy','comforting'],section:'Noodles',healthScore:6}),
  item({key:'veggie-noodles',name:'Vegetable Noodles',price:17,image:LOCAL.creamyPasta,description:'Noodles, bok choy, peppers, mushrooms, sesame.',ingredients:['noodles','bok choy','peppers','mushrooms','sesame'],tags:['featured','vegetarian','non-spicy','lighter'],section:'Noodles',healthScore:8}),
  item({key:'chicken-noodles',name:'Chicken Noodles',price:19,image:LOCAL.alfredo,description:'Noodles, chicken, greens, sesame.',ingredients:['noodles','chicken','greens','sesame'],tags:['high-protein','non-spicy'],section:'Noodles',healthScore:7}),
  item({key:'spicy-noodles',name:'Spicy Chili Noodles',price:18,image:LOCAL.diavola,description:'Noodles, chili oil, scallions, sesame.',ingredients:['noodles','chili oil','scallions','sesame'],tags:['vegetarian','spicy'],section:'Noodles',healthScore:5}),
  item({key:'green-curry',name:'Green Curry',price:20,image:LOCAL.fiori,description:'Coconut curry, vegetables, basil, rice.',ingredients:['coconut milk','vegetables','basil','rice'],tags:['vegetarian','non-spicy'],section:'Curry',healthScore:7}),
  item({key:'red-curry',name:'Red Curry Chicken',price:21,image:LOCAL.diavola,description:'Red curry, chicken, vegetables, rice.',ingredients:['red curry','chicken','vegetables','rice'],tags:['high-protein','spicy'],section:'Curry',healthScore:6}),
  item({key:'tofu-curry',name:'Tofu Coconut Curry',price:19,image:LOCAL.fiori,description:'Tofu, coconut curry, vegetables, rice.',ingredients:['tofu','coconut curry','vegetables','rice'],tags:['vegan','vegetarian','high-protein','non-spicy'],section:'Curry',healthScore:8}),
  item({key:'spring-roll',name:'Vegetable Spring Rolls',price:9,image:LOCAL.mozzarella,description:'Crisp vegetable rolls with dipping sauce.',ingredients:['vegetables','wrapper','dipping sauce'],tags:['vegan','vegetarian','non-spicy'],section:'Starters',healthScore:7}),
  item({key:'satay',name:'Chicken Satay',price:11,image:LOCAL.chicken,description:'Grilled chicken skewers with peanut sauce.',ingredients:['chicken','peanut sauce'],tags:['high-protein','non-spicy'],section:'Starters',healthScore:7}),
  item({key:'fried-rice',name:'Vegetable Fried Rice',price:16,image:LOCAL.creamyPasta,description:'Rice, egg, vegetables, soy.',ingredients:['rice','egg','vegetables','soy'],tags:['vegetarian','non-spicy'],section:'Rice',healthScore:7}),
  item({key:'protein-rice',name:'Chicken Fried Rice',price:18,image:LOCAL.chicken,description:'Rice, chicken, egg, vegetables.',ingredients:['rice','chicken','egg','vegetables'],tags:['high-protein','non-spicy'],section:'Rice',healthScore:6}),
  item({key:'mango',name:'Mango Sticky Rice',price:9,image:LOCAL.tiramisu,description:'Sweet coconut rice with mango.',ingredients:['rice','coconut milk','mango'],tags:['vegan','vegetarian','non-spicy','dessert','sweet'],section:'Dessert',healthScore:5})
];

const sushiTemplates = [
  item({key:'salmon-roll',name:'Salmon Roll',price:13,image:LOCAL.fiori,description:'Salmon, rice, nori.',ingredients:['salmon','rice','nori'],tags:['featured','high-protein','non-spicy','lighter'],section:'Rolls',healthScore:8}),
  item({key:'avocado-roll',name:'Avocado Roll',price:9,image:LOCAL.fiori,description:'Avocado, rice, nori.',ingredients:['avocado','rice','nori'],tags:['featured','vegan','vegetarian','non-spicy','lighter'],section:'Rolls',healthScore:9}),
  item({key:'spicy-tuna',name:'Spicy Tuna Roll',price:14,image:LOCAL.diavola,description:'Tuna, chili, rice, nori.',ingredients:['tuna','chili','rice','nori'],tags:['high-protein','spicy','lighter'],section:'Rolls',healthScore:7}),
  item({key:'california',name:'California Roll',price:12,image:LOCAL.cannavaro,description:'Crab-style filling, avocado, cucumber, rice.',ingredients:['crab-style filling','avocado','cucumber','rice'],tags:['non-spicy','lighter'],section:'Rolls',healthScore:7}),
  item({key:'salmon-nigiri',name:'Salmon Nigiri',price:12,image:LOCAL.fiori,description:'Salmon over seasoned rice.',ingredients:['salmon','rice'],tags:['high-protein','non-spicy','lighter'],section:'Nigiri',healthScore:9}),
  item({key:'tuna-nigiri',name:'Tuna Nigiri',price:13,image:LOCAL.diavola,description:'Tuna over seasoned rice.',ingredients:['tuna','rice'],tags:['high-protein','non-spicy','lighter'],section:'Nigiri',healthScore:9}),
  item({key:'veggie-handroll',name:'Veggie Hand Roll',price:10,image:LOCAL.fiori,description:'Avocado, cucumber, greens, rice, nori.',ingredients:['avocado','cucumber','greens','rice','nori'],tags:['vegan','vegetarian','non-spicy','lighter'],section:'Hand Rolls',healthScore:9}),
  item({key:'salmon-handroll',name:'Salmon Hand Roll',price:12,image:LOCAL.fiori,description:'Salmon, cucumber, rice, nori.',ingredients:['salmon','cucumber','rice','nori'],tags:['high-protein','non-spicy','lighter'],section:'Hand Rolls',healthScore:8}),
  item({key:'edamame',name:'Edamame',price:7,image:LOCAL.fiori,description:'Steamed soybeans with sea salt.',ingredients:['soybeans','salt'],tags:['vegan','vegetarian','high-protein','non-spicy','lighter'],section:'Sides',healthScore:10}),
  item({key:'miso-soup',name:'Miso Soup',price:6,image:LOCAL.gnocchi,description:'Miso broth, tofu, scallions.',ingredients:['miso broth','tofu','scallions'],tags:['vegetarian','high-protein','non-spicy','lighter'],section:'Sides',healthScore:9}),
  item({key:'chicken-katsu',name:'Chicken Katsu',price:17,image:LOCAL.chicken,description:'Crispy chicken with cabbage and sauce.',ingredients:['chicken','breadcrumbs','cabbage','sauce'],tags:['high-protein','non-spicy'],section:'Cooked',healthScore:5}),
  item({key:'mochi',name:'Vanilla Mochi',price:8,image:LOCAL.gelato,description:'Soft rice cake with vanilla ice cream.',ingredients:['rice flour','ice cream','sugar'],tags:['vegetarian','non-spicy','dessert','sweet'],section:'Dessert',healthScore:4})
];

const indianTemplates = [
  item({key:'butter-chicken',name:'Butter Chicken',price:20,image:LOCAL.diavola,description:'Chicken in a creamy tomato curry.',ingredients:['chicken','tomato','cream','spices'],tags:['featured','high-protein','non-spicy','comforting'],section:'Curries',healthScore:6}),
  item({key:'chana',name:'Chana Masala',price:17,image:LOCAL.fiori,description:'Chickpeas, tomato, onion, warm spices.',ingredients:['chickpeas','tomato','onion','spices'],tags:['featured','vegan','vegetarian','high-protein','non-spicy'],section:'Curries',healthScore:9}),
  item({key:'saag',name:'Saag Paneer',price:18,image:LOCAL.fiori,description:'Spinach, paneer, spices.',ingredients:['spinach','paneer','spices'],tags:['vegetarian','high-protein','non-spicy'],section:'Curries',healthScore:8}),
  item({key:'tikka',name:'Chicken Tikka Masala',price:21,image:LOCAL.diavola,description:'Chicken, tomato cream curry, spices.',ingredients:['chicken','tomato','cream','spices'],tags:['high-protein','non-spicy','comforting'],section:'Curries',healthScore:6}),
  item({key:'vindaloo',name:'Chicken Vindaloo',price:21,image:LOCAL.diavola,description:'Chicken in a hot tangy curry.',ingredients:['chicken','chili','vinegar','spices'],tags:['high-protein','spicy'],section:'Curries',healthScore:6}),
  item({key:'dal',name:'Dal Tadka',price:16,image:LOCAL.gnocchi,description:'Lentils, tomato, garlic, cumin.',ingredients:['lentils','tomato','garlic','cumin'],tags:['vegan','vegetarian','high-protein','non-spicy'],section:'Curries',healthScore:10}),
  item({key:'biryani',name:'Chicken Biryani',price:20,image:LOCAL.chicken,description:'Basmati rice, chicken, herbs, spices.',ingredients:['rice','chicken','herbs','spices'],tags:['high-protein','non-spicy'],section:'Rice',healthScore:7}),
  item({key:'veggie-biryani',name:'Vegetable Biryani',price:17,image:LOCAL.fiori,description:'Basmati rice, vegetables, herbs, spices.',ingredients:['rice','vegetables','herbs','spices'],tags:['vegan','vegetarian','non-spicy'],section:'Rice',healthScore:8}),
  item({key:'naan',name:'Garlic Naan',price:5,image:LOCAL.garlicBread,description:'Soft flatbread with garlic butter.',ingredients:['flour','garlic','butter'],tags:['vegetarian','non-spicy'],section:'Sides',healthScore:5}),
  item({key:'samosa',name:'Vegetable Samosas',price:8,image:LOCAL.mozzarella,description:'Crispy pastries with potato and peas.',ingredients:['potato','peas','pastry','spices'],tags:['vegetarian','vegan','non-spicy'],section:'Sides',healthScore:6}),
  item({key:'raita',name:'Cucumber Raita',price:5,image:LOCAL.fiori,description:'Yogurt, cucumber, herbs.',ingredients:['yogurt','cucumber','herbs'],tags:['vegetarian','non-spicy','lighter'],section:'Sides',healthScore:8}),
  item({key:'gulab',name:'Gulab Jamun',price:7,image:LOCAL.tiramisu,description:'Soft milk dumplings in sweet syrup.',ingredients:['milk solids','sugar','cardamom'],tags:['vegetarian','non-spicy','dessert','sweet'],section:'Dessert',healthScore:3})
];

const coffeeTemplates = [
  item({key:'latte',name:'Vanilla Latte',price:6,image:LOCAL.gelatoVanilla,description:'Espresso, milk, vanilla.',ingredients:['espresso','milk','vanilla'],tags:['featured','vegetarian','non-spicy'],section:'Coffee',healthScore:5}),
  item({key:'cold-brew',name:'Cold Brew',price:5,image:LOCAL.gelato,description:'Slow-steeped coffee over ice.',ingredients:['coffee','water'],tags:['featured','vegan','vegetarian','non-spicy','lighter'],section:'Coffee',healthScore:9}),
  item({key:'cappuccino',name:'Cappuccino',price:6,image:LOCAL.gelatoVanilla,description:'Espresso with steamed milk foam.',ingredients:['espresso','milk'],tags:['vegetarian','non-spicy'],section:'Coffee',healthScore:7}),
  item({key:'mocha',name:'Mocha',price:7,image:LOCAL.tiramisu,description:'Espresso, chocolate, milk.',ingredients:['espresso','chocolate','milk'],tags:['vegetarian','non-spicy','sweet'],section:'Coffee',healthScore:4}),
  item({key:'tea',name:'Jasmine Tea',price:4,image:LOCAL.fiori,description:'Fragrant jasmine green tea.',ingredients:['jasmine tea','water'],tags:['vegan','vegetarian','non-spicy','lighter'],section:'Tea',healthScore:10}),
  item({key:'chai',name:'Chai Latte',price:6,image:LOCAL.tiramisu,description:'Spiced tea with steamed milk.',ingredients:['tea','milk','spices'],tags:['vegetarian','non-spicy','sweet'],section:'Tea',healthScore:6}),
  item({key:'turkey-sandwich',name:'Turkey Sandwich',price:12,image:LOCAL.garlicBread,description:'Turkey, greens, tomato, mustard.',ingredients:['turkey','greens','tomato','mustard','bread'],tags:['high-protein','non-spicy','lighter'],section:'Food',healthScore:8}),
  item({key:'veggie-sandwich',name:'Veggie Sandwich',price:11,image:LOCAL.fiori,description:'Vegetables, avocado, greens, hummus.',ingredients:['vegetables','avocado','greens','hummus','bread'],tags:['vegan','vegetarian','non-spicy','lighter'],section:'Food',healthScore:9}),
  item({key:'parfait',name:'Berry Parfait',price:8,image:LOCAL.gelato,description:'Yogurt, berries, granola, honey.',ingredients:['yogurt','berries','granola','honey'],tags:['vegetarian','non-spicy','lighter','sweet'],section:'Food',healthScore:8}),
  item({key:'tiramisu',name:'Tiramisu Slice',price:8,image:LOCAL.tiramisu,description:'Coffee-soaked cake, mascarpone, cocoa.',ingredients:['cake','coffee','mascarpone','cocoa'],tags:['vegetarian','non-spicy','dessert','sweet'],section:'Pastries',healthScore:3}),
  item({key:'gelato',name:'Vanilla Gelato',price:7,image:LOCAL.gelatoVanilla,description:'Creamy vanilla gelato.',ingredients:['milk','cream','vanilla','sugar'],tags:['vegetarian','non-spicy','dessert','sweet'],section:'Pastries',healthScore:4}),
  item({key:'toast',name:'Garlic Herb Toast',price:7,image:LOCAL.garlicToast,description:'Toasted bread with garlic herb butter.',ingredients:['bread','garlic','butter','herbs'],tags:['vegetarian','non-spicy'],section:'Food',healthScore:5})
];

const extraTemplates = {
  italian: [
    item({key:'verdure',name:'Roasted Verdure Pinsa',price:23,image:LOCAL.variant04,description:'Roasted vegetables, mozzarella, tomato, basil.',ingredients:['roasted vegetables','mozzarella','tomato','basil'],tags:['vegetarian','non-spicy','lighter'],section:'Pinsa Romana',healthScore:8}),
    item({key:'pollo-pesto',name:'Chicken Pesto Pinsa',price:27,image:LOCAL.variant11,description:'Grilled chicken, pesto, mozzarella, tomato.',ingredients:['grilled chicken','pesto','mozzarella','tomato'],tags:['high-protein','non-spicy'],section:'Pinsa Romana',healthScore:7}),
    item({key:'arrabbiata',name:'Penne Arrabbiata',price:19,image:LOCAL.variant07,description:'Penne, tomato, chili, garlic, parsley.',ingredients:['penne','tomato','chili','garlic','parsley'],tags:['vegetarian','spicy','lighter'],section:'Pasta',healthScore:7}),
    item({key:'panna-cotta',name:'Vanilla Panna Cotta',price:9,image:LOCAL.variant09,description:'Vanilla cream custard with berry sauce.',ingredients:['cream','vanilla','berry sauce'],tags:['vegetarian','non-spicy','dessert','sweet'],section:'Dessert',healthScore:4})
  ],
  pizza: [
    item({key:'bbq-chicken',name:'BBQ Chicken Pizza',price:24,image:LOCAL.variant01,description:'Chicken, barbecue sauce, red onion, mozzarella.',ingredients:['chicken','barbecue sauce','red onion','mozzarella'],tags:['high-protein','non-spicy','rich'],section:'Pizza',healthScore:5}),
    item({key:'mushroom',name:'Roasted Mushroom Pizza',price:22,image:LOCAL.variant03,description:'Mushrooms, mozzarella, garlic, herbs.',ingredients:['mushrooms','mozzarella','garlic','herbs'],tags:['vegetarian','non-spicy'],section:'Pizza',healthScore:7}),
    item({key:'hot-honey',name:'Hot Honey Pepperoni',price:25,image:LOCAL.variant02,description:'Pepperoni, mozzarella, tomato, hot honey.',ingredients:['pepperoni','mozzarella','tomato','hot honey'],tags:['high-protein','spicy','rich'],section:'Pizza',healthScore:4}),
    item({key:'cinnamon-bites',name:'Cinnamon Dough Bites',price:8,image:LOCAL.variant09,description:'Warm dough bites with cinnamon sugar.',ingredients:['dough','cinnamon','sugar'],tags:['vegetarian','non-spicy','dessert','sweet'],section:'Dessert',healthScore:3})
  ],
  mexican: [
    item({key:'veggie-tacos',name:'Grilled Veggie Tacos',price:14,image:LOCAL.variant04,description:'Peppers, onions, corn, salsa verde.',ingredients:['peppers','onions','corn','salsa verde'],tags:['vegan','vegetarian','lighter','non-spicy'],section:'Tacos',healthScore:9}),
    item({key:'chicken-bowl',name:'Chicken Power Bowl',price:16,image:LOCAL.variant06,description:'Grilled chicken, rice, beans, lettuce, pico.',ingredients:['grilled chicken','rice','beans','lettuce','pico'],tags:['high-protein','non-spicy','lighter'],section:'Bowls',healthScore:8}),
    item({key:'spicy-burrito',name:'Fire-Roasted Burrito',price:17,image:LOCAL.variant11,description:'Steak, rice, beans, roasted chile salsa.',ingredients:['steak','rice','beans','roasted chile salsa'],tags:['high-protein','spicy','rich'],section:'Burritos',healthScore:5}),
    item({key:'churros',name:'Cinnamon Churros',price:7,image:LOCAL.variant09,description:'Crisp churros with cinnamon sugar.',ingredients:['flour','cinnamon','sugar'],tags:['vegetarian','non-spicy','dessert','sweet'],section:'Dessert',healthScore:3})
  ],
  chicken: [
    item({key:'grilled-wrap',name:'Grilled Chicken Wrap',price:13,image:LOCAL.variant06,description:'Grilled chicken, lettuce, tomato, light sauce.',ingredients:['grilled chicken','lettuce','tomato','sauce','wrap'],tags:['high-protein','non-spicy','lighter'],section:'Sandwiches',healthScore:8}),
    item({key:'spicy-tenders',name:'Spicy Chicken Tenders',price:14,image:LOCAL.variant05,description:'Crispy tenders with cayenne seasoning.',ingredients:['chicken','breading','cayenne'],tags:['high-protein','spicy','rich'],section:'Chicken',healthScore:4}),
    item({key:'green-beans',name:'Seasoned Green Beans',price:5,image:LOCAL.variant04,description:'Green beans with garlic and herbs.',ingredients:['green beans','garlic','herbs'],tags:['vegan','vegetarian','non-spicy','lighter'],section:'Sides',healthScore:9}),
    item({key:'apple-pie',name:'Cinnamon Apple Pie',price:6,image:LOCAL.variant09,description:'Warm apple filling in a crisp pastry.',ingredients:['apple','pastry','cinnamon','sugar'],tags:['vegetarian','non-spicy','dessert','sweet'],section:'Dessert',healthScore:3})
  ],
  healthy: [
    item({key:'tofu-bowl',name:'Sesame Tofu Bowl',price:15,image:LOCAL.variant04,description:'Tofu, greens, brown rice, sesame dressing.',ingredients:['tofu','greens','brown rice','sesame dressing'],tags:['vegan','vegetarian','high-protein','non-spicy','lighter'],section:'Bowls',healthScore:9}),
    item({key:'chicken-salad',name:'Herb Chicken Salad',price:16,image:LOCAL.variant06,description:'Chicken, mixed greens, cucumber, herbs.',ingredients:['chicken','mixed greens','cucumber','herbs'],tags:['high-protein','non-spicy','lighter'],section:'Salads',healthScore:9}),
    item({key:'lentil-soup',name:'Lentil Vegetable Soup',price:10,image:LOCAL.variant08,description:'Lentils, tomato, carrots, celery, herbs.',ingredients:['lentils','tomato','carrots','celery','herbs'],tags:['vegan','vegetarian','high-protein','non-spicy','lighter'],section:'Soups',healthScore:10}),
    item({key:'fruit-cup',name:'Seasonal Fruit Cup',price:7,image:LOCAL.variant10,description:'A chilled mix of seasonal fruit.',ingredients:['seasonal fruit'],tags:['vegan','vegetarian','non-spicy','lighter','sweet'],section:'Sides',healthScore:10})
  ],
  asian: [
    item({key:'tofu-noodles',name:'Tofu Rice Noodles',price:16,image:LOCAL.variant08,description:'Rice noodles, tofu, vegetables, herbs.',ingredients:['rice noodles','tofu','vegetables','herbs'],tags:['vegan','vegetarian','non-spicy','lighter'],section:'Noodles',healthScore:8}),
    item({key:'chicken-rice',name:'Ginger Chicken Rice',price:17,image:LOCAL.variant06,description:'Chicken, jasmine rice, ginger, scallions.',ingredients:['chicken','jasmine rice','ginger','scallions'],tags:['high-protein','non-spicy'],section:'Rice',healthScore:8}),
    item({key:'chili-noodles',name:'Chili Garlic Noodles',price:15,image:LOCAL.variant07,description:'Noodles, chili garlic sauce, scallions.',ingredients:['noodles','chili garlic sauce','scallions'],tags:['vegetarian','spicy'],section:'Noodles',healthScore:6}),
    item({key:'mango-sticky-rice',name:'Mango Sticky Rice',price:9,image:LOCAL.variant10,description:'Sweet coconut rice with mango.',ingredients:['sticky rice','coconut milk','mango'],tags:['vegan','vegetarian','non-spicy','dessert','sweet'],section:'Dessert',healthScore:5})
  ],
  sushi: [
    item({key:'veggie-roll',name:'Garden Veggie Roll',price:12,image:LOCAL.variant04,description:'Avocado, cucumber, carrot, rice, nori.',ingredients:['avocado','cucumber','carrot','rice','nori'],tags:['vegan','vegetarian','non-spicy','lighter'],section:'Rolls',healthScore:9}),
    item({key:'salmon-bowl',name:'Salmon Rice Bowl',price:19,image:LOCAL.variant11,description:'Salmon, rice, cucumber, edamame.',ingredients:['salmon','rice','cucumber','edamame'],tags:['high-protein','non-spicy','lighter'],section:'Bowls',healthScore:9}),
    item({key:'spicy-tuna',name:'Spicy Tuna Roll',price:15,image:LOCAL.variant01,description:'Tuna, chili sauce, cucumber, rice.',ingredients:['tuna','chili sauce','cucumber','rice'],tags:['high-protein','spicy'],section:'Rolls',healthScore:7}),
    item({key:'miso-soup',name:'Miso Soup',price:5,image:LOCAL.variant08,description:'Miso broth, tofu, seaweed, scallion.',ingredients:['miso','tofu','seaweed','scallion'],tags:['vegetarian','non-spicy','lighter'],section:'Sides',healthScore:8})
  ],
  indian: [
    item({key:'chana',name:'Chana Masala',price:16,image:LOCAL.variant08,description:'Chickpeas, tomato, onion, warm spices.',ingredients:['chickpeas','tomato','onion','spices'],tags:['vegan','vegetarian','high-protein','spicy'],section:'Curries',healthScore:9}),
    item({key:'tandoori',name:'Tandoori Chicken',price:20,image:LOCAL.variant06,description:'Yogurt-marinated chicken with spices.',ingredients:['chicken','yogurt','spices'],tags:['high-protein','spicy','lighter'],section:'Grill',healthScore:8}),
    item({key:'dal',name:'Yellow Dal',price:15,image:LOCAL.variant08,description:'Lentils, turmeric, tomato, cumin.',ingredients:['lentils','turmeric','tomato','cumin'],tags:['vegan','vegetarian','high-protein','non-spicy','lighter'],section:'Curries',healthScore:10}),
    item({key:'kheer',name:'Cardamom Rice Pudding',price:7,image:LOCAL.variant10,description:'Rice pudding with milk and cardamom.',ingredients:['rice','milk','cardamom','sugar'],tags:['vegetarian','non-spicy','dessert','sweet'],section:'Dessert',healthScore:4})
  ],
  coffee: [
    item({key:'avocado-toast',name:'Avocado Toast',price:11,image:LOCAL.variant04,description:'Avocado, sourdough, herbs, lemon.',ingredients:['avocado','sourdough','herbs','lemon'],tags:['vegan','vegetarian','non-spicy','lighter'],section:'Food',healthScore:9}),
    item({key:'turkey-club',name:'Turkey Club',price:13,image:LOCAL.variant11,description:'Turkey, lettuce, tomato, bread.',ingredients:['turkey','lettuce','tomato','bread'],tags:['high-protein','non-spicy'],section:'Food',healthScore:7}),
    item({key:'egg-bites',name:'Herb Egg Bites',price:8,image:LOCAL.variant02,description:'Egg, cheese, herbs, spinach.',ingredients:['egg','cheese','herbs','spinach'],tags:['vegetarian','high-protein','non-spicy','lighter'],section:'Food',healthScore:8}),
    item({key:'brownie',name:'Chocolate Brownie',price:6,image:LOCAL.variant09,description:'Chocolate brownie with cocoa.',ingredients:['chocolate','flour','butter','sugar'],tags:['vegetarian','non-spicy','dessert','sweet'],section:'Pastries',healthScore:3})
  ]
};

function restaurant({ id, name, section, categories, rating, reviews, distance, eta, feature, priceLevel, image, imageAlt, summary, character, menu, deals, reviewHighlight }) {
  return {
    id, name, section, categories, rating, reviews, distance, eta, feature, priceLevel, image, imageAlt, summary, character,
    menu,
    deals: deals || [{ title:'25% off select items', subtitle:'Limited-time offer · Eligible items', cta:'See items' }],
    reviewHighlight: reviewHighlight || `Customers frequently mention the food as flavorful, satisfying, and dependable for a casual meal.`
  };
}

export const restaurants = [
  restaurant({ id:'passione-emporio', name:'Passione Emporio', section:'local', categories:['Pizza','Italian'], rating:4.8, reviews:'2k+', distance:1.1, eta:'24–32 min', feature:'Artisanal Roman-style pizza', priceLevel:'$$', image:LOCAL.heroPizza, imageAlt:'A warm pizza scene inside an Italian restaurant.', summary:'A neighborhood Italian spot focused on Roman-style pizza, fresh toppings, and comforting pasta.', character:{ personality:'warm, expressive, Italian neighborhood host', expression:'friendly', voiceLabel:'warm', intro:"Ciao, I'm Passione Emporio. I'm the neighborhood Italian option here—Roman-style pizza, comforting pasta, and a menu that leans fresh rather than fast-food heavy." }, menu:makeMenu('passione',[...italianTemplates, ...extraTemplates.italian]), reviewHighlight:'Guests praise the blistered pizza crust, fresh toppings, creamy pastas, and the mix of lighter and indulgent options.' }),
  restaurant({ id:'mountain-mikes', name:"Mountain Mike's Pizza", section:'national', categories:['Pizza','Fast Food'], rating:4.6, reviews:'4k+', distance:2.6, eta:'32–40 min', feature:'Crispy pepperoni and classic combinations', priceLevel:'$$', image:REMOTE.pepperoni, imageAlt:'Pepperoni pizza with crisp curled pepperoni cups.', summary:'A casual pizza chain known for crisp pepperoni cups and hearty combinations.', character:{ personality:'energetic, casual, crowd-pleasing', expression:'bold', voiceLabel:'bold', intro:"Hey, I'm Mountain Mike's. I'm the big, casual pizza-night option—crisp pepperoni, hearty portions, and familiar combinations for a group." }, menu:makeMenu('mountain',[...pizzaTemplates, ...extraTemplates.pizza]), deals:[{title:'Free item on $15+',subtitle:'Select appetizers with qualifying orders',cta:'See items'}] }),
  restaurant({ id:'papa-johns', name:"Papa John's", section:'national', categories:['Pizza','Fast Food'], rating:4.4, reviews:'5k+', distance:1.8, eta:'25–35 min', feature:'Familiar pizzas and value bundles', priceLevel:'$$', image:REMOTE.pizza, imageAlt:'Cheese and pepperoni pizza cut into slices.', summary:'Familiar pizza combinations and bundles with a predictable, straightforward menu.', character:{ personality:'straightforward, familiar, practical', expression:'friendly', voiceLabel:'warm', intro:"I'm Papa John's. I'm the familiar, straightforward pizza choice—easy combinations, bundles, and predictable flavors when you don't want to overthink dinner." }, menu:makeMenu('papa',[...pizzaTemplates, ...extraTemplates.pizza]), deals:[{title:'20% off $25+',subtitle:'Applies to selected menu items',cta:'See items'}] }),
  restaurant({ id:'taco-casa', name:'Taco Casa', section:'national', categories:['Mexican','Fast Food'], rating:4.5, reviews:'1k+', distance:0.9, eta:'18–26 min', feature:'Fast tacos and burritos', priceLevel:'$', image:REMOTE.tacos, imageAlt:'Tacos with meat, herbs, onion, and lime.', summary:'A quick Mexican option with tacos, burritos, bowls, and bold salsas.', character:{ personality:'upbeat, fast, punchy', expression:'playful', voiceLabel:'bright', intro:"I'm Taco Casa. I'm the fast, punchy option—tacos, burritos, bright salsas, and a lot of flavor without a long wait." }, menu:makeMenu('taco',[...mexicanTemplates, ...extraTemplates.mexican]) }),
  restaurant({ id:'popeyes-kitchen', name:'Popeyes Louisiana Kitchen', section:'national', categories:['Chicken','Fast Food','Sandwiches'], rating:4.3, reviews:'5k+', distance:1.2, eta:'24–30 min', feature:'Crispy fried chicken', priceLevel:'$', image:REMOTE.chicken, imageAlt:'Crispy fried chicken pieces with a golden crust.', summary:'A fast-food chicken restaurant focused on crispy, savory fried chicken and biscuits.', character:{ personality:'bold, indulgent, cheerful', expression:'bold', voiceLabel:'bold', intro:"I'm Popeyes. I'm the crispy, indulgent chicken option—salty, crunchy, and built for comfort rather than restraint." }, menu:makeMenu('popeyes',[...chickenTemplates, ...extraTemplates.chicken]), deals:[{title:'Buy 1, get 1 select items',subtitle:'Limited-time offer',cta:'See items'}] }),
  restaurant({ id:'green-table', name:'Green Table', section:'local', categories:['Healthy','Salad','Vegan'], rating:4.9, reviews:'870', distance:0.7, eta:'16–24 min', feature:'Fresh bowls and vegan options', priceLevel:'$$', image:REMOTE.salad, imageAlt:'Colorful salad bowl with leafy greens and vegetables.', summary:'A local health-focused restaurant with salads, grain bowls, and plant-forward choices.', character:{ personality:'calm, fresh, thoughtful', expression:'calm', voiceLabel:'calm', intro:"I'm Green Table. I focus on fresh bowls, vegetables, and lighter meals. If you want something balanced or plant-forward, I'm likely a strong fit." }, menu:makeMenu('green',[...healthyTemplates, ...extraTemplates.healthy]) }),
  restaurant({ id:'lotus-thai', name:'Lotus Thai Kitchen', section:'local', categories:['Thai','Asian','Noodles'], rating:4.8, reviews:'1.3k', distance:1.4, eta:'22–31 min', feature:'Fragrant curries and noodles', priceLevel:'$$', image:REMOTE.thai, imageAlt:'Thai noodle dish with herbs and vegetables.', summary:'A local Thai restaurant with aromatic curries, noodle dishes, and adjustable spice levels.', character:{ personality:'fragrant, welcoming, flexible', expression:'friendly', voiceLabel:'warm', intro:"I'm Lotus Thai Kitchen. I lean aromatic and flexible—curries, noodles, herbs, and spice levels you can tune to your mood." }, menu:makeMenu('lotus',[...asianTemplates, ...extraTemplates.asian]) }),
  restaurant({ id:'sora-sushi', name:'Sora Sushi', section:'local', categories:['Sushi','Asian','Healthy'], rating:4.7, reviews:'940', distance:2.1, eta:'28–36 min', feature:'Sushi rolls and sashimi', priceLevel:'$$$', image:REMOTE.sushi, imageAlt:'Assorted sushi rolls and nigiri on a plate.', summary:'A sushi restaurant with lighter rolls, sashimi, and cooked options.', character:{ personality:'precise, calm, refined', expression:'calm', voiceLabel:'calm', intro:"I'm Sora Sushi. I'm the precise, lighter option—clean flavors, smaller bites, and plenty of choices if you want something less heavy." }, menu:makeMenu('sora',[...sushiTemplates, ...extraTemplates.sushi]) }),
  restaurant({ id:'bombay-lane', name:'Bombay Lane', section:'local', categories:['Indian','Halal','Vegan'], rating:4.8, reviews:'2.4k', distance:1.6, eta:'27–35 min', feature:'Rich curries and vegetarian dishes', priceLevel:'$$', image:REMOTE.indian, imageAlt:'Indian curry in a bowl with herbs and spices.', summary:'An Indian restaurant with rich curries, vegetarian dishes, and warm spices.', character:{ personality:'warm, aromatic, generous', expression:'friendly', voiceLabel:'warm', intro:"I'm Bombay Lane. I'm warm, aromatic, and generous—curries, vegetarian dishes, and layered spices with plenty of comforting options." }, menu:makeMenu('bombay',[...indianTemplates, ...extraTemplates.indian]) }),
  restaurant({ id:'night-owl-coffee', name:'Night Owl Coffee', section:'deals', categories:['Coffee','Dessert','Sandwiches'], rating:4.6, reviews:'610', distance:0.4, eta:'12–18 min', feature:'Coffee, pastries, and late-night snacks', priceLevel:'$', image:REMOTE.coffee, imageAlt:'Cup of coffee on a wooden table.', summary:'A nearby coffee shop with pastries, sandwiches, and late-night snacks.', character:{ personality:'gentle, witty, late-night companion', expression:'playful', voiceLabel:'bright', intro:"I'm Night Owl Coffee. I'm the nearby late-night companion—coffee, pastries, and small snacks when you want something easy rather than a full dinner." }, menu:makeMenu('nightowl',[...coffeeTemplates, ...extraTemplates.coffee]), deals:[{title:'Free pastry with 2 drinks',subtitle:'After 8 PM · Selected pastries',cta:'See items'}] })
];

export const homeSections = [
  { id:'national', title:'National Favorites', restaurantIds:['mountain-mikes','papa-johns','taco-casa','popeyes-kitchen'] },
  { id:'local', title:'Most Popular Local Restaurants', restaurantIds:['passione-emporio','green-table','lotus-thai','sora-sushi','bombay-lane'] },
  { id:'deals', title:'Deals for You', restaurantIds:['night-owl-coffee','papa-johns','green-table','popeyes-kitchen'] }
];

export function getRestaurant(id) {
  return restaurants.find((restaurant) => restaurant.id === id);
}

export function getMenuItem(itemId) {
  for (const restaurant of restaurants) {
    const item = restaurant.menu.find((menuItem) => menuItem.id === itemId);
    if (item) return { ...item, restaurantId: restaurant.id, restaurantName: restaurant.name };
  }
  return null;
}
