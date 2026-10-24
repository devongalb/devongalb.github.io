$(document).ready(function () {

    var isNavigating = false;

    /* =========================================
        SMOOTH NAVIGATION SCROLLING
       ========================================= */

    $('#mainNav a.nav-link[href^="#"]').on('click', function (e) {

        var targetId = $(this).attr('href');

        // Ignore invalid navigation links
        if (!targetId || targetId === '#') return;

        var $target = $(targetId);
        if (!$target.length) return;

        e.preventDefault();

        // Indicate that automatic navigation is happening
        isNavigating = true;

        // Keep navbar visible during navigation
        navbar.classList.remove('nav-hidden');

        // Calculate destination with navbar offset
        var headerHeight = $('.site-navbar').outerHeight() || 0;
        var destination = Math.max(
            0,
            $target.offset().top - headerHeight - 12
        );

        // Respect reduced-motion accessibility settings
        var reducedMotion = window.matchMedia(
            '(prefers-reduced-motion: reduce)'
        ).matches;

        // Calculate distance between current and target position
        var distance = Math.abs(
            $(window).scrollTop() - destination
        );

        // Dynamic duration: minimum 500ms, maximum 900ms
        var duration = reducedMotion
            ? 0
            : Math.min(900, Math.max(500, distance * 0.45));

        // Perform smooth scrolling
        $('html, body').stop(true).animate(
            { scrollTop: destination },
            duration,
            'swing',
            function () {

                // Resume normal navbar behavior
                isNavigating = false;

                // Reset scroll position tracking
                lastScrollTop = window.pageYOffset ||
                    document.documentElement.scrollTop;
            }
        );
    });

    /* Auto-collapse mobile navbar after clicking a link */
    $('#mainNav .nav-link').on('click', function () {
        if ($('.navbar-toggler').is(':visible')) {
            $('#mainNav').collapse('hide');
        }
    });

    /* =========================================
        NAVBAR VISIBILITY
       ========================================= */

    var lastScrollTop = 0;
    var navbar = document.querySelector('.site-navbar');

    window.addEventListener('scroll', function () {

        // Don't hide the navbar during automatic navigation
        if (isNavigating) return;

        var currentScroll = window.pageYOffset ||
            document.documentElement.scrollTop;

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

    var $projectGrids = $('#hci-grid, #interactive-grid, #engineering-grid');

    $projectGrids.each(function () {
        $(this).isotope({
            itemSelector: '.project-card',
            layoutMode: 'fitRows',
            percentPosition: true,
            filter: buildFilterFn()
        });
    });

    /* =========================================
        PROJECT CATEGORY VISIBILITY
       ========================================= */

    function updateProjectGroupVisibility() {
        $projectGrids.each(function () {
            var $grid = $(this);

            // Check whether this category contains matching projects
            var hasVisibleProjects = $grid.find('.project-card').filter(function () {
                return !currentLang ||
                    ($(this).attr('data-languages') || '')
                        .toLowerCase()
                        .split(/\s+/)
                        .indexOf(currentLang) !== -1;
            }).length > 0;

            // Hide the heading and grid when no projects match
            $grid.prev('.project-group-title').toggle(hasVisibleProjects);
            $grid.toggle(hasVisibleProjects);
        });
    }

    /* =========================================
        FILTER PROJECT GRIDS
       ========================================= */

    function refilterGrids() {
        var fn = buildFilterFn();

        $projectGrids.each(function () {
            $(this).isotope({
                transitionDuration: 0,
                filter: fn
            });
        });

        // Update category visibility after filtering
        updateProjectGroupVisibility();

        setTimeout(function () {
            $projectGrids.each(function () {
                $(this).isotope({
                    transitionDuration: '0.3s'
                });
            });
        }, 50);
    }

    $(window).on('resize', function () {
        $projectGrids.each(function () {
            $(this).isotope('layout');
        });
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

        /* Fix duplicate carousel IDs — remap any carousel inside the modal */
        $modalBody.find('.carousel').each(function () {
            var oldId = $(this).attr('id');
            if (!oldId) return;
            var newId = oldId + '-modal';
            $(this).attr('id', newId);
            /* Update all data-target and href references inside the modal */
            $modalBody.find('[data-target="#' + oldId + '"]').attr('data-target', '#' + newId);
            $modalBody.find('[href="#' + oldId + '"]').attr('href', '#' + newId);
        });

        $modal.addClass('is-open');
        $('body').addClass('modal-open-project');

        /* Re-init carousel after ID fix */
        $modalBody.find('[data-ride="carousel"]').carousel();

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
        $projectGrids.removeClass('language-filter-active');
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
        $projectGrids.addClass('language-filter-active');
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