// Lightweight client script for live ticker and simple UI touches
(function(){
  const priceEl = document.getElementById('btc-price');
  const changeEl = document.getElementById('btc-change');

  // Seed price and simple simulator
  let price = 70000 + Math.random() * 2000;

  function formatPrice(p){
    return p.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2});
  }

  function updateTicker(){
    // small random walk
    const pct = (Math.random() - 0.45) * 0.4; // +/- ~0.2% swings
    const old = price;
    price = Math.max(50, price * (1 + pct/100));
    const changePct = ((price - old) / old) * 100;
    priceEl.textContent = '$' + formatPrice(price);
    const sign = changePct >= 0 ? '+' : '';
    changeEl.textContent = sign + changePct.toFixed(2) + '%';
    changeEl.style.color = changePct >= 0 ? '#00ff99' : '#ff6b6b';
  }

  // Run immediately and every 5s
  updateTicker();
  setInterval(updateTicker, 5000);

  // Small parallax and subtle glow effect on hero background
  document.addEventListener('mousemove', (e) => {
    const heroBg = document.querySelector('.hero-bg');
    if(!heroBg) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const mx = (e.clientX - w/2) / w;
    const my = (e.clientY - h/2) / h;
    heroBg.style.transform = `translate(${mx*6}px, ${my*6}px) scale(1.02)`;
  });

})();
