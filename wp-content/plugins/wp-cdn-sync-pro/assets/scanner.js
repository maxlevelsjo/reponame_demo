/**
 * WP CDN Sync Pro - Frontend DOM Scanner (Enhanced)
 * This script runs on the live homepage to find all assets.
 */
(function ($) {
  const getUrlsFromCss = (text) => {
    const urls = [];
    const urlRegex = /url\((['"]?)(.*?)\1\)/gi;
    let match;
    while ((match = urlRegex.exec(text)) !== null) {
      urls.push(match[2]);
    }
    return urls;
  };

  const extractAssetUrl = (el) => {
    return (
      el.getAttribute('href') ||
      el.getAttribute('src') ||
      el.getAttribute('data-src') ||
      ''
    ).trim();
  };

  $(window).on("load", function () {
    const foundUrls = new Set();

    // 1. Collect src/href/data-src from all tags
    document.querySelectorAll('[src], [href], [data-src]').forEach((el) => {
      const url = extractAssetUrl(el);
      if (url) {
        foundUrls.add(url);
      }
    });

    // 2. Inline style background-image
    document.querySelectorAll('[style]').forEach((el) => {
      const styleAttr = el.getAttribute('style');
      if (styleAttr && styleAttr.includes('url(')) {
        getUrlsFromCss(styleAttr).forEach((url) => foundUrls.add(url));
      }
    });

    // 3. Computed styles (e.g., Elementor injected background styles)
    document.querySelectorAll('*').forEach((el) => {
      const style = getComputedStyle(el);
      ['backgroundImage', 'borderImageSource'].forEach((prop) => {
        if (style[prop] && style[prop].includes('url(')) {
          getUrlsFromCss(style[prop]).forEach((url) => foundUrls.add(url));
        }
      });
    });

    // 4. Send to backend
    $.ajax({
      url: wpcspScanner.ajaxurl,
      method: 'POST',
      data: {
        action: 'wpcsp_save_scan_results',
        _ajax_nonce: wpcspScanner.nonce,
        urls: [...foundUrls],
        scan_session_id: wpcspScanner.scan_session_id,
      },
      success: function () {
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage('wpcsp-scan-complete', '*');
        }
        window.close();
      },
      error: function () {
        window.close();
      },
    });
  });
})(jQuery);
