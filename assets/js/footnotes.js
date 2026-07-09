document.addEventListener('DOMContentLoaded', function () {
  var activeBubble = null;
  var activeRef = null;

  function closeBubble() {
    if (activeBubble) {
      activeBubble.remove();
      activeBubble = null;
    }
    if (activeRef) {
      activeRef.setAttribute('aria-expanded', 'false');
      activeRef = null;
    }
  }

  function showBubble(refLink, footnoteEl) {
    closeBubble();

    var bubble = document.createElement('div');
    bubble.className = 'footnote-bubble';
    bubble.setAttribute('role', 'tooltip');
    bubble.innerHTML = footnoteEl.innerHTML;

    // Kramdown includes a "back to text" arrow inside each footnote's <li>;
    // it makes no sense inside a popup bubble, so strip it from the clone.
    var backlink = bubble.querySelector('.reversefootnote');
    if (backlink) backlink.remove();

    document.body.appendChild(bubble);

    var refRect = refLink.getBoundingClientRect();
    var bubbleRect = bubble.getBoundingClientRect();

    var top = window.scrollY + refRect.bottom + 8;
    var left = window.scrollX + refRect.left;

    // Keep the bubble from overflowing off the right (or left) edge.
    var maxLeft = window.scrollX + document.documentElement.clientWidth - bubbleRect.width - 12;
    if (left > maxLeft) left = Math.max(12, maxLeft);
    if (left < 0) left = 12;

    bubble.style.top = top + 'px';
    bubble.style.left = left + 'px';

    refLink.setAttribute('aria-expanded', 'true');
    activeBubble = bubble;
    activeRef = refLink;
  }

  var refs = document.querySelectorAll('.post-content a.footnote');
  refs.forEach(function (refLink) {
    refLink.setAttribute('aria-expanded', 'false');
    refLink.addEventListener('click', function (event) {
      var targetId = refLink.getAttribute('href');
      if (!targetId || targetId.charAt(0) !== '#') return;

      // Not querySelector('#fn:1') — a bare ":" isn't valid inside a CSS ID
      // selector without escaping, so that throws in every real browser too.
      var footnoteEl = document.getElementById(targetId.slice(1));
      if (!footnoteEl) return;

      event.preventDefault();

      if (activeRef === refLink) {
        closeBubble();
        return;
      }
      showBubble(refLink, footnoteEl);
    });
  });

  document.addEventListener('click', function (event) {
    if (!activeBubble) return;
    if (activeRef && (event.target === activeRef || activeRef.contains(event.target))) return;
    if (activeBubble.contains(event.target)) return;
    closeBubble();
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closeBubble();
  });

  window.addEventListener('scroll', closeBubble, { passive: true });
  window.addEventListener('resize', closeBubble);
});
