(function(){'use strict';

// Animate elements when they enter the viewport
const observer = new IntersectionObserver((entries)=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting) entry.target.classList.add('in-view');
  });
},{ threshold: 0.12 });

document.addEventListener('DOMContentLoaded', ()=>{
  document.querySelectorAll('[data-animate]').forEach(el=>observer.observe(el));

  // Replace old style focused class with .focused on focus
  document.querySelectorAll('.gen-input, textarea.gen-input, .form-select').forEach(inp=>{
    inp.addEventListener('focus', ()=>{ inp.classList.add('focused'); });
    inp.addEventListener('blur', ()=>{ inp.classList.remove('focused'); });
  });

  // Button ripple effect
  document.querySelectorAll('.btn-ripple').forEach(btn=>{
    btn.addEventListener('pointerdown', function(e){
      const rect = this.getBoundingClientRect();
      const ripple = document.createElement('span');
      const size = Math.max(rect.width, rect.height);
      ripple.className = 'ripple';
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - rect.left - size/2) + 'px';
      ripple.style.top = (e.clientY - rect.top - size/2) + 'px';
      this.appendChild(ripple);
      setTimeout(()=>ripple.remove(), 700);
    });
  });

  // Smooth hero parallax effect (subtle)
  const hero = document.querySelector('.hero-cta');
  if(hero){
    document.addEventListener('mousemove', (e)=>{
      const x = (e.clientX / window.innerWidth - 0.5) * 8;
      const y = (e.clientY / window.innerHeight - 0.5) * 8;
      hero.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    });
  }
});

})();