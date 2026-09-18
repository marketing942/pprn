# CPPEM · Aulão de Véspera — Polícia Penal do RN

Landing de venda do ingresso para o aulão de véspera da **PPRN**, no domingo
**6 de setembro de 2026**, das **8h às 18h**, na sede do CPPEM em Caruaru, com
transmissão ao vivo inclusa.

Página estática: `index.html` + `styles.css` + `script.js`, no mesmo sistema
visual dos Combos Unificados e da Operação Alvorada (Oxanium + Rajdhani, ouro
`#AF9256` sobre preto `#0A0A0B`, cantos chanfrados).

| Arquivo | O que é |
|---|---|
| `index.html` | Página inteira: header, hero, cronômetro, grade do dia, local, oferta, FAQ, CTA final, footer e barra fixa |
| `styles.css` | Sistema visual + as três peças novas: `.selo`, `.crono` e `.grade` |
| `script.js` | Cronômetro, checkout, scroll/reveal, brasas e o bloco de tracking |
| `scripts/recortar-brasao.py` | Tira o fundo branco do brasão da PPRN — `python scripts/recortar-brasao.py` |
| `public/` | Brasão da PPRN, logo CPPEM, emblema do leão, fundos e favicons |
| `public/originais/` | O JPEG original do brasão. Não é baixado por ninguém, fica só como fonte |

---

## ⚠️ Pendências antes de publicar

### Domínio e imagem de compartilhamento

- `<link rel="canonical">` e `og:url` estão em `https://aulaopprn.cppem.com.br/`.
  Confirme o domínio final — os dois precisam apontar para o **mesmo** endereço.
- Falta gerar `public/og-aulao-pprn.jpg` em **1200×630**. Sem ele, o preview no
  WhatsApp e no Instagram sai sem imagem, e é por WhatsApp que a maior parte
  deste tráfego chega.

### O endereço da sede

A página diz **"Sede do CPPEM · Caruaru — Pernambuco"** e leva ao Google Maps
pelas coordenadas que foram passadas (`-8.286353, -35.967442`). **Não existe
rua e número escritos em lugar nenhum** — nem nesta página nem nos outros
projetos do CPPEM. Quando o endereço completo aparecer, ele entra em dois
lugares:

- `index.html` · `.local__col` da coluna **Presencial**
- `index.html` · o bloco `PostalAddress` do JSON-LD (hoje só com
  `addressLocality`/`addressRegion`)

### Os professores não estão na página — de propósito

A grade veio com nome de professor em quase todas as matérias, mas a instrução
foi **não publicar nenhum**, porque a escalação ainda pode mudar até o dia 6.
Se um nome entrar, todos devem entrar: uma grade com sete professores nomeados
e duas matérias em branco lê como aula sem responsável.

O lugar é o `.grade__box`, entre `.grade__mat` e `.grade__dur`.

### Os horários de cada bloco são uma distribuição, não um cronograma fechado

O que foi confirmado é a **janela** (8h às 18h), as **nove matérias** e **uma
hora cada**. O relógio de cada linha — 08h, 09h, …, intervalo às 13h, 14h às
17h — é a distribuição que fecha nove horas de aula dentro de dez, e ainda não
foi confirmada bloco a bloco.

Enquanto for assim, a nota abaixo da grade (`.grade__nota`) **fica**. Quando o
cronograma real chegar, ajuste os `.grade__hora` (e os `.grade__hora--mob`, que
repetem o mesmo valor para o mobile) e remova a nota.

---

## Data e preço

### A data

**Domingo, 6 de setembro de 2026, 8h às 18h.** A prova oficial da PPRN é em
**13 de setembro de 2026** — também um domingo. O aulão é exatamente uma semana
antes, e esse "uma semana antes" é o argumento central da página: aparece na
manchete, na ficha da hero (`7 · dias antes da prova`), na seção *Por que a
véspera* e no CTA final.

A data mora em **dois lugares** e os dois precisam andar juntos:

