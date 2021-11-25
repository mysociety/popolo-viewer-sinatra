(function ($) {

  $.fn.fixedThead = function() {

    // Call this on a <thead> element and it'll stay attached
    // to the top of the window when you scroll down.

    var calculateCloneDimensions = function calculateCloneDimensions($originalThead, $cloneThead){
      $cloneThead.css({
        width: $originalThead.outerWidth()
      });

      $('tr', $originalThead).each(function(tr_index, tr){
        $('th', tr).each(function(th_index, th){
          $cloneThead.find('tr:eq(' + tr_index + ') th:eq(' + th_index + ')').css({
            width: $(th).outerWidth()
          });
        });
      });
    }

    var deduplicateIDs = function deduplicateIDs($cloneThead){
      // Tweak the `id` attribute of any elements inside the cloned
      // thead, to avoid naming clashes with the original elements.
      // Also tweak any labels inside the thead to refer to the
      // cloned copies of whatever they pointed to originally.
      $cloneThead.find('[id]').each(function(){
        var oldID = $(this).attr('id');
        var newID = oldID + '__clone';
        $(this).attr('id', newID);
        $cloneThead.find('[for="' + oldID + '"]').each(function(){
          $(this).attr('for', newID);
        });
      });
    }

    var showOrHideClone = function showOrHideClone($table, $cloneThead){
      var bounds = $table[0].getBoundingClientRect();

      // First we detect whether *any* of the table is visible,
      // then, if it is, we position the fixed thead so that it
      // never extends outside of the table bounds even when the
      // visible portion of the table is shorter than the thead.

      if(bounds.top <= 0 && bounds.bottom >= 0){
        $cloneThead.show();

        var rowHeight = $cloneThead.outerHeight();
        if(bounds.bottom < rowHeight){
          $cloneThead.css({
            top: (rowHeight - bounds.bottom) * -1
          });
        } else {
          $cloneThead.css({
            top: 0
          });
        }

      } else {
        $cloneThead.hide();
      }
    }

    return this.each(function() {
      var $originalThead = $(this);
      var $table = $originalThead.parent('table');
      var $cloneThead = $originalThead.clone().removeClass('js-fixed-thead').addClass('js-fixed-thead__clone');

      $cloneThead.insertAfter($originalThead);
      $cloneThead.hide();

      calculateCloneDimensions($originalThead, $cloneThead);
      deduplicateIDs($cloneThead);
      showOrHideClone($table, $cloneThead);

      $(window).resize(function(){
        calculateCloneDimensions($originalThead, $cloneThead);
        showOrHideClone($table, $cloneThead);
      });

      $(window).scroll(function(){
        showOrHideClone($table, $cloneThead);
      });
    });

  };

  $.fn.sortable = function() {

    // Call this on a <table> and it'll make all the columns sortable.

    // Columns will be sorted based on the .text() content of each cell.
    // If you give a cell a data-sortable-sortvalue attribute, that will be
    // used in place of the .text() content.

    // Rowspans will be un-spanned on the first sorting operation, and will
    // *not* be re-spanned, even if the original sort order is restored.

    // If the table is already pre-sorted on a particular column, give that
    // column's <th> element an attribute of data-sortable-presorted with a
    // value of either "a-z" or "z-a". This will stop $.sortable from
    // attempting to unsort the column on the third header click.

    // Tables can only be sorted on one column at a time.

    var sortTable = function sortTable($table, columnIndex){
      // Find the rows to sort, and their parent
      var $tbody = $table.children('tbody');
      if($tbody.length == 0){ $tbody = $table; }
      var $trs = $tbody.children('tr');

      if(!$table.data('unrowspanned')){
        undoRowspans($table, $trs);
      }

      // Sort the right way, based on the state stored in $table.data
      var currentSortOrder = $table.data('sortOrder');
      if(columnIndex == $table.data('sortedOnColumnIndex')){
        // Already sorting on this column, so either reverse the direction,
        // or unsort the column, depending on the current state.

        if(currentSortOrder == 'a-z'){
          sortRows($tbody, $trs, columnIndex, 'z-a');
          showSortOrder($table, columnIndex, 'z-a');
          $table.data('sortOrder', 'z-a');

        } else if(currentSortOrder == 'z-a'){
          // If this was a presorted column, we flip back to a-z sorting.
          // If it was a normal column, we can simply unsort it instead.

          if(columnIndex == $table.data('presortedOnColumnIndex')){
            sortRows($tbody, $trs, columnIndex, 'a-z');
            showSortOrder($table, columnIndex, 'a-z');
            $table.data('sortOrder', 'a-z');

          } else {
            restoreOriginalSortOrder($tbody, $trs);
            showSortOrder($table);
            $table.removeData('sortOrder');
            $table.removeData('sortedOnColumnIndex');
          }
        }

      } else {
        sortRows($tbody, $trs, columnIndex, 'a-z');
        showSortOrder($table, columnIndex, 'a-z');
        $table.data('sortOrder', 'a-z');
        $table.data('sortedOnColumnIndex', columnIndex);
      }
    }

    var undoRowspans = function undoRowspans($table, $trs){
      // Loop through each row, finding rowspanned cells
      $trs.each(function(row_index){
        var $tr = $(this);
        $tr.children('td[rowspan]').each(function(){
          var $td = $(this);
          var span = parseInt($td.attr('rowspan'));
          var col_index = $td.prevAll().length;
          if(span > 1){
            // Found one! Unrowspan it, and insert clones of the cell
            // in the same position on subsequent rows.
            $td.removeAttr('rowspan');
            $tr.nextAll().slice(0, span - 1).each(function(){
              var $newTr = $(this);
              var $clone = $td.clone(); // creates a new clone for each row
              $clone.insertBefore($newTr.children('td').eq(col_index));
            });
          }
        })
      });
      $table.data('unrowspanned', true);
    }

    var getSortValue = function($element){
      // Table cells can specify a custom value by which
      // they will be sorted (useful for names and dates).
      return $element.attr('data-sortable-sortvalue') || $element.text();
    }

    var sortRows = function sortRows($tbody, $trs, columnIndex, sortOrder){
      $trs.detach().sort(function(rowA, rowB){
        var valueA = getSortValue( $(rowA).children('td').eq(columnIndex) );
        var valueB = getSortValue( $(rowB).children('td').eq(columnIndex) );

        var moveUp = 1;
        var moveDown = -1;
        if(sortOrder == 'z-a'){
          var moveUp = -1;
          var moveDown = 1;
        }

        if(valueA > valueB) {
          return moveUp;
        } else if(valueA < valueB){
          return moveDown;
        } else {
          return 0;
        }
      }).appendTo($tbody);
    }

    var restoreOriginalSortOrder = function restoreOriginalSortOrder($tbody, $trs){
      $trs.detach().sort(function(rowA, rowB){
        var valueA = $(rowA).data('originalSortIndex');
        var valueB = $(rowB).data('originalSortIndex');

        if(valueA > valueB) {
          return 1;
        } else if(valueA < valueB){
          return -1;
        } else {
          return 0;
        }
      }).appendTo($tbody);
    }

    var showSortOrder = function showSortOrder($table, columnIndex, sortOrder){
      $table.find('th').removeClass('sortedUp sortedDown');

      if(typeof columnIndex !== 'undefined'){
        // For compatibility with $.fixedThead() we
        // can't assume there is only row of thead cells.
        var $ths = $table.find('th:nth-child(' + (columnIndex+1) + ')');

        if(sortOrder == 'a-z'){
          $ths.addClass('sortedDown');
        } else if(sortOrder == 'z-a'){
          $ths.addClass('sortedUp');
        }
      }
    }

    var saveOriginalSortOrder = function saveOriginalSortOrder($table){
      $table.find('tr').each(function(i){
        $(this).data('originalSortIndex', i);
      });
    }

    var detectPresortedTable = function detectPresortedTable($table){
      var $presortedHeader = $table.find('th[data-sortable-presorted]');
      var presortOrder = $presortedHeader.attr('data-sortable-presorted');
      var columnIndex = $presortedHeader.prevAll().length;
      $table.data('sortedOnColumnIndex', columnIndex);
      $table.data('presortedOnColumnIndex', columnIndex);
      if(presortOrder == 'a-z'){
        $presortedHeader.addClass('sortedDown');
        $table.data('sortOrder', 'a-z');
        $table.data('presortOrder', 'a-z');
      } else if(presortOrder == 'z-a'){
        $presortedHeader.addClass('sortedUp');
        $table.data('sortOrder', 'z-a');
        $table.data('presortOrder', 'z-a');
      }
    }

    return this.each(function() {
      var $table = $(this);

      saveOriginalSortOrder($table);
      detectPresortedTable($table);

      $table.on('click', 'thead th:not([data-sortable-unsortable])', function(){
        var eq = $(this).prevAll().length;
        sortTable($table, eq);
      });
    });

  };

  $.fn.fixedChild = function() {

    // Call this on an element and it'll stay attached
    // to the top of the window when you scroll down.

    var calculateSpacerDimensions = function calculateSpacerDimensions($el, $spacer){
      $spacer.css({
        width: '100%',
        height: $el.outerHeight(true)
      });
    }

    var updateChildPosition = function updateChildPosition($parent, $child, $spacer){
      // Is this $child being (temporarily) absolutely positioned?
      // (eg: to avoid the iOS8 scroll to fixed focussed element bug)
      if($child.is('.js-fixed-child--absolute')){
        return updateChildPositionAbsolute($parent, $child, $spacer);
      }

      // First we detect whether the top of the $parent is above the
      // viewport, then, if it is, we position the $child element so
      // that it never extends outside of the $parent bounds even when
      // the visible portion of the $parent is shorter than the $child.
      var bounds = $parent[0].getBoundingClientRect();

      if(bounds.top <= 0 && bounds.bottom >= 0){
        // $parent is in view. Fix the $child.
        $spacer.show();
        $child.addClass('js-fixed-child--fixed').css({
          width: $spacer.outerWidth()
        });

        var childHeight = $child.outerHeight(true);
        if(bounds.bottom < childHeight){
          // Visible portion of the $parent is shorter than the
          // total height of the $child. So position the $child
          // slightly off screen, to appear "inside" the $parent.
          $child.css({
            top: (childHeight - bounds.bottom) * -1
          });
        } else {
          // Visible portion of the $parent is taller than the
          // $child, so just position it at the top of the viewport.
          $child.css({
            top: 0
          });
        }

      } else {
        // $parent is not in view. Unfix the child.
        $spacer.hide();
        $child.removeClass('js-fixed-child--fixed').css({
          width: ''
        });
      }
    }

    var updateChildPositionAbsolute = function updateChildPositionAbsolute($parent, $child, $spacer){
      // Even though $child is positioned absolutely (relative to $parent)
      // we still need to detect whether the top of the $parent is above
      // the viewport.
      var bounds = $parent[0].getBoundingClientRect();

      if(bounds.top <= 0 && bounds.bottom >= 0){
        // $parent is in view. Position the $child.
        $spacer.show();
        $child.addClass('js-fixed-child--absolute').css({
          width: $spacer.outerWidth()
        });

        var childHeight = $child.outerHeight(true);
        // Child position from top edge of parent should be either
        // the full height of the hidden portion of the $parent, or
        // the height of the $parent minus the height of the $child,
        // whichever is smaller. (This ensures the $child always
        // appears to be *inside* the parent.)
        $child.css({
          top: Math.min(bounds.top * -1, bounds.height - childHeight)
        });

      } else {
        // $parent is not in view. Unposition and unfix the child.
        $spacer.hide();
        $child.removeClass('js-fixed-child--fixed js-fixed-child--absolute').css({
          width: ''
        });
      }
    }

    return this.each(function() {
      var $el = $(this);
      var $parent = $el.parent('.js-fixed-parent');
      var $spacer = $('<div>').addClass('js-fixed-spacer');

      $spacer.insertAfter($el);
      $spacer.hide();

      calculateSpacerDimensions($el, $spacer);
      updateChildPosition($parent, $el, $spacer);

      $(window).resize(function(){
        calculateSpacerDimensions($el, $spacer);
        updateChildPosition($parent, $el, $spacer);
      });

      $(window).scroll(function(){
        updateChildPosition($parent, $el, $spacer);
      });

      // Temporarily set the fixed child to be absolutely positioned,
      // to avoid the iOS8/9 bug where Safari attempts to scroll up to
      // a focussed input even when it's (fixed) positioned relative
      // to the viewport.
      //
      // We have to bind to touchstart, rather than focus, because by
      // the time the focus event fires, Safari has already scrolled up.
      //
      // We could user-agent sniff this, to avoid performing the fix on
      // devices that don't require it, but touchstart already excludes
      // most desktop users, and even if people see it, there aren't any
      // negative effects, aside from slightly janky scrolling.
      $el.on('touchstart', function(e){
        $el.addClass('js-fixed-child--absolute');
        updateChildPosition($parent, $el, $spacer);

        var undoPositioning = function undoPositioning(){
          $el.removeClass('js-fixed-child--absolute');
          updateChildPosition($parent, $el, $spacer);
        }

        // Undo the temporary position once the input has lost focus.
        //
        // `blur` event does not propagate, but jQuery polyfills with a
        // `focusout` event that *does*, so we use that instead.
        $el.one('focusout', undoPositioning);

        // It's possible the touchstart was not part of a focus event.
        // So we wait a little bit, then check for a focussed input,
        // and if none is found, we undo the positioning.
        // If we didn't do this, the element would remain absolutely
        // positioned until the next `blur` event, which might never come!
        setTimeout(function(){
          if($el.find('input:focus, textarea:focus, select:focus').length === 0){
            undoPositioning();
          }
        }, 500);
      });
    });

  };

}(jQuery));

