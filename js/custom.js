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
            if ($el.hasClass('project-detail-row')) return true;
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
        itemSelector: '.project-card, .project-detail-row',
        layoutMode: 'fitRows',
        percentPosition: true,
        filter: buildFilterFn()
    });

    var $academicGrid = $('#academic-grid').isotope({
        itemSelector: '.project-card, .project-detail-row',
        layoutMode: 'fitRows',
        percentPosition: true,
        filter: buildFilterFn()
    });

    $(window).on('resize', function () {
        $deployedGrid.isotope('layout');
        $academicGrid.isotope('layout');
    });

    /* ============================
       PROJECT DETAIL EXPANSION
       ============================ */

    function getIsoFor($card) {
        var id = $card.closest('.projects-grid').attr('id');
        if (id === 'deployed-grid') return $deployedGrid;
        if (id === 'academic-grid') return $academicGrid;
        return null;
    }

    function getDetailRow($details) {
        var $row = $details.data('detailRow');
        if (!$row || !$row.length) {
            $row = $('<div class="project-detail-row"></div>');
            $details.data('detailRow', $row);
            $details.detach().appendTo($row);
        } else if (!$details.parent().is($row)) {
            $details.detach().appendTo($row);
        }
        return $row;
    }

    function parkDetails($details) {
        var $row = $details.data('detailRow');
        if ($row && $row.length) $row.detach();
        $details.detach().appendTo($('#projectsDetailsGroup'));
    }

    function placeDetailRow($iso, $card, $row) {
        var cols = (window.innerWidth < 576) ? 1 : (window.innerWidth < 992) ? 2 : 3;
        var filtered = $iso.isotope('getFilteredItemElements').filter(function () {
            return !$(this).hasClass('project-detail-row');
        });
        var $cards = $(filtered);
        var idx = $cards.index($card);
        if (idx === -1) idx = 0;
        var rowEnd = Math.min(Math.floor(idx / cols) * cols + cols - 1, $cards.length - 1);
        $row.insertAfter($cards.eq(rowEnd));
    }

    function closeAllDetails(exceptId) {
        $('[id^="projectDetails"].show').each(function () {
            if (!exceptId || this.id !== exceptId) {
                $(this).collapse('hide');
            }
        });
    }

    function updateTileLabels() {
        $('.project-tile').each(function () {
            var $t = $(this);
            var $d = $($t.data('target'));
            var open = $d.length && $d.hasClass('show');
            $t.attr('aria-expanded', open ? 'true' : 'false')
              .toggleClass('collapsed', !open)
              .toggleClass('is-active', open)
              .find('.project-tile-cta').text(open ? 'Hide details' : 'View details');
            $t.closest('.project-card').toggleClass('project-card-active', open);
        });
    }

    function resetAll() {
        closeAllDetails();
        setTimeout(function () {
            $('[id^="projectDetails"]').each(function () { parkDetails($(this)); });
            $deployedGrid.isotope('reloadItems').isotope({ filter: buildFilterFn() });
            $academicGrid.isotope('reloadItems').isotope({ filter: buildFilterFn() });
            $('.project-tile').removeClass('is-active').addClass('collapsed');
            $('.project-card').removeClass('project-card-active');
            updateTileLabels();
            if (!currentLang) clearLangFilter();
        }, 420);
    }

    /* Park all details on init */
    $('[id^="projectDetails"]').each(function () {
        $(this).removeClass('show').appendTo($('#projectsDetailsGroup'));
    });
    $('.project-tile').addClass('collapsed').attr('aria-expanded', 'false');
    updateTileLabels();

    /* ============================
       TILE CLICK — fully manual, no Bootstrap data-toggle
       ============================ */

    $('.project-tile').on('click', function (e) {
        e.preventDefault();
        e.stopPropagation();

        var $tile = $(this);
        var $details = $($tile.data('target'));
        if (!$details.length) return;

        var detailId = $details.attr('id');
        var isOpen = $details.hasClass('show');
        var $card = $tile.closest('.project-card');
        var $iso = getIsoFor($card);

        /* Close + park any other open detail */
        closeAllDetails(detailId);
        $('[id^="projectDetails"]').not($details).each(function () { parkDetails($(this)); });
        if ($iso) {
            $iso.isotope('reloadItems').isotope({ transitionDuration: 0, filter: buildFilterFn() });
        }

        if (isOpen) {
            $details.collapse('hide');
            return;
        }

        /* Insert detail row into the grid at the right position */
        var $row = getDetailRow($details);
        placeDetailRow($iso || $deployedGrid, $card, $row);

        /* Register with Isotope then show */
        if ($iso) {
            $iso.isotope('insert', $row);
            $iso.isotope({ transitionDuration: 0, filter: buildFilterFn() });
        }

        $details.collapse('show');
    });

    /* Sync labels on Bootstrap collapse events */
    $(document).on('hidden.bs.collapse', '[id^="projectDetails"]', function () {
        var $d = $(this);
        var $row = $d.data('detailRow');
        var $gridEl = $row ? $row.closest('.projects-grid') : null;
        parkDetails($d);
        if ($gridEl && $gridEl.length) {
            var $iso = getIsoFor($gridEl.find('.project-card').first());
            if ($iso) $iso.isotope('reloadItems').isotope({ transitionDuration: 0, filter: buildFilterFn() });
        } else {
            $deployedGrid.isotope('reloadItems').isotope({ transitionDuration: 0, filter: buildFilterFn() });
            $academicGrid.isotope('reloadItems').isotope({ transitionDuration: 0, filter: buildFilterFn() });
        }
        updateTileLabels();
    });

    $(document).on('shown.bs.collapse', '[id^="projectDetails"]', function () {
        updateTileLabels();
        var $row = $(this).data('detailRow');
        if ($row && $row.length) {
            setTimeout(function () {
                $('html, body').animate({ scrollTop: $row.offset().top - 110 }, 350);
            }, 50);
        }
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
        closeAllDetails();
        $('[id^="projectDetails"]').each(function () { parkDetails($(this)); });
        $deployedGrid.isotope('reloadItems').isotope({ transitionDuration: 0, filter: buildFilterFn() });
        $academicGrid.isotope('reloadItems').isotope({ transitionDuration: 0, filter: buildFilterFn() });
        updateTileLabels();
        clearLangFilter();
        $('html, body').animate({ scrollTop: $('#projects-section').offset().top - 110 }, 450);
    });

    $('.skill-filter').attr('aria-pressed', 'false').on('click', function () {
        var $pill = $(this);
        var lang = String($pill.data('language') || '').toLowerCase().trim();
        if (!lang) return;

        closeAllDetails();
        $('[id^="projectDetails"]').each(function () { parkDetails($(this)); });
        $deployedGrid.isotope('reloadItems').isotope({ transitionDuration: 0, filter: buildFilterFn() });
        $academicGrid.isotope('reloadItems').isotope({ transitionDuration: 0, filter: buildFilterFn() });
        updateTileLabels();

        var wasActive = $pill.hasClass('is-active');
        clearLangFilter(!!currentLang);

        if (wasActive) {
            refilterGrids();
            $('html, body').animate({ scrollTop: $('#projects-section').offset().top - 110 }, 450);
            return;
        }

        currentLang = lang;
        var $matches = $('.project-card').filter(function () {
            return $(this).attr('data-languages')
                && $(this).attr('data-languages').toLowerCase().split(/\s+/).indexOf(lang) !== -1;
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
       CLICK OUTSIDE / ESCAPE
       ============================ */

    $(document).on('click', function (e) {
        var $t = $(e.target);
        if ($t.closest('.project-tile, .project-detail-card, .project-detail-row, .skill-filter, .project-filter-clear, .site-navbar, .mfp-container, .mfp-content').length) return;
        if ($('[id^="projectDetails"].show').length || $('.skill-filter.is-active').length) resetAll();
    });

    $(document).on('keydown', function (e) {
        if (e.key === 'Escape' && ($('[id^="projectDetails"].show').length || $('.skill-filter.is-active').length)) resetAll();
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

    /* ============================
       MAGNIFIC POPUP
       ============================ */

    $('.fitness-gallery').magnificPopup({
        type: 'image',
        gallery: { enabled: true, navigateByImgClick: true, preload: [0, 1] },
        image: { titleSrc: function (item) { return item.el.data('caption') || ''; } },
        removalDelay: 300,
        mainClass: 'mfp-fade'
    });

    $('.uml-popup').magnificPopup({
        type: 'image',
        image: { titleSrc: function () { return 'UML class diagram — Elevator Simulation System'; } },
        removalDelay: 300,
        mainClass: 'mfp-fade'
    });

});