| Onde | O quê |
|---|---|
| `script.js` · `CONFIG.evento` | `"2026-09-06T08:00:00-03:00"` — a origem do cronômetro |
| `index.html` · JSON-LD | `startDate` / `endDate` |

Além desses dois, `06/09` e `13 de setembro` aparecem escritos por extenso na
hero, na ficha, no cronômetro, na grade, no FAQ, no CTA final e na barra fixa —
procure por `06/09` e `13 de setembro` antes de mudar qualquer coisa.

**O `-03:00` no `CONFIG.evento` não é decoração.** Sem ele o `Date` lê a string
como horário local do visitante, e quem abrisse a página de outro fuso veria
uma contagem diferente da de quem está em Caruaru.

### O preço

**R$ 69,00 → R$ 39,90 (−42%) · ou até 3x de R$ 14,14 no cartão.**

Aparece em **quatro lugares**, e todos precisam andar juntos:

| Onde | O quê |
|---|---|
| `index.html` · `.oferta` | de/por, a faixa `42% OFF` e a linha do parcelamento |
| `index.html` · `.final__note` | a nota curta do CTA final |
| `index.html` · `.dock__info` | a barra fixa do mobile |
| `index.html` · JSON-LD | `offers.price` — o valor **à vista** (39.90) |

No JSON-LD vai o valor à vista de propósito: o Google compara `price` com o que
aparece no checkout, e mandar o valor da parcela faria a marcação divergir da
página.

3 × R$ 14,14 dá R$ 42,42, e não R$ 39,90 — é o acréscimo do parcelamento. A
página diz isso em uma linha (`.oferta__asterisco`) em vez de deixar a conta
aparente e sem explicação.

---

## Checkout

```
https://checkout.cppem.com.br/pay/aulao-pprn-ingresso-a
```

A URL mora em **um lugar só**, no topo do `script.js`:

```js
checkouts: {
  ingressoA: "https://checkout.cppem.com.br/pay/aulao-pprn-ingresso-a"
}
```

A chave casa com o `data-checkout` dos botões no HTML. São **três botões** — o
da seção de oferta, o do CTA final e o da barra fixa — e os três apontam para o
mesmo destino, na **mesma aba**, que é o comportamento esperado de um fluxo de
pagamento.

**Rede de segurança:** se a URL for esvaziada, os botões *não* ficam mortos —
voltam a apontar para o WhatsApp já dizendo qual ingresso a pessoa quis. É para
cobrir o intervalo entre despublicar um checkout e publicar o próximo, sem
queimar tráfego pago com um CTA que não leva a lugar nenhum.

### Quando o ingresso B existir

O slug termina em `-ingresso-a`, então provavelmente virá um B. Hoje a página é
de **um ingresso só**, e por isso a oferta é um bloco centralizado em vez de
dois cards lado a lado.

Para adicionar o segundo: outra chave em `CONFIG.checkouts`, outro botão com o
`data-checkout` correspondente, e o `.oferta` vira uma grade de dois. O texto
de "um ingresso, os dois formatos" — que aparece na seção *O local*, na seção
*Ingresso* e na primeira pergunta do FAQ — precisa mudar junto, porque ele
existe justamente para explicar por que não há escolha a fazer.

---

## As três peças que não existem nos outros projetos

### O selo (`.selo`) e o recorte do brasão

O brasão da PPRN é a peça central da hero e do CTA final: um medalhão hexagonal
com aro de ouro e o halo verde da Penal (`--penal: #6E8C6A`, que é de
**sussurro** — entra só no aro e no fundo do miolo, nunca em texto ou botão).

O hexágono tem **bico curto (18%/82%, não 25%/75%)** pelo mesmo motivo do
medalhão dos Combos Unificados: com o bico de um hexágono regular, a faixa de
largura cheia é estreita demais e o desenho de dentro precisa encolher.

A caixa do brasão é **quadrada (74%×74%) com `object-fit: contain`**. O brasão é
mais alto que largo; trocar por `cover` cortaria o "PENAL" da tarja de baixo.

