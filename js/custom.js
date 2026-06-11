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
            var $card = $(this);

            if ($card.attr('data-detail-wrapper') === 'true') {
                return true;
            }

            if (lang) {
                var langs = ($card.attr('data-languages') || '').toLowerCase().split(/\s+/);
                return langs.indexOf(lang) !== -1;
            }

            return true;
        };
    }

    function refilterGrids() {
        var fn = buildFilterFn();
        $deployedGrid.isotope('reloadItems').isotope({ transitionDuration: 0, filter: fn });
        $academicGrid.isotope('reloadItems').isotope({ transitionDuration: 0, filter: fn });
        setTimeout(function () {
            $deployedGrid.isotope({ transitionDuration: '0.3s' });
            $academicGrid.isotope({ transitionDuration: '0.3s' });
        }, 50);
    }

    /* Convert hidden class to data attribute and keep all cards display:block */
    $('.project-card--hidden')
        .removeClass('project-card--hidden')
        .css('display', 'block');

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

    /* Relayout Isotope on window resize (breakpoints change item widths) */
    $(window).on('resize', function () {
        $deployedGrid.isotope('layout');
        $academicGrid.isotope('layout');
    });

    /* ============================
    PROJECT DETAIL EXPANSION
    ============================ */

    function closeAllProjectDetails(exceptId) {
        $('[id^="projectDetails"].collapse.show').each(function () {
            if (!exceptId || this.id !== exceptId) {
                $(this).collapse('hide');
            }
        });
    }

    function updateProjectTileLabels() {
        $('.project-tile').each(function () {
            var $tile = $(this);
            var targetSel = $tile.data('target');
            var $details = $(targetSel);
            var isOpen = $details.length && $details.hasClass('show');
            $tile.attr('aria-expanded', isOpen ? 'true' : 'false');
            $tile.toggleClass('collapsed', !isOpen);
            $tile.toggleClass('is-active', isOpen);
            $tile.closest('.project-card').toggleClass('project-card-active', isOpen);
            $tile.find('.project-tile-cta').text(isOpen ? 'Hide details' : 'View details');
        });
    }

    function ensureInlineWrapper($details) {
        var $wrapper = $details.data('inlineWrapper');
        if (!$wrapper || !$wrapper.length) {
            $wrapper = $('<div class="project-card project-detail-inline-card" data-detail-wrapper="true"></div>'); $details.data('inlineWrapper', $wrapper);
        }
        if (!$details.parent().is($wrapper)) {
            $details.detach().appendTo($wrapper);
        }
        return $wrapper;
    }

    function parkDetailsBackInHost($details) {
        var $host = $('#projectsDetailsGroup');
        var $wrapper = $details.data('inlineWrapper');
        if ($wrapper && $wrapper.length) {
            $wrapper.detach();
        }
        $details.detach().appendTo($host);
    }

    function placeDetailsBelowSelectedRow($grid, $card, $wrapper) {
        var columns = 1;
        if (window.innerWidth >= 992) {
            columns = 3;
        } else if (window.innerWidth >= 576) {
            columns = 2;
        }

        var $cards = $grid.children('.project-card').not('[data-detail-wrapper="true"]:hidden');
        var index = $cards.index($card);
        var rowEndIndex = Math.min(index + (columns - 1 - (index % columns)), $cards.length - 1);
        var $rowEndCard = $cards.eq(rowEndIndex);

        if ($rowEndCard.length) {
            $wrapper.insertAfter($rowEndCard);
        } else {
            $wrapper.appendTo($grid);
        }
    }

    function resetProjectDetailsAndHighlights() {
        closeAllProjectDetails();
        setTimeout(function () {
            $('[id^="projectDetails"]').each(function () {
                parkDetailsBackInHost($(this));
            });
            $('.project-tile').removeClass('is-active').addClass('collapsed');
            $('.project-card').removeClass('project-card-active');
            updateProjectTileLabels();
            if (!currentLang) {
                clearLanguageProjectHighlights();
            }
        }, 420);
    }

    $('[id^="projectDetails"]').each(function () {
        $(this).removeClass('show').attr('aria-expanded', 'false').appendTo($('#projectsDetailsGroup'));
    });
    $('.project-tile').addClass('collapsed').attr('aria-expanded', 'false');
    $('.project-card').removeClass('project-card-active');
    updateProjectTileLabels();

    $('.project-tile').on('click', function (e) {
        e.preventDefault();
        var $tile = $(this);
        var targetSel = $tile.data('target');
        var $details = $(targetSel);
        if (!$details.length) return;

        var detailId = $details.attr('id');
        var isOpen = $details.hasClass('show');

        closeAllProjectDetails(detailId);
        $('[id^="projectDetails"]').not($details).each(function () {
            parkDetailsBackInHost($(this));
        });

        if (isOpen) {
            $details.collapse('hide');
            return;
        }

        var $wrapper = ensureInlineWrapper($details);
        var $card = $tile.closest('.project-card');
        var $grid = $card.closest('.projects-grid');

        placeDetailsBelowSelectedRow($grid, $card, $wrapper);
        $details.collapse('show');
        $grid.isotope('reloadItems').isotope({ filter: buildFilterFn() });
    });

    $(document).on('hidden.bs.collapse', '[id^="projectDetails"]', function () {
        var $details = $(this);
        var $grid = $details.closest('.projects-grid');
        parkDetailsBackInHost($details);
        updateProjectTileLabels();
        if ($grid.length) {
            $grid.isotope('reloadItems').isotope({ filter: buildFilterFn() });
        } else {
            $deployedGrid.isotope('reloadItems').isotope({ filter: buildFilterFn() });
            $academicGrid.isotope('reloadItems').isotope({ filter: buildFilterFn() });
        }
    });

    $(document).on('shown.bs.collapse', '[id^="projectDetails"]', function () {
        var $wrapper = $(this).data('inlineWrapper');
        updateProjectTileLabels();
        if ($wrapper && $wrapper.length) {
            $('html, body').animate({ scrollTop: $wrapper.offset().top - 110 }, 350);
        }
    });

    /* ============================
        LANGUAGE FILTER (with Isotope)
       ============================ */

    function clearLanguageProjectHighlights(skipHide) {
        currentLang = '';
        $('.project-grid').removeClass('language-filter-active');
        $('.project-card').removeClass('language-match');
        $('.skill-filter').removeClass('is-active').attr('aria-pressed', 'false');
        if (!skipHide) {
            refilterGrids();
        }
    }

    $(document).on('click', '.project-filter-clear', function () {
        closeAllProjectDetails();
        $('[id^="projectDetails"]').each(function () {
            parkDetailsBackInHost($(this));
        });
        updateProjectTileLabels();
        clearLanguageProjectHighlights();
        $('html, body').animate({ scrollTop: $('#projects-section').offset().top - 110 }, 450);
    });

    $('.skill-filter').on('click', function () {
        var $pill = $(this);
        var language = String($pill.data('language') || '').toLowerCase().trim();
        if (!language) return;

        closeAllProjectDetails();
        $('[id^="projectDetails"]').each(function () {
            parkDetailsBackInHost($(this));
        });
        updateProjectTileLabels();

        var alreadyActive = $pill.hasClass('is-active');
        var wasFiltering = !!currentLang;
        clearLanguageProjectHighlights(wasFiltering);

        if (alreadyActive) {
            refilterGrids();
            $('html, body').animate({ scrollTop: $('#projects-section').offset().top - 110 }, 450);
            return;
        }

        currentLang = language;
        var $matches = $('.project-card').filter(function () {
            var langs = String($(this).attr('data-languages') || '').toLowerCase().split(/\s+/);
            return langs.indexOf(language) !== -1;
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
    });
    $('#usdCourses').on('hide.bs.collapse', function () {
        $('.education-toggle[data-target="#usdCourses"]').text('View Coursework');
    });

    /* Close open details / clear filters when clicking outside */
    $(document).on('click', function (e) {
        var $target = $(e.target);
        if (
            $target.closest('.project-tile').length ||
            $target.closest('.project-detail-card').length ||
            $target.closest('.skill-filter').length ||
            $target.closest('.project-filter-clear').length ||
            $target.closest('.site-navbar').length ||
            $target.closest('.mfp-container, .mfp-content').length
        ) return;

        var hasOpenDetails = $('[id^="projectDetails"].collapse.show').length > 0;
        var hasActiveFilter = $('.skill-filter.is-active').length > 0;
        if (hasOpenDetails || hasActiveFilter) {
            resetProjectDetailsAndHighlights();
        }
    });

    $(document).on('keydown', function (e) {
        if (e.key === 'Escape') {
            var hasOpenDetails = $('[id^="projectDetails"].collapse.show').length > 0;
            var hasActiveFilter = $('.skill-filter.is-active').length > 0;
            if (hasOpenDetails || hasActiveFilter) {
                resetProjectDetailsAndHighlights();
            }
        }
    });

    /* ============================
        RETURN TO TOP
       ============================ */

    var scrollTopBtn = document.getElementById('scrollTopBtn');
    var aboutSection = document.getElementById('about-section');

    if (scrollTopBtn && aboutSection) {
        window.addEventListener('scroll', function () {
            var aboutBottom = aboutSection.offsetTop + aboutSection.offsetHeight;
            scrollTopBtn.classList.toggle('visible', window.scrollY > aboutBottom);
        });
        scrollTopBtn.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    /* ============================
        MAGNIFIC POPUP
       ============================ */

    $('.fitness-gallery').magnificPopup({
        type: 'image',
        gallery: {
            enabled: true,
            navigateByImgClick: true,
            preload: [0, 1]
        },
        image: {
            titleSrc: function (item) {
                return item.el.data('caption') || '';
            }
        },
        removalDelay: 300,
        mainClass: 'mfp-fade'
    });

    $('.uml-popup').magnificPopup({
        type: 'image',
        image: {
            titleSrc: function () {
                return 'UML class diagram — Elevator Simulation System';
            }
        },
        removalDelay: 300,
        mainClass: 'mfp-fade'
    });

});