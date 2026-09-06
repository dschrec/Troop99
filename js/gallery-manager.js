// Gallery Manager - Dynamic photo gallery renderer for Troop 99
// Reads gallery.json and renders the gallery dynamically

document.addEventListener('DOMContentLoaded', () => {
  const galleryContainer = document.querySelector('.gallery-preview');
  if (!galleryContainer) return;

  // Load gallery data
  fetch('data/gallery.json')
    .then(response => response.json())
    .then(data => {
      // Sort photos by year and month (newest first)
      const sortedPhotos = data.sort((a, b) => {
        if (b.year !== a.year) return b.year - a.year;
        return b.month - a.month;
      });

      // Group photos by year
      const groupedByYear = {};
      sortedPhotos.forEach(photo => {
        if (!groupedByYear[photo.year]) {
          groupedByYear[photo.year] = [];
        }
        groupedByYear[photo.year].push(photo);
      });

      // Clear existing content
      galleryContainer.innerHTML = '';

      // Render each year section
      Object.keys(groupedByYear).sort((a, b) => b - a).forEach(year => {
        const yearSection = document.createElement('div');
        yearSection.classList.add('gallery-year-section');

        const yearHeader = document.createElement('h3');
        yearHeader.classList.add('gallery-year-header');
        yearHeader.textContent = year;
        yearSection.appendChild(yearHeader);

        const photoGrid = document.createElement('div');
        photoGrid.classList.add('gallery-grid');

        groupedByYear[year].forEach(photo => {
          const photoItem = document.createElement('a');
          photoItem.href = `images/${photo.filename}`;
          photoItem.target = '_blank';
          photoItem.rel = 'noopener';
          photoItem.classList.add('gallery-item');

          const img = document.createElement('img');
          img.src = `images/${photo.filename}`;
          img.alt = photo.caption;
          img.loading = 'lazy';

          const caption = document.createElement('div');
          caption.classList.add('gallery-item-caption');
          caption.textContent = photo.caption;

          photoItem.appendChild(img);
          photoItem.appendChild(caption);
          photoGrid.appendChild(photoItem);
        });

        yearSection.appendChild(photoGrid);
        galleryContainer.appendChild(yearSection);
      });

      // Add text footer
      const footer = document.createElement('div');
      footer.classList.add('text-center');
      footer.style.marginTop = 'var(--space-2xl)';

      const paragraph = document.createElement('p');
      paragraph.style.fontSize = 'var(--size-lg)';
      paragraph.style.color = 'var(--gray-600)';
      paragraph.style.marginBottom = 'var(--space-lg)';
      paragraph.textContent = `Photos from our scouts' adventures — ${sortedPhotos.length} photos captured from ${Object.keys(groupedByYear).sort((a, b) => b - a)[0]} back to ${Object.keys(groupedByYear).sort((a, b) => a - b)[0]}.`;

      footer.appendChild(paragraph);
      galleryContainer.appendChild(footer);
    })
    .catch(error => {
      console.error('Error loading gallery:', error);
      galleryContainer.innerHTML = '<p class="text-center">Gallery temporarily unavailable. Please try again later.</p>';
    });
});

// Gallery filtering functionality
document.addEventListener('click', (e) => {
  const filterBtn = e.target.closest('.filter-btn');
  if (!filterBtn) return;

  const category = filterBtn.dataset.category;
  const items = document.querySelectorAll('.gallery-item');

  items.forEach(item => {
    const img = item.querySelector('img');
    if (category === 'all' || img.alt.includes(category)) {
      item.style.display = '';
    } else {
      item.style.display = 'none';
    }
  });
});