#### Como o brasão foi recortado

O original chegou como **JPEG com fundo branco** e vive em
`public/originais/pprn.jpg` — ele não é baixado por ninguém, fica ali só como
fonte. Quem o converte é:

```bash
python scripts/recortar-brasao.py     # requer: pip install pillow numpy
```

Ele produz dois arquivos em `public/`:

- `brasao-pprn.webp` — o brasão recortado, usado no selo
- `marca-pprn.webp` — o mesmo desenho em ouro monocromático, usado como marca
  d'água das seções planas pelo `styles.css`

**Não é um "remover branco" global** — isso furaria o desenho, que tem claro de
verdade dentro (os ramos de louro prateados, as letras de "POLÍCIA" e "PENAL",
a estrela, a vela do barco). É um flood fill a partir das bordas: só o fundo
conectado à moldura da imagem vira transparente.

O limiar é **110**, e não é chute. O `thresh` do PIL não é por canal — ele
compara a **soma** das diferenças dos três canais, então a escala vai de 0 a
765. Nesta imagem:

| | valor | distância do fundo |
|---|---|---|
| fundo | `(235,235,233)` | 0 |
| sombra projetada do escudo | até `(214,216,215)` | ~58 |
| dourado da moldura | `(221,203,121)` | ~158 |

Abaixo de 90 a sombra sobrevive e vira um halo cinza em volta do escudo, que
sobre o preto da página fica bem visível. Acima de 130 a passada começa a comer
os ramos de louro pela borda. 110 é a faixa entre as duas coisas.

**Se o arquivo deixar de carregar**, a página não mostra imagem quebrada: o
`script.js` marca o `.selo__core` como `.is-fallback` e o bloco `PP / RN` em
Oxanium que já mora no HTML (`.selo__fb`) entra no lugar, no mesmo ponto e com
o mesmo peso.

#### Por que a marca d'água usa `marca-pprn`, e não `brasao-pprn`

O brasão oficial é azul, verde e dourado. Mesmo a 5,5% de opacidade, ele jogava
manchas de cor na direita da seção — a única coisa fora da paleta na página
inteira. O `marca-pprn.webp` é o mesmo desenho remapeado para a rampa de ouro
(`--gold-deep` → `--gold-light`), e some no preto como as outras texturas.

### O cronômetro (`.crono`) é o que sustenta a página

Numa página de evento a informação que decide a compra é **quanto tempo falta**
— então o cronômetro ocupa aqui o lugar que o medalhão de brasões ocupa nas
outras landings. Ele monta sobre o fim da hero por uma margem negativa, para
aparecer antes de a dobra terminar de sair da tela.

Três decisões que quebram se mexidas sem cuidado:

1. **`font-variant-numeric: tabular-nums` mais `min-width` em `ch`.** Sem isso
   os dígitos têm larguras diferentes e a caixa dos segundos muda de tamanho a
   cada tique — a página inteira treme uma vez por segundo.
2. **Um cálculo por segundo alimenta três destinos** (a caixa grande, a pílula
   da navbar e a barra fixa). Três timers separados era o caminho fácil e
   deixaria os três dessincronizados na virada do minuto.
3. **A navbar e a dock contam em dias, não em segundos.** Elas ficam na
   periferia da visão o tempo todo, e um número mudando a cada segundo ali
   rouba a atenção do texto que a pessoa está lendo.

**Depois que a data passar**, o script troca o miolo por *"As inscrições para
este aulão foram encerradas"* (`.crono.is-encerrado`), para a página nunca
mostrar uma contagem parada em zero — ou, pior, contando para trás.

Isso resolve a aparência, **não a venda**: o botão continua levando ao
checkout. Quando o aulão acabar, despublique a página ou o checkout.

### A grade (`.grade`) são duas linhas do tempo, manhã e tarde

