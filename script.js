// ====== Elements ======
const carouselTrack = document.getElementById('carouselTrack');
const allCars = Array.from(carouselTrack.querySelectorAll('.car-card'));
const filterBar = document.querySelector('.car-filters');
const filterButtons = Array.from(filterBar.querySelectorAll('button'));
const lightbox = document.getElementById('lightboxPopup');
const lightboxImage = document.getElementById('lightboxImage');
const lightboxClose = document.getElementById('closeLightbox');

let visibleCars = allCars.slice(); // currently visible cars
let currentCenter = 0;
let lightboxOpen = false;

// ====== Helpers ======
function clampCenter() {
  if (visibleCars.length === 0) {
    visibleCars = allCars.slice();
    filterButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.filter === 'all'));
  }
  currentCenter = Math.min(currentCenter, visibleCars.length - 1);
}

function circularDiff(i, j, n) {
  let diff = i - j;
  if (diff > n / 2) diff -= n;
  if (diff < -n / 2) diff += n;
  return diff;
}

// Render carousel positions
function renderCarousel() {
  const n = visibleCars.length;
  if (n === 0) return;

  const cardWidth = visibleCars[0].getBoundingClientRect().width || 360;
  const gap = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--gap-size')) || 60;
  const shift = cardWidth + gap;

  visibleCars.forEach((car, i) => {
    const diff = circularDiff(i, currentCenter, n);
    car.classList.remove('center', 'left', 'right', 'hidden');

    if (diff === 0) {
      car.style.transform = `translate(calc(-50% + 0px), -50%) scale(1)`;
      car.classList.add('center'); 
      car.style.opacity = 1;
      car.style.zIndex = 30;
    } else if (Math.abs(diff) === 1) {
      const dx = diff * shift;
      car.style.transform = `translate(calc(-50% + ${dx}px), -50%) scale(0.85)`;
      car.classList.add(diff < 0 ? 'left' : 'right');
      car.style.opacity = 0.85;
      car.style.zIndex = 20;
    } else {
      const dx = diff * shift;
      car.style.transform = `translate(calc(-50% + ${dx}px), -50%) scale(0.7)`;
      car.classList.add('hidden');
      car.style.opacity = 0;
      car.style.zIndex = 10;
    }
  });

  allCars.forEach(car => {
    if (!visibleCars.includes(car)) {
      car.classList.add('hidden');
      car.style.opacity = 0;
    }
  });
}

// Move carousel
function moveCarousel(direction) {
  if (visibleCars.length === 0) return;
  currentCenter = (currentCenter + (direction === 'next' ? 1 : -1) + visibleCars.length) % visibleCars.length;
  renderCarousel();
  if (lightboxOpen) lightboxImage.src = visibleCars[currentCenter].src;
}

// Create arrow buttons
function createArrowButton(direction, color = 'white') {
  const btn = document.createElement('button');
  btn.classList.add('arrow');
  btn.dataset.dir = direction;

  btn.innerHTML = direction === 'prev'
    ? `<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
         <polyline points="15 18 9 12 15 6"></polyline>
       </svg>`
    : `<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
         <polyline points="9 18 15 12 9 6"></polyline>
       </svg>`;

  btn.addEventListener('click', () => moveCarousel(direction));
  return btn;
}

// ====== Carousel arrows ======
const carousel = document.querySelector('.car-carousel');
const carouselArrowsContainer = document.createElement('div');
carouselArrowsContainer.classList.add('carousel-arrows');
carouselArrowsContainer.append(createArrowButton('prev'), createArrowButton('next'));
carousel.appendChild(carouselArrowsContainer);

// ====== Lightbox arrows ======
const lightboxArrows = document.createElement('div');
lightboxArrows.classList.add('lightbox-arrows');

function createLightboxArrow(direction) {
  const btn = document.createElement('button');
  btn.classList.add('arrow-btn');

  btn.innerHTML = direction === 'prev'
    ? `<svg viewBox="0 0 24 24" fill="none">
         <polyline points="15 18 9 12 15 6"></polyline>
       </svg>`
    : `<svg viewBox="0 0 24 24" fill="none">
         <polyline points="9 18 15 12 9 6"></polyline>
       </svg>`;

  btn.addEventListener('click', e => {
    e.stopPropagation();
    moveCarousel(direction);
    lightboxImage.src = visibleCars[currentCenter].src;
  });

  return btn;
}

lightboxArrows.append(createLightboxArrow('prev'), createLightboxArrow('next'));

// Remove existing arrows if any and append
lightbox.querySelectorAll('.lightbox-arrows').forEach(el => el.remove());
lightbox.appendChild(lightboxArrows);

// ====== Filter buttons ======
filterBar.addEventListener('click', e => {
  const btn = e.target.closest('button');
  if (!btn) return;

  filterButtons.forEach(b => b.classList.toggle('active', b === btn));
  const category = btn.dataset.filter;

  allCars.forEach(car => {
    car.style.display = (category === 'all' || car.dataset.category === category) ? 'block' : 'none';
  });

  visibleCars = allCars.filter(car => car.style.display !== 'none');
  clampCenter();
  currentCenter = 0;
  renderCarousel();
});

// ====== Lightbox open/close ======
allCars.forEach(car => car.addEventListener('click', () => {
  if (car.style.display === 'none') return;
  currentCenter = visibleCars.indexOf(car);
  renderCarousel();
  lightboxImage.src = car.src;
  lightbox.classList.add('open');
  lightboxOpen = true;
}));

lightboxClose.addEventListener('click', () => { lightbox.classList.remove('open'); lightboxOpen = false; });
lightbox.addEventListener('click', e => { if (e.target === lightbox) { lightbox.classList.remove('open'); lightboxOpen = false; } });

// ====== Keyboard support ======
window.addEventListener('keydown', e => {
  if (lightboxOpen) {
    if (e.key === 'ArrowLeft') lightbox.querySelector('[data-dir="prev"]').click();
    if (e.key === 'ArrowRight') lightbox.querySelector('[data-dir="next"]').click();
    if (e.key === 'Escape') lightboxClose.click();
  } else {
    if (e.key === 'ArrowLeft') carousel.querySelector('[data-dir="prev"]').click();
    if (e.key === 'ArrowRight') carousel.querySelector('[data-dir="next"]').click();
  }
});

// ====== Initial render ======
renderCarousel();
window.addEventListener('resize', renderCarousel);
