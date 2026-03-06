
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

    /* Projects: keep same-row tiles in place; details insert after last tile in row */
    const $detailsHost = $('#projectsDetailsGroup');

    function closeAllProjectDetails(exceptId) {
        $('[id^="projectDetails"].collapse.show').each(function () {
            if (!exceptId || this.id !== exceptId) {
                $(this).collapse('hide');
            }
        });
    }

    // Create/reuse a wrapper so we can remove it later (prevents "empty gap" cols)
    function ensureDetailsWrapper($details) {
        let $wrapper = $details.data('detailsWrapper');
        if ($wrapper && $wrapper.length) return $wrapper;

        $wrapper = $('<div class="col-12 project-details-col"></div>');
        $details.data('detailsWrapper', $wrapper);
        $wrapper.append($details);
        return $wrapper;
    }

    // When parking details back in the hidden host, remove the wrapper too
    function parkDetailsInHost($details) {
        const $wrapper = $details.data('detailsWrapper');

        // Remove wrapper from grid if it exists
        if ($wrapper && $wrapper.length) {
            $wrapper.detach();
        }

        // Put the details back into the shared host
        $details.detach().appendTo($detailsHost);

        // Cleanup wrapper so it doesn't leave a blank col behind
        if ($wrapper && $wrapper.length) {
            $wrapper.remove();
            $details.removeData('detailsWrapper');
        }
    }

    // Start closed (prevents one being open on load)
    $('[id^="projectDetails"]').removeClass('show').attr('aria-expanded', 'false');
    $('.project-tile').addClass('collapsed').attr('aria-expanded', 'false');

    $('.project-tile').on('click', function (e) {
        e.preventDefault();

        const $tile = $(this);
        const targetSel = $tile.data('target');
        const $details = $(targetSel);
        if (!$details.length) return;

        const detailId = $details.attr('id');
        const isOpen = $details.hasClass('show');

        // Close any other open detail
        closeAllProjectDetails(detailId);

        // Clear active state from all tiles
        $('.project-tile').removeClass('is-active');

        if (isOpen) {
            $details.collapse('hide');
            return;
        }

        // Mark clicked as active
        $tile.addClass('is-active');

        // Insert details AFTER the last tile in the clicked visual row
        const $grid = $tile.closest('.project-grid');
        const $col = $tile.closest('.col-md-6, .col-lg-4');

        const $wrapper = ensureDetailsWrapper($details.detach()); // wrapper now owns details

        if ($grid.length && $col.length) {
            const clickedTop = $col[0].getBoundingClientRect().top;

            const $sameRowCols = $grid.children('div').filter(function () {
                if (!this.className || this.className.indexOf('col-') === -1) return false;
                return Math.abs(this.getBoundingClientRect().top - clickedTop) < 2;
            });

            const $lastColInRow = $sameRowCols.length ? $sameRowCols.last() : $col;
            $wrapper.insertAfter($lastColInRow);
        } else {
            $wrapper.insertAfter($tile);
        }

        $details.collapse('show');
    });

    $(document).on('hidden.bs.collapse', '[id^="projectDetails"]', function () {
        const $details = $(this);

        if ($('[id^="projectDetails"].collapse.show').length === 0) {
            $('.project-tile').removeClass('is-active');
        }

        parkDetailsInHost($details);
    });

    // On resize, park any hidden details back in host (and remove wrappers)
    $(window).on('resize', function () {
        $('[id^="projectDetails"]').each(function () {
            const $d = $(this);
            if (!$d.hasClass('show')) {
                parkDetailsInHost($d);
            }
        });
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
});