A ordem das aulas é informação — quem chega às 14h precisa saber o que já
passou. Por isso cada turno é uma linha do tempo vertical, e não uma grade de
cards: cards lado a lado destroem essa leitura, porque o olho lê em Z e a
sequência se perde.

**Por que duas colunas e não uma lista de dez linhas.** Em coluna única a
seção passava de uma tela inteira e empurrava a oferta para longe. O corte é
**no intervalo** — manhã (08h–13h, seis linhas) e tarde (14h–18h, quatro) —,
uma divisão que já existe no dia. Cortar em 5+5 no meio da lista teria partido
a tarde ao meio e a leitura viraria um Z sem sentido.

São dois `<ol>` de verdade, e não listas de divs: é o que faz um leitor de tela
anunciar *"item 3 de 6"*. O segundo traz `start="6"`, para a numeração seguir
de onde a manhã parou.

O trilho vertical é um pseudo do `<ol>` (não uma borda por item), para a linha
correr contínua e não emendar entre as aulas. A bolinha de cada item fica por
cima do trilho, com o fundo da página, para o trilho parecer passar por trás
dela.

`min-height` na `.grade__box`: *"História do RN e Aspectos Geoeconômicos"* é o
único item que ocupa duas linhas em coluna estreita, e sem ele aquela caixa
ficaria mais alta que as outras cinco da manhã.

**No mobile as colunas empilham e a coluna de horário some.** Em 320px de
largura útil, "08h00" + trilho + caixa deixavam ~150px para o nome da matéria.
O horário volta como etiqueta dentro da própria caixa (`.grade__hora--mob`) —
por isso ele aparece **duas vezes** no HTML de cada linha, e as duas precisam
ser editadas juntas. Manhã e tarde continuam separadas, com os seus títulos.

**O intervalo não é aula:** perde a caixa e vira uma linha tracejada, para o
olho contar nove blocos cheios e um vazio em vez de dez aulas.

---

## Tracking

Container GTM `GTM-PJ379FLQ`, via `sgtm.cppem.com.br` — o mesmo das outras
landings.

Como esta é uma página de **venda direta** e não tem formulário de captura,
**não existe emissor de Lead aqui**. Os cliques de compra empurram um evento
próprio (`clique_checkout`) para o `dataLayer`, com `produto` e `destino`
(`checkout` ou `whatsapp`). É telemetria de botão, não conversão — não conflita
com a regra de Lead do painel usada nas landings de captura
(`C:\Projetos\pmpe\TRACKING.md`, Modelo A).

Os três botões mandam `produto` diferente (`Ingresso A`, `Ingresso A (CTA
final)`, `Ingresso A (dock)`) de propósito: é assim que dá para ver **qual CTA
converte** sem precisar de um evento por botão.

---

## Publicação

Ainda não existe repositório nem projeto no Vercel para esta página.

### `outputDirectory` não é opcional

O `vercel.json` traz `"outputDirectory": "."` e ele **precisa** estar ali. Sem
essa linha, o preset "Other" do Vercel adota a pasta `public/` como raiz do
site sempre que ela existe — e como o `index.html` mora na raiz do projeto, o
deploy sobe só os assets: `/logo-cppem.png` responde 200 e a home responde
`NOT_FOUND`.

Não dá para explicar isso dentro do arquivo: o `vercel.json` é validado contra
um schema estrito e rejeita chaves desconhecidas, inclusive uma chave `"//"`
usada como comentário.

### A URL `*.vercel.app` pede login — é esperado

O Vercel aplica *Standard Protection* às URLs geradas automaticamente. Domínio
próprio apontado para produção não é protegido. Ou seja: a página só fica
aberta ao público quando o domínio final for apontado.

---

## Testar localmente

O `mask-image` da logo no cabeçalho **não funciona em `file://`** — o Chrome
bloqueia máscaras que apontam para outro arquivo local, e a logo some. Não é
bug: em produção (HTTP) funciona, como nos demais projetos. Para conferir
localmente, sirva por HTTP:

```bash
python -m http.server 8791
# http://localhost:8791/
```
