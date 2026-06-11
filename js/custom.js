$(document).ready(function () {

    /* Auto-collapse mobile navbar after clicking a link */
    $('#mainNav .nav-link').on('click', function () {
        if ($('.navbar-toggler').is(':visible')) {
            $('#mainNav').collapse('hide');
        }
    });

    /* Hide navbar on scroll down, show on scroll up */
    var lastScrollTop = 0;
    var navbar = document.querySelector('.site-navbar');

    window.addEventListener('scroll', function () {
        var currentScroll = window.pageYOffset || document.documentElement.scrollTop;
        if (currentScroll > lastScrollTop && currentScroll > 100) {
            navbar.classList.add('nav-hidden');
            if ($('.navbar-toggler').is(':visible')) {
                $('#mainNav').collapse('hide');
            }
        } else {
            navbar.classList.remove('nav-hidden');
        }
        lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
    });

    /* ============================
       ISOTOPE — project grids
       ============================ */

    var currentLang = '';

    function buildFilterFn() {
        var lang = currentLang;
        return function () {
            var $el = $(this);
            if (!lang) return true;
            var langs = ($el.attr('data-languages') || '').toLowerCase().split(/\s+/);
            return langs.indexOf(lang) !== -1;
        };
    }

    function refilterGrids() {
        var fn = buildFilterFn();
        $deployedGrid.isotope({ transitionDuration: 0, filter: fn });
        $academicGrid.isotope({ transitionDuration: 0, filter: fn });
        setTimeout(function () {
            $deployedGrid.isotope({ transitionDuration: '0.3s' });
            $academicGrid.isotope({ transitionDuration: '0.3s' });
        }, 50);
    }

    var $deployedGrid = $('#deployed-grid').isotope({
        itemSelector: '.project-card',
        layoutMode: 'fitRows',
        percentPosition: true,
        filter: buildFilterFn()
    });

    var $academicGrid = $('#academic-grid').isotope({
        itemSelector: '.project-card',
        layoutMode: 'fitRows',
        percentPosition: true,
        filter: buildFilterFn()
    });

    $(window).on('resize', function () {
        $deployedGrid.isotope('layout');
        $academicGrid.isotope('layout');
    });

    /* ============================
       PROJECT MODAL
       ============================ */

    /* Build modal shell once */
    var $modal = $([
        '<div class="project-modal-overlay" id="projectModal" role="dialog" aria-modal="true" aria-label="Project details">',
        '  <div class="project-modal-container">',
        '    <button class="project-modal-close" aria-label="Close">&times;</button>',
        '    <div class="project-modal-body"></div>',
        '  </div>',
        '</div>'
    ].join('')).appendTo('body');

    var $modalBody = $modal.find('.project-modal-body');

    function openModal(detailsHtml) {
        $modalBody.html(detailsHtml);
        $modal.addClass('is-open');
        $('body').addClass('modal-open-project');

        /* Re-init carousels and AOS inside modal */
        $modal.find('[data-ride="carousel"]').carousel();
        $modal.find('.fitness-gallery').magnificPopup({
            type: 'image',
            gallery: { enabled: true, navigateByImgClick: true, preload: [0, 1] },
            image: { titleSrc: function (item) { return item.el.data('caption') || ''; } },
            removalDelay: 300,
            mainClass: 'mfp-fade'
        });


        /* Scroll modal to top */
        $modal.find('.project-modal-container').scrollTop(0);
    }

    function closeModal() {
        $modal.removeClass('is-open');
        $('body').removeClass('modal-open-project');
        setTimeout(function () { $modalBody.empty(); }, 300);
        /* Reset all tile labels */
        $('.project-tile')
            .attr('aria-expanded', 'false')
            .addClass('collapsed')
            .removeClass('is-active')
            .find('.project-tile-cta').text('View details');
        $('.project-card').removeClass('project-card-active');
    }

    /* Close on overlay click */
    $modal.on('click', function (e) {
        if ($(e.target).is($modal)) closeModal();
    });

    /* Close button */
    $modal.on('click', '.project-modal-close', closeModal);

    /* Escape key */
    $(document).on('keydown', function (e) {
        if (e.key === 'Escape' && $modal.hasClass('is-open')) closeModal();
        if (e.key === 'Escape' && $('.skill-filter.is-active').length) clearLangFilter();
    });

    /* ============================
       TILE CLICK
       ============================ */

    $('.project-tile').on('click', function (e) {
        e.preventDefault();
        e.stopPropagation();

        var $tile = $(this);
        var targetSel = $tile.data('target');
        var $details = $(targetSel);
        if (!$details.length) return;

        var isOpen = $modal.hasClass('is-open') && $tile.hasClass('is-active');

        /* Reset all tiles first */
        $('.project-tile')
            .attr('aria-expanded', 'false')
            .addClass('collapsed')
            .removeClass('is-active')
            .find('.project-tile-cta').text('View details');
        $('.project-card').removeClass('project-card-active');

        if (isOpen) {
            closeModal();
            return;
        }

        /* Mark this tile active */
        $tile.attr('aria-expanded', 'true')
             .removeClass('collapsed')
             .addClass('is-active')
             .find('.project-tile-cta').text('Hide details');
        $tile.closest('.project-card').addClass('project-card-active');

        /* Clone the detail content (not the collapse wrapper) into modal */
        var $content = $details.find('.project-detail-card').clone();
        openModal($content[0].outerHTML);
    });

    /* ============================
       LANGUAGE FILTER
       ============================ */

    function clearLangFilter(skipRefilter) {
        currentLang = '';
        $('.project-grid').removeClass('language-filter-active');
        $('.project-card').removeClass('language-match');
        $('.skill-filter').removeClass('is-active').attr('aria-pressed', 'false');
        if (!skipRefilter) refilterGrids();
    }

    $(document).on('click', '.project-filter-clear', function () {
        clearLangFilter();
        $('html, body').animate({ scrollTop: $('#projects-section').offset().top - 110 }, 450);
    });

    $('.skill-filter').attr('aria-pressed', 'false').on('click', function () {
        var $pill = $(this);
        var lang = String($pill.data('language') || '').toLowerCase().trim();
        if (!lang) return;

        var wasActive = $pill.hasClass('is-active');
        clearLangFilter(!!currentLang);

        if (wasActive) {
            refilterGrids();
            $('html, body').animate({ scrollTop: $('#projects-section').offset().top - 110 }, 450);
            return;
        }

        currentLang = lang;
        var $matches = $('.project-card').filter(function () {
            var langs = String($(this).attr('data-languages') || '').toLowerCase().split(/\s+/);
            return langs.indexOf(lang) !== -1;
        });
        $pill.addClass('is-active').attr('aria-pressed', 'true');
        $('.project-grid').addClass('language-filter-active');
        $matches.addClass('language-match');
        refilterGrids();
        $('html, body').animate({ scrollTop: $('#projects-section').offset().top - 110 }, 450);
    });

    /* ============================
       COURSEWORK TOGGLE
       ============================ */

    $('#usdCourses').on('show.bs.collapse', function () {
        $('.education-toggle[data-target="#usdCourses"]').text('Hide Coursework');
    }).on('hide.bs.collapse', function () {
        $('.education-toggle[data-target="#usdCourses"]').text('View Coursework');
    });

    /* ============================
        RETURN TO TOP
       ============================ */

    var $scrollBtn = $('#scrollTopBtn');
    var aboutEl = document.getElementById('about-section');
    if ($scrollBtn.length && aboutEl) {
        window.addEventListener('scroll', function () {
            $scrollBtn.toggleClass('visible', window.scrollY > aboutEl.offsetTop + aboutEl.offsetHeight);
        });
        $scrollBtn[0].addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

});