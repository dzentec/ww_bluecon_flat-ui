/* Shared by expansion-boards-settings.html and add-expansion-board.html (see themes/boards.css). */
window.WWBoards = (function(){
  var META = {
    W2:   { desc: 'Desc: 2 Wiegand ports',        serial: 'Serial: W2B-0021-7743',   href: 'board-w2.html' },
    R2IO: { desc: 'Desc: 2 Inputs & 2 Relay out', serial: 'Serial: R2IOB-0237-7743', href: 'board-r2io.html' }
  };
  var ORDER = ['W2', 'R2IO'];
  var TRASH = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-8 0 1 13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-13"/></svg>';

  function load(){
    try { var v = JSON.parse(localStorage.getItem('wwBoards')); if(Array.isArray(v)) return v.filter(function(n){ return META[n]; }); } catch(e) {}
    return ORDER.slice();
  }
  function save(list){ try { localStorage.setItem('wwBoards', JSON.stringify(list)); } catch(e) {} }
  /* Global Relay Failsafe only means something when an installed board has relays (R2IO; W2 has none). */
  function hasRelayBoard(list){ return list.indexOf('R2IO') >= 0; }

  /* Wrap a board row (<a> or <div class="board-row">) in the swipe container. onTap: what a tap on the closed
     card does (null: a tap opens the trash). onDelete runs after the removal animation. */
  function swipeWrap(rowHtml, onTap, onDelete){
    var wrap = document.createElement('div');
    wrap.className = 'swipe';
    wrap.innerHTML = '<button type="button" class="swipe-trash" aria-label="Delete board">' + TRASH + '</button><div class="swipe-card">' + rowHtml + '</div>';
    var card = wrap.querySelector('.swipe-card');
    var trash = wrap.querySelector('.swipe-trash');
    var startX = null, lastX = 0, moved = false, base = 0;

    // A card that is a link would start the browser's native link drag and cancel the pointer events: forbid it.
    card.addEventListener('dragstart', function(e){ e.preventDefault(); });
    card.addEventListener('pointerdown', function(e){
      startX = e.clientX; lastX = e.clientX; moved = false; base = wrap.classList.contains('open') ? -80 : 0;
      try { card.setPointerCapture(e.pointerId); } catch(err) {}
    });
    card.addEventListener('pointermove', function(e){
      if(startX === null) return;
      lastX = e.clientX;
      var dx = e.clientX - startX;
      if(Math.abs(dx) > 6){ moved = true; wrap.classList.add('dragging'); }
      if(moved){
        var x = Math.max(-80, Math.min(0, base + dx));
        card.style.transform = 'translateX(' + x + 'px)';
        trash.style.opacity = String(-x / 80);
        trash.style.transform = 'scale(' + (0.6 + 0.4 * (-x / 80)) + ')';
      }
    });
    function endDrag(){
      if(startX === null) return;
      var dx = lastX - startX;   // last position seen while moving (a cancelled pointer has no usable clientX)
      var x = Math.max(-80, Math.min(0, base + dx));
      startX = null;
      wrap.classList.remove('dragging');
      card.style.transform = ''; trash.style.opacity = ''; trash.style.transform = '';
      if(moved) wrap.classList.toggle('open', x < -40);
    }
    card.addEventListener('pointerup', endDrag);
    card.addEventListener('pointercancel', endDrag);
    card.addEventListener('click', function(e){
      if(moved){ e.preventDefault(); moved = false; return; }
      if(wrap.classList.contains('open')){ e.preventDefault(); wrap.classList.remove('open'); return; }
      if(onTap){ return; } // let the link navigate
      e.preventDefault();
      wrap.classList.add('open');
    });
    trash.addEventListener('click', function(){
      if(!wrap.classList.contains('open') || wrap.classList.contains('removing')) return;
      wrap.classList.add('removing');            // the card rolls back, the dot goes grey and out
      setTimeout(function(){                      // then the card fades and collapses away
        wrap.style.maxHeight = wrap.offsetHeight + 'px';
        void wrap.offsetHeight;
        wrap.classList.add('collapse');
      }, 480);
      setTimeout(function(){ onDelete(); }, 820);
    });
    return wrap;
  }
  return { META: META, ORDER: ORDER, load: load, save: save, hasRelayBoard: hasRelayBoard, swipeWrap: swipeWrap };
})();