$(function(){
  $('.js-fixed-thead').fixedThead();

  $('.js-sortable').sortable();

  $('.js-fixed-child').fixedChild();

  $('.js-navigation-menu').on('change', function(event){
    var that = this;
    event.preventDefault();
    analytics.trackEvent({
      eventCategory: $(this).attr('data-ga-track-change'),
      eventAction: event.type
    })
    .done(function(){
      var link = $(that).val();
      if (link) window.location.href = link;
    })
  })

  $('html').removeClass('no-js');

  $('<a>').addClass('site-nav__menu-toggle')
    .text('Menu')
    .on('click', function(){
      $('.site-nav__menu').toggleClass('site-nav__menu--active');
    })
    .insertBefore('.site-nav__menu');

  $('img[data-src]:hidden').show();

  window.blazy = new Blazy({
    selector: 'img[data-src]'
  });

  $(document).on('js-card-filter:updated', function(){
    window.blazy.revalidate();
  });

  // http://baymard.com/labs/country-selector
  var $placeholder = $('#js-placeholder');
  $('.js-select-to-autocomplete')
    .attr({
      placeholder:  $placeholder.text(),
      autocorrect:  'off',
      autocomplete: 'off'
    })
    .selectToAutocomplete()
    .on('change', function(){
      var v = $(this).val();
      if (v) {
        // Assumes the <option>'s `value` attribute is a URL slug for the country
        window.location.href = '/' + v + '/';
      }
    })
    .on('focus', function(){
      $(this).next().trigger("focus");
    });
  $placeholder.attr('class', 'hidden')

  // Fix the incorrect default autocomplete width, which meant that
  // autocomplete menu was longer than the search input it's linked to.
  // http://stackoverflow.com/a/11845718/3096375
  jQuery.ui.autocomplete.prototype._resizeMenu = function(){
    this.menu.element.outerWidth( this.element.outerWidth() );
  }

  // Once the autocomplete widget has been created, we add our own
  // little hack to display the number of politicians in each country.
  var optionTitles = {};
  $('select.js-select-to-autocomplete option').each(function(){
    if($(this).val() != ''){
      optionTitles[ $(this).text() ] = $(this).attr('title');
    }
  });
  jQuery.ui.autocomplete.prototype._renderItem = function(ul, item) {
    var $li = $('<li>');
    $('<span>').text(item.label).appendTo($li);
    $('<span>').addClass('autocomplete-country__people').text(optionTitles[item.label]).appendTo($li);
    return $li.appendTo(ul);
  }

  $('label[for="country-selector"]').on('click', function(e){
    e.preventDefault();
    $('#country-selector').siblings('.ui-autocomplete-input').focus();
  });

  $('.data-completeness__percentage').each(function(){
    var percent = parseFloat( $(this).text() );
    var label = $(this).prev().text();
    var $parent = $(this).parents('.data-completeness');

    if(percent == 100){
      // Display a full circle with a tick, instead of a pie chart
      $parent.prepend('<div class="chart-full"><i class="fa fa-check"></i></div>');
    } else {
      // Display a pie chart (empty if percent==0)
      if (percent == 0) {
        var data = [{
          value: 100,
          label: "No data",
          color: "rgba(255, 255, 255, 0.3)"
        }];
      } else {
        var data = [{
          value: percent,
          label: label,
          color: "rgba(255, 255, 255, 1)"
        }, {
          value: 100 - percent,
          label: "No data",
          color: "rgba(255, 255, 255, 0.3)"
        }];
      }

      var $canvas = $('<canvas width="100" height="100"></canvas>');
      var $wrapped = $canvas.wrap('<div class="canvas-wrapper"></div>').parent();
      $parent.prepend($wrapped);

      var context = $canvas[0].getContext('2d');
      var chart = new Chart(context).Doughnut(data, {
        segmentShowStroke: false,
        animation: false,
        showTooltips: false,
        responsive: true,
        percentageInnerCutout: 66
      });

      $(this).data('chart', chart);
    }
  })

  // Google Events Tracking

  // Tracks interaction with filter field
  // http://stackoverflow.com/questions/4220126/run-javascript-function-when-user-finishes-typing-instead-of-on-key-up
  // Run javascript function when user finishes typing instead of on key up?
  // setup before functions
  //
  var typingTimer;                //timer identifier
  var doneTypingInterval = 2000;  //time in ms, 2 seconds
  var $input = $('[data-ga-track-change]');

  //on keyup, start the countdown
  $input.on('keyup', function() {
    clearTimeout(typingTimer);
    if (this.value.length > 0)
      typingTimer = setTimeout(doneTyping, doneTypingInterval);
  });

  //on keydown, clear the countdown
  $input.on('keydown', function() {
    clearTimeout(typingTimer);
  });

  function doneTyping() {
    ga('send', 'event', $(this).attr('data-ga-track-change'), 'user input', document.title);
  }

  $('[data-ga-track-click]').on('click', function(event){
    var that = this;
    event.preventDefault();
    analytics.trackEvent({
      eventCategory: $(this).attr('data-ga-track-click'),
      eventAction: event.type
    })
    .done(function(){
      var link = $(that).attr('href');
      if (link) window.location.href = link;
    });
  })

  analytics = {

    trackEvents: function(listOfEvents){
      // Takes a list of arguments suitable for trackEvent.
      // Returns a jQuery Deferred object.
      // The deferred object is resolved when
      // all of the trackEvent calls are resolved.
      var dfd = $.Deferred();
      var deferreds = [];
      var _this = this;
      $.each(listOfEvents, function(i, params){
          deferreds.push(_this.trackEvent(params));
      });
      $.when.apply($, deferreds).done(function(){
          dfd.resolve();
      });
      return dfd.promise();
    },

    trackEvent: function(params){
      // Takes an object of event parameters, eg:
      // { eventCategory: 'foo', eventAction: 'bar' }
      // Returns a jQuery Deferred object.
      // The deferred object is resolved when the GA call
      // completes or fails to respond within 2 seconds.
      var dfd = $.Deferred();

      if(typeof ga === 'undefined' || !ga.loaded){
        // GA has not loaded (blocked by adblock?)
        return dfd.resolve();
      }

      var defaults = {
        hitType: 'event',
        eventLabel: document.title,
        hitCallback: function(){
          dfd.resolve();
        }
      }

      ga('send', $.extend(defaults, params));

      // Wait a maximum of 2 seconds for GA response.
      setTimeout(function(){
        dfd.resolve();
      }, 2000);

      return dfd.promise();
    }

  }
});
