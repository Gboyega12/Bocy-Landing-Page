/**
 * BOCY Rate Card Renderer
 * Loads rates.json and renders rate cards into designated containers.
 */
(function () {
  'use strict';

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function renderCard(entry, rank) {
    const isTop = rank <= 3;
    const topClass = isTop ? ' rate-card--top' : '';
    const feeClass = entry.isFee ? ' rate-card__rate-value--fee' : '';

    const tagsHtml = (entry.tags || []).map(function (tag) {
      const cls = tag.type ? ' rate-card__tag--' + tag.type : '';
      return '<span class="rate-card__tag' + cls + '">' + escapeHtml(tag.text) + '</span>';
    }).join('\n                        ');

    return '<a href="' + escapeHtml(entry.url) + '" target="_blank" rel="noopener noreferrer" class="rate-card' + topClass + ' reveal is-visible">' +
      '\n                <span class="rate-card__rank">#' + rank + '</span>' +
      '\n                <div class="rate-card__info">' +
      '\n                    <div class="rate-card__provider">' + escapeHtml(entry.provider) + '</div>' +
      '\n                    <div class="rate-card__account">' + escapeHtml(entry.account) + '</div>' +
      '\n                    <div class="rate-card__meta">' +
      '\n                        ' + tagsHtml +
      '\n                    </div>' +
      '\n                </div>' +
      '\n                <div class="rate-card__rate">' +
      '\n                    <div class="rate-card__rate-value' + feeClass + '">' + escapeHtml(entry.rate) + '</div>' +
      '\n                    <div class="rate-card__rate-label">' + escapeHtml(entry.rateLabel) + '</div>' +
      '\n                    <div class="rate-card__visit">Visit \u2192</div>' +
      '\n                </div>' +
      '\n            </a>';
  }

  function renderSection(containerId, entries) {
    var container = document.getElementById(containerId);
    if (!container || !entries || !entries.length) return;

    var html = entries.map(function (entry, i) {
      return renderCard(entry, i + 1);
    }).join('\n\n            ');

    container.innerHTML = html;

    // Update the count in the section header
    var section = container.closest('.table-section');
    if (section) {
      var countEl = section.querySelector('.table-header__count');
      if (countEl) {
        var label = entries[0] && entries[0].isFee ? 'platforms' : 'accounts';
        countEl.textContent = entries.length + ' ' + label;
      }
    }
  }

  function updateDate(dateStr) {
    var el = document.getElementById('update-date');
    if (el && dateStr) {
      var parts = dateStr.split('-');
      var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      el.textContent = parseInt(parts[2], 10) + ' ' + months[parseInt(parts[1], 10) - 1] + ' ' + parts[0];
    }
  }

  // Expose globally
  window.BOCY = {
    renderSection: renderSection,
    updateDate: updateDate,

    /**
     * Load rates.json and render all sections defined in the sectionMap.
     * @param {Object} sectionMap - { containerId: 'dotted.path.in.json' }
     *   e.g. { 'ea-list': 'savings.easyAccess', 'fixed-list': 'savings.fixedRate' }
     */
    loadAndRender: function (sectionMap) {
      fetch('/rates.json?v=' + Date.now())
        .then(function (r) { return r.json(); })
        .then(function (data) {
          Object.keys(sectionMap).forEach(function (containerId) {
            var path = sectionMap[containerId].split('.');
            var entries = data;
            for (var i = 0; i < path.length; i++) {
              entries = entries[path[i]];
              if (!entries) break;
            }
            if (entries) renderSection(containerId, entries);
          });
          if (data.lastUpdated) updateDate(data.lastUpdated);
        })
        .catch(function (err) {
          console.error('Failed to load rates:', err);
        });
    }
  };
})();
