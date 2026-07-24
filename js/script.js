document.addEventListener('DOMContentLoaded', function() {
  
  // --- Hero Slideshow ---
  var slideshow = document.getElementById('slideshow');
  if (slideshow) {
    var slidesData = [];
    var slideElements = [];
    var dots = [];
    var currentSlide = 0;
    var progressInterval = null;
    var slideDuration = 5000;
    var progressStep = 50;
    
    function buildSlides(data) {
      slideshow.innerHTML = '';
      var dotsContainer = document.createElement('div');
      dotsContainer.className = 'slide-dots';
      
      data.forEach(function(slide, index) {
        var slideEl = document.createElement('div');
        slideEl.className = 'slide' + (index === 0 ? ' active' : '');
        
        var img = document.createElement('img');
        img.src = slide.image;
        img.alt = slide.title;
        img.loading = index === 0 ? 'eager' : 'lazy';
        
        var overlay = document.createElement('div');
        overlay.className = 'slide-overlay';
        
        var content = document.createElement('div');
        content.className = 'slide-content';
        
        var eyebrow = document.createElement('span');
        eyebrow.className = 'slide-eyebrow';
        eyebrow.textContent = slide.eyebrow;
        
        var title = document.createElement('h1');
        title.className = 'slide-title';
        var words = slide.title.split(' ');
        var mid = Math.ceil(words.length / 2);
        var line1 = document.createElement('span');
        line1.className = 'title-line';
        line1.textContent = words.slice(0, mid).join(' ');
        var line2 = document.createElement('span');
        line2.className = 'title-line';
        line2.textContent = words.slice(mid).join(' ');
        title.appendChild(line1);
        title.appendChild(line2);
        
        var desc = document.createElement('p');
        desc.className = 'slide-description';
        desc.textContent = slide.description;
        
        var cta = document.createElement('div');
        cta.className = 'slide-cta';
        var primaryBtn = document.createElement('a');
        primaryBtn.className = 'btn btn-primary';
        primaryBtn.href = slide.primaryCTA.link;
        primaryBtn.textContent = slide.primaryCTA.text;
        var secondaryBtn = document.createElement('a');
        secondaryBtn.className = 'btn btn-ghost';
        secondaryBtn.href = slide.secondaryCTA.link;
        secondaryBtn.textContent = slide.secondaryCTA.text;
        cta.appendChild(primaryBtn);
        cta.appendChild(secondaryBtn);
        
        content.appendChild(eyebrow);
        content.appendChild(title);
        content.appendChild(desc);
        content.appendChild(cta);
        
        slideEl.appendChild(img);
        slideEl.appendChild(overlay);
        slideEl.appendChild(content);
        slideshow.appendChild(slideEl);
        
        var dot = document.createElement('button');
        dot.className = 'dot' + (index === 0 ? ' active' : '');
        dot.setAttribute('aria-label', 'Slide ' + (index + 1));
        dotsContainer.appendChild(dot);
      });
      
      slideshow.appendChild(dotsContainer);
      
      slideElements = slideshow.querySelectorAll('.slide');
      dots = dotsContainer.querySelectorAll('.dot');
      
      // --- Create nav buttons (must be inside buildSlides, after slides are created) ---
      var prevBtn = document.createElement('button');
      prevBtn.className = 'slide-nav slide-prev';
      prevBtn.setAttribute('aria-label', 'Previous slide');
      prevBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      
      var nextBtn = document.createElement('button');
      nextBtn.className = 'slide-nav slide-next';
      nextBtn.setAttribute('aria-label', 'Next slide');
      nextBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      
      slideshow.appendChild(prevBtn);
      slideshow.appendChild(nextBtn);
      
      prevBtn.addEventListener('click', prevSlide);
      nextBtn.addEventListener('click', nextSlide);
      
      // Dot click handlers
      dots.forEach(function(dot, index) {
        dot.addEventListener('click', function() {
          goToSlide(index);
          resetProgress();
        });
      });
      
      slideshow.addEventListener('mouseenter', stopSlideshow);
      slideshow.addEventListener('mouseleave', startSlideshow);
      
      // Touch/swipe
      var touchStartX = 0;
      slideshow.addEventListener('touchstart', function(e) {
        touchStartX = e.changedTouches[0].screenX;
        stopSlideshow();
      }, { passive: true });
      
      slideshow.addEventListener('touchend', function(e) {
        var touchEndX = e.changedTouches[0].screenX;
        var diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 50) {
          if (diff > 0) nextSlide();
          else prevSlide();
          startSlideshow();
        }
      }, { passive: true });
      
      goToSlide(0);
    }
    
    function goToSlide(index) {
      slideElements.forEach(function(s) { s.classList.remove('active'); });
      dots.forEach(function(d) { d.classList.remove('active'); });
      slideElements[index].classList.add('active');
      dots[index].classList.add('active');
      
      var progressBar = document.getElementById('progressBar');
      if (progressBar) progressBar.style.width = '0%';
      currentSlide = index;
    }
    
    function nextSlide() {
      var newIndex = (currentSlide + 1) % slideElements.length;
      goToSlide(newIndex);
      resetProgress();
    }
    
    function prevSlide() {
      var newIndex = (currentSlide - 1 + slideElements.length) % slideElements.length;
      goToSlide(newIndex);
      resetProgress();
    }
    
    function updateProgress() {
      var progressBar = document.getElementById('progressBar');
      if (!progressBar) return;
      var currentWidth = parseFloat(progressBar.style.width) || 0;
      var increment = (progressStep / slideDuration) * 100;
      var newWidth = Math.min(currentWidth + increment, 100);
      progressBar.style.width = newWidth + '%';
      if (newWidth >= 100) nextSlide();
    }
    
    function resetProgress() {
      clearInterval(progressInterval);
      progressInterval = setInterval(updateProgress, progressStep);
    }
    
    function startSlideshow() {
      resetProgress();
    }
    
    function stopSlideshow() {
      clearInterval(progressInterval);
      var progressBar = document.getElementById('progressBar');
      if (progressBar) progressBar.style.width = '0%';
    }
    
    // Load slides from data/data.json
    fetch('data/data.json')
      .then(function(response) { return response.json(); })
      .then(function(jsonData) {
        slidesData = jsonData.slides || [];
        if (slidesData.length > 0) {
          buildSlides(slidesData);
          startSlideshow();
        } else {
          console.warn('No slides found in data.json');
          buildSlides(getFallbackSlides());
          startSlideshow();
        }
      })
      .catch(function(err) {
        console.warn('Failed to load data/data.json, using fallback:', err);
        buildSlides(getFallbackSlides());
        startSlideshow();
      });

    function getFallbackSlides() {
      return [
        { eyebrow: 'NEWTON, PENNSYLVANIA', title: 'Every Adventure Starts Here', description: 'Join a troop where every young person finds their place.', image: 'images/summer-camp-hero.jpg', primaryCTA: { text: 'JOIN TROOP 99', link: 'join.html' }, secondaryCTA: { text: 'EXPLORE', link: 'activities.html' } },
        { eyebrow: 'COMMUNITY PRIDE', title: 'Serving Our Community', description: 'From Memorial Day Parade to MLK Service Project.', image: 'images/parade-hero.jpg', primaryCTA: { text: 'GET INVOLVED', link: 'activities.html' }, secondaryCTA: { text: 'LEARN MORE', link: 'about.html' } },
        { eyebrow: 'OUTDOOR ADVENTURE', title: 'Build Confidence Through Adventure', description: 'Summer camp, backpacking, rafting — real challenges that build real leaders.', image: 'images/rafting-hero.jpg', primaryCTA: { text: 'VIEW ACTIVITIES', link: 'activities.html' }, secondaryCTA: { text: 'JOIN TODAY', link: 'join.html' } }
      ];
    }
  }
  
  // --- Navigation Scroll Effect ---
  var navbar = document.getElementById('navbar');
  window.addEventListener('scroll', function() {
    if (window.pageYOffset > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }, { passive: true });
  
  // --- Mobile Menu Toggle ---
  var navToggle = document.getElementById('navToggle');
  var navMenu = document.getElementById('navMenu');
  
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', function() {
      navMenu.classList.toggle('active');
      navToggle.classList.toggle('active');
      document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
    });
    
    document.querySelectorAll('.nav-link').forEach(function(link) {
      link.addEventListener('click', function() {
        navMenu.classList.remove('active');
        navToggle.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }
  
  // --- Active Navigation Highlighting ---
  var currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(function(link) {
    var linkPage = link.getAttribute('href');
    if (linkPage === currentPage || (currentPage === '' && linkPage === 'index.html')) {
      link.classList.add('active');
    }
  });
  
  // --- Scroll Reveal Animations ---
  function revealOnScroll() {
    document.querySelectorAll('.activity-card, .eagle-step, .event-item, .gallery-item').forEach(function(element) {
      var rect = element.getBoundingClientRect();
      var windowHeight = window.innerHeight;
      if (rect.top < windowHeight - 100) {
        element.classList.add('visible');
      }
    });
  }
  
  revealOnScroll();
  
  window.addEventListener('scroll', function() {
    requestAnimationFrame(revealOnScroll);
  }, { passive: true });
  
  // --- Smooth Scroll ---
   document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
     anchor.addEventListener('click', function(e) {
       var targetId = this.getAttribute('href');
       if (targetId === '#') return;
       var targetElement = document.querySelector(targetId);
       if (targetElement) {
         e.preventDefault();
         targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
       }
     });
   });

   // --- Contact Form Submission ---
   var contactForm = document.getElementById('contactForm');
   if (contactForm) {
     contactForm.addEventListener('submit', function(e) {
       e.preventDefault();

       // Sanity-check email
       var emailField = document.getElementById('email');
       var emailVal = emailField.value.trim();
       var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
       if (!emailRe.test(emailVal)) {
         alert('Please enter a valid email address (e.g. you@example.com).');
         emailField.focus();
         return;
       }

       var formData = new FormData(contactForm);
       var msg = {
         id: Date.now().toString(36) + Math.random().toString(36).substr(2),
         name: formData.get('name').trim(),
         email: emailVal,
         phone: formData.get('phone').trim() || 'N/A',
         message: formData.get('message').trim(),
         date: new Date().toLocaleString()
       };

       // Load existing messages, append, save
       var data = JSON.parse(localStorage.getItem('troop99_admin_data') || '{"messages":[]}');
       data.messages = data.messages || [];
       data.messages.unshift(msg);
       localStorage.setItem('troop99_admin_data', JSON.stringify(data));

       // Show confirmation
       contactForm.reset();
       alert('Message sent! We will get back to you soon.');
     });
   }

  });
