/* =========================================================
   CPPEM · AULÃO DE VÉSPERA PPRN — script

   Página de VENDA DIRETA: não há formulário de captura aqui, então não existe
   emissor de Lead neste arquivo. Os cliques de compra empurram um evento
   próprio (`clique_checkout`) para o dataLayer — é telemetria de botão, não
   conversão, e por isso não conflita com a regra de Lead do painel usada nas
   landings de captura.

   O que esta página tem e as outras não: um CRONÔMETRO. Ele é a peça que
   sustenta a dobra, e é também a única coisa aqui que envelhece sozinha —
   por isso a data do evento mora numa constante só, logo abaixo.
   ========================================================= */
(function () {
  "use strict";

  /* =========================================================
     CONFIG — os únicos valores que mudam quando a oferta muda
     ========================================================= */
  var CONFIG = {

    /* ─── CHECKOUT ─────────────────────────────────────────
       A chave casa com o atributo data-checkout dos botões no index.html.
       Hoje existe um ingresso só; quando o B entrar, ele vira outra chave
       aqui e outro botão lá — nada mais precisa mudar.

       Se a URL for esvaziada, o botão NÃO fica morto: volta a apontar para o
       WhatsApp já dizendo qual ingresso a pessoa quis. É a rede de segurança
       para o intervalo entre despublicar um checkout e publicar o próximo —
       um CTA que leva a lugar nenhum queima tráfego pago. */
    checkouts: {
      ingressoA: "https://checkout.cppem.com.br/pay/aulao-pprn-ingresso-a"
    },

    /* ─── A DATA DO EVENTO ─────────────────────────────────
       Domingo, 6 de setembro de 2026, 8h da manhã, horário de Brasília.

       O -03:00 é OBRIGATÓRIO e não é decoração: sem ele o construtor de Date
       lê a string como horário LOCAL do visitante, e quem abrisse a página
       de outro fuso veria uma contagem diferente da de quem está em Caruaru.
       Com o deslocamento explícito, o instante é o mesmo para todo mundo. */
    evento: "2026-09-06T08:00:00-03:00",

    /* WhatsApp de atendimento. Mora só aqui: o href do botão flutuante no
       HTML é apenas um destino de segurança para o caso de o JS não rodar. */
    whatsapp: "558173105354",

    pagina: "Aulão de Véspera PPRN"
  };

  /* ---------- ano do rodapé ---------- */
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* =========================================================
     BRASÃO AUSENTE → SIGLA NO LUGAR

     O brasão é a peça central da hero e do CTA final. Um <img> quebrado ali
     estragaria as duas — então, se ele falhar, o .selo__core troca para a
     sigla "PP / RN" que já mora no HTML.

     Duas verificações, e as duas são necessárias: o listener de `error` pega
     as imagens que ainda estão carregando, e a checagem de
     `complete && naturalWidth === 0` pega as que JÁ falharam antes deste
     script rodar — ele está no fim do <body>, então isso acontece sempre que
     a imagem responde rápido com 404.
     ========================================================= */
  Array.prototype.forEach.call(
    document.querySelectorAll(".selo__core img"),
    function (img) {
      function marcar() {
        var alvo = img.closest(".selo__core");
        if (alvo) alvo.classList.add("is-fallback");
      }
      img.addEventListener("error", marcar);
      if (img.complete && img.naturalWidth === 0) marcar();
    }
  );

  /* =========================================================
     WHATSAPP — um número, montado num lugar só

     Vale para o botão flutuante e para qualquer link com [data-wa] no meio do
     texto. A mensagem de cada um vem do próprio data-msg, então o atendimento
     já recebe o contexto de onde a pessoa clicou.
     ========================================================= */
  function urlWhats(msg) {
    return "https://wa.me/" + CONFIG.whatsapp +
           (msg ? "?text=" + encodeURIComponent(msg) : "");
  }

  Array.prototype.forEach.call(document.querySelectorAll("[data-wa]"), function (el) {
    el.href = urlWhats(el.getAttribute("data-msg") || "");
    el.target = "_blank";
    el.rel = "noopener";
  });

  /* =========================================================
     CHECKOUT
     ========================================================= */
  Array.prototype.forEach.call(document.querySelectorAll("[data-checkout]"), function (btn) {
    var chave   = btn.getAttribute("data-checkout");
    var produto = btn.getAttribute("data-produto") || "";
    var url     = CONFIG.checkouts[chave] || "";

    if (url) {
      /* checkout de verdade: mesma aba, que é o comportamento esperado de um
         fluxo de pagamento */
      btn.href = url;
      btn.removeAttribute("target");
    } else {
      /* ainda sem checkout: o botão vira atendimento, já dizendo o que a
         pessoa quis comprar */
      btn.href = urlWhats("Olá! Quero comprar o " + produto + ". Como faço?");
      btn.target = "_blank";
      btn.rel = "noopener";
    }

    btn.addEventListener("click", function () {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: "clique_checkout",
        pagina: CONFIG.pagina,
        produto: produto,
        destino: url ? "checkout" : "whatsapp"
      });
    });
  });

  /* =========================================================
     CRONÔMETRO

     Três destinos, um só cálculo por segundo: a caixa grande da dobra, a
     pílula da navbar e a linha da barra fixa do mobile. Fazer três timers
     separados era o caminho fácil e teria os três dessincronizados na virada
     do minuto.

     Quando a data passa, TUDO troca de estado de uma vez: a caixa vira
     "inscrições encerradas", a pílula para de contar e a dock diz o mesmo.
     Um cronômetro parado em zero — ou pior, contando para trás — é a forma
     mais rápida de a página perder credibilidade sozinha depois do evento.
     ========================================================= */
  var crono    = document.getElementById("crono");
  var elDias   = document.getElementById("cDias");
  var elHoras  = document.getElementById("cHoras");
  var elMin    = document.getElementById("cMin");
  var elSeg    = document.getElementById("cSeg");
  var navDias  = document.getElementById("navDias");
  var navTxt   = document.getElementById("navDiasTxt");
  var dockPz   = document.getElementById("dockPrazo");

  var alvo = new Date(CONFIG.evento).getTime();

  /* dois dígitos nas horas/minutos/segundos: sem isso a caixa passa de "9"
     para "10" e a largura do bloco pula, mesmo com tabular-nums */
  function dd(n) { return n < 10 ? "0" + n : String(n); }

  function tick() {
    var falta = alvo - Date.now();

    if (falta <= 0) {
      if (crono) crono.classList.add("is-encerrado");
      if (navDias) navDias.textContent = "06/09";
      if (navTxt)  navTxt.textContent  = "aulão encerrado";
      if (dockPz)  dockPz.textContent  = "Inscrições encerradas";
      return false;   // avisa o laço para parar
    }

    var seg   = Math.floor(falta / 1000);
    var dias  = Math.floor(seg / 86400);
    var horas = Math.floor((seg % 86400) / 3600);
    var min   = Math.floor((seg % 3600) / 60);
    var s     = seg % 60;

    if (elDias)  elDias.textContent  = String(dias);
    if (elHoras) elHoras.textContent = dd(horas);
    if (elMin)   elMin.textContent   = dd(min);
    if (elSeg)   elSeg.textContent   = dd(s);

    /* A navbar e a dock contam em DIAS, não em segundos: elas ficam na
       periferia da visão o tempo todo, e um número mudando a cada segundo
       ali rouba a atenção do texto que a pessoa está lendo. */
    if (navDias && navTxt) {
      if (dias >= 1) {
        navDias.textContent = String(dias);
        navTxt.textContent  = dias === 1 ? "dia para o aulão" : "dias para o aulão";
      } else {
        navDias.textContent = "Hoje";
        navTxt.textContent  = "é o dia do aulão";
      }
    }
    if (dockPz) {
      dockPz.textContent = dias >= 1
        ? (dias === 1 ? "Falta 1 dia · 06/09" : "Faltam " + dias + " dias · 06/09")
        : "É hoje · 8h às 18h";
    }

    return true;
  }

  if (crono) {
    if (tick()) {
      var relogio = setInterval(function () {
        if (!tick()) clearInterval(relogio);
      }, 1000);
    }
  }

  /* =========================================================
     HEADER STICKY + BARRA DE PROGRESSO + PARALLAX + DOCK
     ========================================================= */
  var header   = document.getElementById("header");
  var progress = document.getElementById("progress");
  var heroBg   = document.getElementById("heroBg");
  var dock     = document.getElementById("dock");
  var ticking  = false;

  function render() {
    var y = window.scrollY;
    if (header) header.classList.toggle("is-stuck", y > 40);

    if (progress) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";
    }

    /* A barra fixa do mobile só entra depois da hero — antes disso o próprio
       CTA da dobra já está na tela e ela só atrapalharia. */
    if (dock) dock.classList.toggle("is-on", y > window.innerHeight * 0.85);

    if (!reduced && heroBg && y < window.innerHeight * 1.2) {
      heroBg.style.transform = "translateY(" + (y * 0.16) + "px)";
    }
    ticking = false;
  }
  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(render); }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  render();

  /* =========================================================
     REVEAL AO ROLAR (com escalonamento)

     .ficha__item ficou de fora de propósito: a ficha mora na hero e já entra
     pela animação .anim d5 — dois fade-ins no mesmo bloco brigariam.

     .grade__item também ficou de fora: são dez linhas em sequência, e o
     escalonamento de 80ms faria a última aparecer quase um segundo depois da
     primeira. Numa linha do tempo isso lê como carregamento travado.
     ========================================================= */
  var alvos = document.querySelectorAll(
    ".section__head, .card, .local__col, .oferta, .inclui, " +
    ".faq__item, .final__inner"
  );
  Array.prototype.forEach.call(alvos, function (el) { el.classList.add("reveal"); });

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      var i = 0;
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.style.transitionDelay = (i++ * 80) + "ms";
        e.target.classList.add("is-visible");
        io.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -60px" });
    Array.prototype.forEach.call(alvos, function (el) { io.observe(el); });
  } else {
    Array.prototype.forEach.call(alvos, function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- brilho seguindo o cursor nos cards ---------- */
  Array.prototype.forEach.call(document.querySelectorAll(".card"), function (card) {
    card.addEventListener("mousemove", function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%");
      card.style.setProperty("--my", ((e.clientY - r.top) / r.height) * 100 + "%");
    });
  });

  /* =========================================================
     BRASAS — atmosfera da página inteira

     Cada brasa é um <i> com quatro variáveis CSS (posição, tamanho, cor,
     ritmo). A animação em si mora no styles.css e só mexe em transform e
     opacity, que o compositor resolve sozinho — nenhuma delas causa layout.

     Duas faixas de cor: a maioria em ouro, uma minoria em brasa quente. Todas
     do mesmo tom deixava a camada chapada; alternando, ela ganha a variação
     de temperatura que uma fagulha de verdade tem.
     ========================================================= */
  var brasas = document.getElementById("brasas");
  if (brasas && !reduced) {
    var TONS = [
      "rgba(201,174,122,.9)",   // ouro claro
      "rgba(175,146,86,.85)",   // ouro
      "rgba(196,112,63,.85)"    // brasa quente
    ];

    for (var b = 0; b < 22; b++) {
      var br = document.createElement("i");
      br.className = "brasa";
      br.style.setProperty("--x", (Math.random() * 100).toFixed(2) + "%");
      br.style.setProperty("--s", (2 + Math.random() * 3).toFixed(1) + "px");
      /* o tom quente entra em cerca de um terço delas */
      br.style.setProperty("--cor", TONS[Math.random() < .34 ? 2 : (Math.random() < .5 ? 0 : 1)]);
      br.style.setProperty("--op", (.35 + Math.random() * .45).toFixed(2));
      br.style.setProperty("--dur", (13 + Math.random() * 13).toFixed(1) + "s");
      /* atraso negativo: as brasas já entram no meio do próprio ciclo, então a
         camada aparece povoada no primeiro segundo em vez de começar vazia e
         levar meio minuto para encher. */
      br.style.setProperty("--atraso", "-" + (Math.random() * 26).toFixed(1) + "s");
      brasas.appendChild(br);
    }
  }

  /* ---------- faíscas douradas na hero ---------- */
  var sparks = document.getElementById("sparks");
  if (sparks && !reduced) {
    for (var s2 = 0; s2 < 16; s2++) {
      var i2 = document.createElement("i");
      i2.className = "spark";
      i2.style.left = (Math.random() * 100) + "%";
      i2.style.bottom = (Math.random() * 40) + "%";
      i2.style.animationDuration = (7 + Math.random() * 7) + "s";
      i2.style.animationDelay = (Math.random() * 8) + "s";
      sparks.appendChild(i2);
    }
  }

})();
