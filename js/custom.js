$(document).ready(function () {

    /* Auto-collapse mobile navbar after clicking a link */
    $('#mainNav .nav-link').on('click', function () {
        if ($('.navbar-toggler').is(':visible')) {
            $('#mainNav').collapse('hide');
        }
    });

    /* Hide navbar on scroll down, show on scroll up */
    let lastScrollTop = 0;
    const navbar = document.querySelector('.site-navbar');

    window.addEventListener('scroll', function () {
        const currentScroll = window.pageYOffset || document.documentElement.scrollTop;

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

    /* Projects: inline details under the selected card */
    function closeAllProjectDetails(exceptId) {
        $('[id^="projectDetails"].collapse.show').each(function () {
            if (!exceptId || this.id !== exceptId) {
                $(this).collapse('hide');
            }
        });
    }

    function updateProjectTileLabels() {
        $('.project-tile').each(function () {
            const $tile = $(this);
            const targetSel = $tile.data('target');
            const $details = $(targetSel);
            const isOpen = $details.length && $details.hasClass('show');

            $tile.attr('aria-expanded', isOpen ? 'true' : 'false');
            $tile.toggleClass('collapsed', !isOpen);
            $tile.toggleClass('is-active', isOpen);
            $tile.closest('.project-card').toggleClass('project-card-active', isOpen);
            $tile.find('.project-tile-cta').text(isOpen ? 'Hide details' : 'View details');
        });
    }

    function ensureInlineWrapper($details) {
        let $wrapper = $details.data('inlineWrapper');
        if ($wrapper && $wrapper.length) return $wrapper;

        $wrapper = $('<div class="project-inline-detail"></div>');
        $details.data('inlineWrapper', $wrapper);
        $wrapper.append($details);
        return $wrapper;
    }

    function parkDetailsBackInHost($details) {
        const $host = $('#projectsDetailsGroup');
        const $wrapper = $details.data('inlineWrapper');

        if ($wrapper && $wrapper.length) {
            $wrapper.detach();
        }

        $details.detach().appendTo($host);
    }

    function resetProjectDetailsAndHighlights() {
        closeAllProjectDetails();
        $('[id^="projectDetails"]').each(function () {
            parkDetailsBackInHost($(this));
        });
        $('.project-tile').removeClass('is-active collapsed').addClass('collapsed');
        $('.project-card').removeClass('project-card-active');
        clearLanguageProjectHighlights();
        updateProjectTileLabels();
    }

    $('[id^="projectDetails"]').each(function () {
        $(this).removeClass('show').attr('aria-expanded', 'false').appendTo($('#projectsDetailsGroup'));
    });
    $('.project-tile').addClass('collapsed').attr('aria-expanded', 'false');
    $('.project-card').removeClass('project-card-active');
    updateProjectTileLabels();

    $('.project-tile').on('click', function (e) {
        e.preventDefault();

        const $tile = $(this);
        const targetSel = $tile.data('target');
        const $details = $(targetSel);
        if (!$details.length) return;

        const detailId = $details.attr('id');
        const isOpen = $details.hasClass('show');

        closeAllProjectDetails(detailId);

        $('[id^="projectDetails"]').not($details).each(function () {
            parkDetailsBackInHost($(this));
        });

        if (isOpen) {
            $details.collapse('hide');
            parkDetailsBackInHost($details);
            return;
        }

        const $wrapper = ensureInlineWrapper($details);
        const $card = $tile.closest('.project-card');
        const $grid = $card.closest('.projects-grid');

        if ($grid.length && $card.length) {
            const clickedTop = Math.round($card[0].getBoundingClientRect().top);
            const $rowCards = $grid.children('.project-card').filter(function () {
                return Math.round(this.getBoundingClientRect().top) === clickedTop;
            });
            const $lastCardInRow = $rowCards.length ? $rowCards.last() : $card;
            $wrapper.insertAfter($lastCardInRow);
        } else {
            $wrapper.insertAfter($card);
        }

        $details.collapse('show');
    });

    $(document).on('hidden.bs.collapse', '[id^="projectDetails"]', function () {
        const $details = $(this);
        parkDetailsBackInHost($details);
        updateProjectTileLabels();
    });

    $(document).on('shown.bs.collapse', '[id^="projectDetails"]', function () {
        const $details = $(this);
        const $wrapper = $details.data('inlineWrapper');
        const detailId = $details.attr('id');
        const $activeTile = $('.project-tile[data-target="#' + detailId + '"]');
        const $activeCard = $activeTile.closest('.project-card');
        const $grid = $activeCard.closest('.projects-grid');

        if ($wrapper && $wrapper.length && $grid.length && $activeCard.length) {
            const clickedTop = Math.round($activeCard[0].getBoundingClientRect().top);
            const $rowCards = $grid.children('.project-card').filter(function () {
                return Math.round(this.getBoundingClientRect().top) === clickedTop;
            });
            const $lastCardInRow = $rowCards.length ? $rowCards.last() : $activeCard;
            $wrapper.insertAfter($lastCardInRow);
        }

        updateProjectTileLabels();

        if ($wrapper && $wrapper.length) {
            $('html, body').animate({
                scrollTop: $wrapper.offset().top - 110
            }, 350);
        }
    });

    /* Language pills -> scroll to projects and highlight matching cards */
    function clearLanguageProjectHighlights() {
        $('.project-grid').removeClass('language-filter-active');
        $('.project-card').removeClass('language-match');
        $('.skill-filter').removeClass('is-active').attr('aria-pressed', 'false');
    }

    $('.skill-filter').attr('aria-pressed', 'false');

    $('.skill-filter').on('click', function () {
        const $pill = $(this);
        const language = String($pill.data('language') || '').toLowerCase().trim();
        const $grid = $('.project-grid');
        const $cards = $('.project-card');

        if (!language || !$grid.length || !$cards.length) return;

        const alreadyActive = $pill.hasClass('is-active');

        clearLanguageProjectHighlights();

        if (alreadyActive) {
            $('html, body').animate({
                scrollTop: $('#projects-section').offset().top - 110
            }, 450);
            return;
        }

        const $matches = $cards.filter(function () {
            const langs = String($(this).attr('data-languages') || '').toLowerCase().split(/\s+/);
            return langs.includes(language);
        });

        $pill.addClass('is-active').attr('aria-pressed', 'true');
        $grid.addClass('language-filter-active');
        $matches.addClass('language-match');

        $('html, body').animate({
            scrollTop: $('#projects-section').offset().top - 110
        }, 450);
    });

    /* Reset language highlighting when a project tile is clicked */
    $('.project-tile').on('click', function () {
        clearLanguageProjectHighlights();
    });

    /* Coursework toggle button text */
    $('#usdCourses').on('show.bs.collapse', function () {
        $('.education-toggle[data-target="#usdCourses"]').text('Hide Coursework');
    });

    $('#usdCourses').on('hide.bs.collapse', function () {
        $('.education-toggle[data-target="#usdCourses"]').text('View Coursework');
    });

    /* Close open project details / clear language filters when clicking outside relevant UI */
    $(document).on('click', function (e) {
        const $target = $(e.target);

        const clickedInsideTile = $target.closest('.project-tile').length > 0;
        const clickedInsideOpenDetail = $target.closest('.project-detail-card').length > 0;
        const clickedInsideSkillFilter = $target.closest('.skill-filter').length > 0;
        const clickedNavbar = $target.closest('.site-navbar').length > 0;

        const hasOpenDetails = $('[id^="projectDetails"].collapse.show').length > 0;
        const hasActiveFilter = $('.skill-filter.is-active').length > 0;

        if (clickedInsideTile || clickedInsideOpenDetail || clickedInsideSkillFilter || clickedNavbar) {
            return;
        }

        if (hasOpenDetails || hasActiveFilter) {
            resetProjectDetailsAndHighlights();
        }
    });

    /* Escape clears open project details and active language filters */
    $(document).on('keydown', function (e) {
        if (e.key === 'Escape') {
            const hasOpenDetails = $('[id^="projectDetails"].collapse.show').length > 0;
            const hasActiveFilter = $('.skill-filter.is-active').length > 0;

            if (hasOpenDetails || hasActiveFilter) {
                resetProjectDetailsAndHighlights();
            }
        }
    });

});
