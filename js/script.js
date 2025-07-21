(function ($) {
  "use strict";

  window.addEventListener("load", () => {
    // Slide preloader up
    $(".preloader").addClass("loaded");

    // Wait for animation to finish before removing it
    setTimeout(() => {
      $(".preloader").remove();
      AOS.refresh(); // Refresh AOS after preloader disappears
    }, 600); // Match CSS transition duration
  });

  /* Button hover effect */
  document.querySelectorAll('.button').forEach(button => {
    button.onmousemove = function (e) {
      var rect = e.target.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      e.target.style.setProperty('--x', x + 'px');
      e.target.style.setProperty('--y', y + 'px');
    };
  });

  $(document).ready(function () {

    $('.counter-value').each(function () {
      var $this = $(this),
        countTo = $this.attr('data-count');

      $this.prop('Counter', 0).animate({
        Counter: countTo
      }, {
        duration: 2000,
        easing: 'swing',
        step: function (now) {
          $this.text(Math.floor(now));
        },
        complete: function () {
          $this.text(countTo);
        }
      });
    });

    // Isotope Initialization
    var $container = $('.isotope-container');
    if ($container.length) {
      $container.isotope({
        itemSelector: '.item',
        layoutMode: 'masonry'
      });
    }

    // Chocolat Lightbox Init
    if ($('.image-link').length) {
      Chocolat(document.querySelectorAll('.image-link'), {
        imageSize: 'contain',
        loop: true,
      });
    }

    // Animate On Scroll (AOS) Init
    AOS.init({
      duration: 5000,
      once: true,
    });

    // Swiper Slider Init
    if ($('.portfolio-swiper').length) {
      new Swiper('.portfolio-swiper', {
        slidesPerView: 1,
        spaceBetween: 30,
        pagination: { el: '.swiper-pagination', clickable: true },
      });
    }

    // Swiper Slider Init
    if ($('.testimonial-swiper').length) {
      new Swiper('.testimonial-swiper', {
        slidesPerView: 1,
        spaceBetween: 30,
        pagination: { el: '.swiper-pagination', clickable: true },
      });
    }

    // Filter Buttons Active State & Filtering
    $('.filter-button').click(function () {
      $('.filter-button').removeClass('active');
      $(this).addClass('active');

      var filterValue = $(this).attr('data-filter');
      $container.isotope({ filter: filterValue === '*' ? '*' : filterValue });

      // Reinitialize AOS after filtering
      AOS.refresh();
    });

  });

})(jQuery);