(function () {
  'use strict';

  var content = document.querySelector('.post-content');
  if (!content) return;

  var headings = content.querySelectorAll('h2[id], h3[id]');
  if (headings.length < 2) return;

  var nav = document.createElement('nav');
  nav.className = 'post-toc';
  nav.setAttribute('aria-label', 'Daftar isi');

  var heading = document.createElement('p');
  heading.className = 'post-toc-title';
  heading.textContent = 'Isi';
  nav.appendChild(heading);

  var list = document.createElement('ul');
  var links = {};

  Array.prototype.forEach.call(headings, function (node) {
    var item = document.createElement('li');
    item.className = node.tagName === 'H3' ? 'post-toc-sub' : 'post-toc-top';

    var link = document.createElement('a');
    link.href = '#' + node.id;
    link.textContent = node.textContent;
    link.addEventListener('click', function (event) {
      event.preventDefault();
      node.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (history.replaceState) history.replaceState(null, '', '#' + node.id);
    });

    item.appendChild(link);
    list.appendChild(item);
    links[node.id] = link;
  });

  nav.appendChild(list);
  document.body.appendChild(nav);

  function setActive(id) {
    Object.keys(links).forEach(function (key) {
      links[key].classList.toggle('is-active', key === id);
    });
  }

  setActive(headings[0].id);

  if (!('IntersectionObserver' in window)) return;

  var visible = {};
  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        visible[entry.target.id] = entry.isIntersecting;
      });

      var current = null;
      Array.prototype.forEach.call(headings, function (node) {
        if (visible[node.id] && current === null) current = node.id;
      });

      if (current === null) {
        var scrolled = window.pageYOffset;
        Array.prototype.forEach.call(headings, function (node) {
          if (node.getBoundingClientRect().top + scrolled <= scrolled + 120) {
            current = node.id;
          }
        });
      }

      if (current) setActive(current);
    },
    { rootMargin: '-100px 0px -60% 0px', threshold: 0 }
  );

  Array.prototype.forEach.call(headings, function (node) {
    observer.observe(node);
  });
})();
