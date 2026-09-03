// Main portfolio application logic

document.addEventListener('DOMContentLoaded', () => {
  // App State
  let currentPhotoIndex = 0;
  let filteredPhotos = [];
  let uniqueCategories = new Set();
  let touchStartX = 0;
  let touchStartY = 0;
  let touchEndX = 0;
  let touchEndY = 0;

  // DOM Elements
  const htmlElement = document.documentElement;
  const themeToggleBtn = document.getElementById('themeToggle');
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  
  const photoName = document.getElementById('photoName');
  const photoTitle = document.getElementById('photoTitle');
  const photoBio = document.getElementById('photoBio');
  const socialLinksContainer = document.getElementById('socialLinks');
  
  const filterContainer = document.getElementById('filterContainer');
  const galleryGrid = document.getElementById('galleryGrid');
  const emptyState = document.getElementById('emptyState');
  
  const footerYear = document.getElementById('footerYear');
  const footerName = document.getElementById('footerName');
  
  // Lightbox DOM Elements
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxLoader = document.getElementById('lightboxLoader');
  const lightboxTitle = document.getElementById('lightboxTitle');
  const lightboxCategory = document.getElementById('lightboxCategory');
  const lightboxCamera = document.getElementById('lightboxCamera');
  const lightboxClose = document.getElementById('lightboxClose');
  const lightboxBackdropClose = document.getElementById('lightboxBackdropClose');
  const lightboxPrev = document.getElementById('lightboxPrev');
  const lightboxNext = document.getElementById('lightboxNext');
  const lightboxProgress = document.getElementById('lightboxProgress');

  /* ----------------------------------------------------
   * 1. Theme Configuration
   * ---------------------------------------------------- */
  function initTheme() {
    const savedTheme = localStorage.getItem('portfolio-theme') || 'dark';
    htmlElement.setAttribute('data-theme', savedTheme);
    updateThemeMetaColor(savedTheme);
  }

  function toggleTheme() {
    const currentTheme = htmlElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    htmlElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('portfolio-theme', newTheme);
    updateThemeMetaColor(newTheme);
  }

  function updateThemeMetaColor(theme) {
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', theme === 'dark' ? '#080808' : '#faf9f6');
    }
  }

  themeToggleBtn.addEventListener('click', toggleTheme);

  /* ----------------------------------------------------
   * 2. Header and Data Binding
   * ---------------------------------------------------- */
  function loadPhotographerInfo() {
    if (typeof GALLERY_CONFIG === 'undefined') {
      console.warn('GALLERY_CONFIG is not defined. Using default visual fallbacks.');
      return;
    }

    // Name, Title, Bio
    photoName.textContent = GALLERY_CONFIG.photographerName || 'Photographer';
    photoTitle.textContent = GALLERY_CONFIG.photographerTitle || 'Visual Portfolio';
    photoBio.textContent = GALLERY_CONFIG.photographerBio || '';
    
    footerName.textContent = GALLERY_CONFIG.photographerName || 'Photographer';
    footerYear.textContent = new Date().getFullYear();

    // Render Social Links
    socialLinksContainer.innerHTML = '';
    const socialLinks = GALLERY_CONFIG.socialLinks || {};
    
    Object.entries(socialLinks).forEach(([key, url]) => {
      if (url) {
        const link = document.createElement('a');
        link.href = url;
        link.className = 'social-link';
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        
        // Format label nicely (e.g. mailto: links -> "Email")
        let label = key;
        if (key.toLowerCase() === 'email') {
          label = 'Email';
        } else {
          label = key.charAt(0).toUpperCase() + key.slice(1);
        }
        
        link.textContent = label;
        socialLinksContainer.appendChild(link);
      }
    });
  }

  /* ----------------------------------------------------
   * 3. Grid Rendering & Image Loading
   * ---------------------------------------------------- */
  function initGallery() {
    if (typeof GALLERY_CONFIG === 'undefined' || !GALLERY_CONFIG.photos || GALLERY_CONFIG.photos.length === 0) {
      showEmptyState();
      return;
    }

    emptyState.classList.add('hidden');
    galleryGrid.innerHTML = '';
    
    // Store current working set of photos
    filteredPhotos = [...GALLERY_CONFIG.photos];
    uniqueCategories.clear();

    // Gather categories & Render gallery items
    GALLERY_CONFIG.photos.forEach((photo, index) => {
      if (photo.category) {
        uniqueCategories.add(photo.category);
      }
      
      const item = createGalleryItem(photo, index);
      galleryGrid.appendChild(item);
    });

    renderFilterButtons();
  }

  function showEmptyState() {
    emptyState.classList.remove('hidden');
    galleryGrid.innerHTML = '';
    // Hide filter navigation since there are no categories
    document.querySelector('.filter-navigation').style.display = 'none';
  }

  function createGalleryItem(photo, index) {
    const item = document.createElement('div');
    item.className = 'gallery-item';
    item.dataset.category = (photo.category || 'General').toLowerCase();
    item.dataset.index = index;
    
    // Image container
    const imgContainer = document.createElement('div');
    imgContainer.className = 'gallery-img-container';
    
    const img = document.createElement('img');
    img.src = photo.src;
    img.alt = photo.title || 'Portfolio Photograph';
    img.className = 'gallery-img';
    img.loading = 'lazy'; // Native lazy loading for peak performance
    
    // Once image has successfully loaded, fade it in smoothly
    img.onload = () => {
      item.classList.add('loaded');
    };
    
    // Fallback if image fails or is already cached
    if (img.complete) {
      item.classList.add('loaded');
    }

    // Overlay detailing info
    const overlay = document.createElement('div');
    overlay.className = 'gallery-overlay';
    
    const category = document.createElement('span');
    category.className = 'overlay-category';
    category.textContent = photo.category || 'General';
    
    const title = document.createElement('h3');
    title.className = 'overlay-title';
    title.textContent = photo.title || 'Untitled';
    
    overlay.appendChild(category);
    overlay.appendChild(title);
    
    imgContainer.appendChild(img);
    imgContainer.appendChild(overlay);
    item.appendChild(imgContainer);
    
    // Click events to open lightbox
    item.addEventListener('click', () => {
      openLightbox(index);
    });
    
    return item;
  }

  /* ----------------------------------------------------
   * 4. Dynamic Filters
   * ---------------------------------------------------- */
  function renderFilterButtons() {
    // Keep 'All' button and clear dynamic ones
    const allBtn = document.getElementById('btnFilterAll');
    filterContainer.innerHTML = '';
    filterContainer.appendChild(allBtn);
    
    // Render sorted unique category pills
    const sortedCategories = Array.from(uniqueCategories).sort();
    sortedCategories.forEach(category => {
      const btn = document.createElement('button');
      btn.className = 'filter-btn';
      btn.dataset.category = category.toLowerCase();
      btn.textContent = category;
      
      btn.addEventListener('click', (e) => {
        setFilterActive(e.currentTarget);
        applyFilter(category.toLowerCase());
      });
      
      filterContainer.appendChild(btn);
    });
    
    // Set click handler on 'All' button
    allBtn.addEventListener('click', (e) => {
      setFilterActive(e.currentTarget);
      applyFilter('all');
    });
  }

  function setFilterActive(activeBtn) {
    const buttons = filterContainer.querySelectorAll('.filter-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    activeBtn.classList.add('active');
  }

  function applyFilter(category) {
    const items = galleryGrid.querySelectorAll('.gallery-item');
    
    if (category === 'all') {
      filteredPhotos = [...GALLERY_CONFIG.photos];
      items.forEach(item => {
        item.classList.remove('filtered-out');
      });
    } else {
      filteredPhotos = GALLERY_CONFIG.photos.filter(p => (p.category || 'General').toLowerCase() === category);
      items.forEach(item => {
        if (item.dataset.category === category) {
          item.classList.remove('filtered-out');
        } else {
          item.classList.add('filtered-out');
        }
      });
    }
  }

  /* ----------------------------------------------------
   * 5. Lightbox Functionality
   * ---------------------------------------------------- */
  function openLightbox(originalIndex) {
    // We want navigation inside the lightbox to conform to the current FILTERED photo subset!
    // So we match the clicked photo by source URL within the current filtered selection.
    const selectedPhoto = GALLERY_CONFIG.photos[originalIndex];
    let filteredIndex = filteredPhotos.findIndex(p => p.src === selectedPhoto.src);
    
    // If not found in filtered selection, fallback to index 0
    if (filteredIndex === -1) {
      filteredIndex = 0;
    }
    
    currentPhotoIndex = filteredIndex;
    updateLightboxContent();
    
    lightbox.classList.add('active');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden'; // Stop page scrolling
    lightbox.focus();
  }

  function closeLightbox() {
    lightbox.classList.remove('active');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = ''; // Restore scrolling
    lightboxImg.classList.remove('loaded');
    lightboxImg.src = '';
  }

  function navigateLightbox(direction) {
    if (filteredPhotos.length <= 1) return;
    
    lightboxImg.classList.remove('loaded');
    lightboxLoader.classList.add('active');
    
    if (direction === 'next') {
      currentPhotoIndex = (currentPhotoIndex + 1) % filteredPhotos.length;
    } else if (direction === 'prev') {
      currentPhotoIndex = (currentPhotoIndex - 1 + filteredPhotos.length) % filteredPhotos.length;
    }
    
    updateLightboxContent();
  }

  function updateLightboxContent() {
    const photo = filteredPhotos[currentPhotoIndex];
    if (!photo) return;
    
    // Update progress bar
    const progressPercent = ((currentPhotoIndex + 1) / filteredPhotos.length) * 100;
    lightboxProgress.style.width = `${progressPercent}%`;
    
    // Load image
    lightboxLoader.classList.add('active');
    lightboxImg.src = photo.src;
    lightboxImg.alt = photo.title || 'Fullscreen portfolio image';
    
    lightboxImg.onload = () => {
      lightboxLoader.classList.remove('active');
      lightboxImg.classList.add('loaded');
    };
    
    // Dynamic description fields
    lightboxTitle.textContent = photo.title || 'Untitled';
    lightboxCategory.textContent = photo.category || 'General';
    
    if (photo.cameraSettings) {
      lightboxCamera.textContent = photo.cameraSettings;
      lightboxCamera.parentElement.style.display = 'block';
    } else {
      lightboxCamera.parentElement.style.display = 'none';
    }
  }

  // Event Listeners for Lightbox
  lightboxClose.addEventListener('click', closeLightbox);
  lightboxBackdropClose.addEventListener('click', closeLightbox);
  lightboxPrev.addEventListener('click', () => navigateLightbox('prev'));
  lightboxNext.addEventListener('click', () => navigateLightbox('next'));

  // Keyboard navigation (desktop accessibility)
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;
    
    if (e.key === 'Escape') {
      closeLightbox();
    } else if (e.key === 'ArrowRight') {
      navigateLightbox('next');
    } else if (e.key === 'ArrowLeft') {
      navigateLightbox('prev');
    }
  });

  /* ----------------------------------------------------
   * 6. Mobile Gesture Support (Swipe)
   * ---------------------------------------------------- */
  lightbox.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
  }, { passive: true });

  lightbox.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    handleSwipeGesture();
  }, { passive: true });

  function handleSwipeGesture() {
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);
    
    const horizontalThreshold = 50; // minimum distance in px
    const verticalThreshold = 100;
    
    // Check if horizontal swipe was major
    if (absDeltaX > absDeltaY && absDeltaX > horizontalThreshold) {
      if (deltaX < 0) {
        // Swiped Left -> show next photo
        navigateLightbox('next');
      } else {
        // Swiped Right -> show previous photo
        navigateLightbox('prev');
      }
    } 
    // Check if swipe down occurred to close the view
    else if (absDeltaY > absDeltaX && absDeltaY > verticalThreshold && deltaY > 0) {
      // Swipe Down -> Close
      closeLightbox();
    }
  }

  /* ----------------------------------------------------
   * 7. Back to Top Floating Button
   * ---------------------------------------------------- */
  const backToTopBtn = document.getElementById('backToTop');
  
  if (backToTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 300) {
        backToTopBtn.classList.add('visible');
      } else {
        backToTopBtn.classList.remove('visible');
      }
    }, { passive: true });

    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  /* ----------------------------------------------------
   * 8. Initialization Trigger
   * ---------------------------------------------------- */
  initTheme();
  loadPhotographerInfo();
  initGallery();
});
