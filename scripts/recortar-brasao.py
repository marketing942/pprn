#!/usr/bin/env python3
"""
Recorta o fundo do brasão da Polícia Penal do RN.

Produz dois arquivos em public/:

    brasao-pprn.webp   o brasão recortado, usado no selo da hero e do CTA final
    marca-pprn.webp    o mesmo desenho em ouro monocromático, usado como
                       marca d'água de seção no styles.css

Por que existe
--------------
O original chegou como JPEG (`public/originais/pprn.jpg`), e JPEG não tem canal
alfa. O selo da hero é um hexágono com miolo escuro: colado ali, o brasão
apareceria dentro de um quadrado quase branco — a única coisa fora da paleta na
página inteira.

Como o recorte funciona
-----------------------
NÃO é um "remover branco" global. Isso furaria o desenho, que tem claro de
verdade dentro: os ramos de louro prateados, as letras brancas de "POLÍCIA" e
"PENAL", a estrela e a vela do barco. O que se faz é um flood fill a partir das
BORDAS — só o fundo conectado à moldura da imagem vira transparente, e qualquer
claro cercado por desenho fica intacto.

O limiar
--------
ATENÇÃO ao significado do `thresh` do PIL: ele NÃO é por canal. O
`ImageDraw.floodfill` compara com a SOMA das diferenças dos três canais, então
a escala vai de 0 a 765 e um "60" equivale a apenas ~20 por canal.

Este arquivo pede 110, e o número não é chute:

- o fundo é (235,235,233), um branco sujo, não branco puro;
- o brasão tem uma **sombra projetada** que desce até ~(214,216,215) — distância
  ~58 do fundo. Abaixo de 90 a sombra sobrevive e vira um halo cinza em volta do
  escudo, que sobre o preto da página fica bem visível;
- o dourado da moldura começa em ~(221,203,121) — distância ~158. Acima de 130 a
  passada começa a comer os ramos de louro prateados pela borda.

Ou seja: 110 é a faixa entre "a sombra ainda está lá" e "o desenho começou a
ser comido". Medido, não estimado — a contagem de pixels claros remanescentes
estabiliza a partir de 110 e o que sobra é conteúdo de verdade.

Uso
---
    python scripts/recortar-brasao.py

Requer Pillow e numpy:  pip install pillow numpy
"""

import pathlib
import sys

try:
    import numpy as np
    from PIL import Image, ImageDraw, ImageOps
except ImportError:
    sys.exit("Faltam dependências. Instale com: pip install pillow numpy")

RAIZ = pathlib.Path(__file__).resolve().parent.parent
PUBLIC = RAIZ / "public"
# O original não é consumido pela página e não tem por que subir junto com os
# assets que o navegador baixa.
ORIGINAIS = PUBLIC / "originais"

ORIGEM = "pprn.jpg"
SIGLA = "pprn"
THRESH = 110

# Lado máximo do arquivo gerado. O selo da hero tem no máximo 258px e mostra o
# brasão a ~72% disso — ~185px em CSS, ~555px num aparelho 3x. 600 cobre o
# retina com folga.
LADO_MAX = 600

# WebP com alfa em vez de PNG: é o formato que os outros projetos do CPPEM já
# usam, e num desenho colorido como este a diferença de peso é grande.
QUALIDADE = 90

# Cor sentinela do flood fill. Não precisa ser inédita na imagem: o que marca o
# fundo é a COMPARAÇÃO com o original (pixel que mudou = pixel preenchido).
SENTINELA = (255, 0, 255)

# Extremos da rampa da marca d'água. Batem com --gold-deep e --gold-light do
# styles.css: a marca precisa ser do mesmo ouro do resto da página.
OURO_ESCURO = (58, 46, 26)
OURO_CLARO = (222, 196, 140)


def semear(largura, altura):
    """Pontos de partida do flood fill: os quatro cantos e o meio de cada lado.

    Só os cantos não bastam — se o desenho encostar num deles, aquele canto
    vira semente dentro do desenho e o fill sairia comendo a arte."""
    w, h = largura - 1, altura - 1
    return [
        (0, 0), (w, 0), (0, h), (w, h),
        (w // 2, 0), (w // 2, h), (0, h // 2), (w, h // 2),
    ]


def recortar_fundo(origem, thresh):
    """Abre o arquivo e devolve RGBA já sem fundo."""
    bruta = Image.open(origem)

    # Arquivo que já chega com alfa não passa por flood fill nenhum: recortar
    # de novo só teria como resultado comer borda boa.
    if bruta.mode in ("RGBA", "LA") or "transparency" in bruta.info:
        return bruta.convert("RGBA")

    im = bruta.convert("RGB")

    trabalho = im.copy()
    for ponto in semear(*im.size):
        ImageDraw.floodfill(trabalho, ponto, SENTINELA, thresh=thresh)
    fundo = np.any(np.asarray(trabalho) != np.asarray(im), axis=-1)

    alfa = np.where(fundo, 0, 255).astype(np.uint8)
    return Image.fromarray(np.dstack([np.asarray(im), alfa]), "RGBA")


def marca_dagua(im):
    """Remapeia a luminância para uma rampa de ouro, preservando o alfa.

    O brasão oficial é azul, verde e dourado. Usá-lo direto como marca d'água de
    seção jogaria manchas de cor no fundo, mesmo a 4% de opacidade."""
    alfa = im.getchannel("A")
    lum = ImageOps.grayscale(im.convert("RGB"))
    saida = ImageOps.colorize(lum, black=OURO_ESCURO, white=OURO_CLARO).convert("RGBA")
    saida.putalpha(alfa)
    return saida


def encolher(im):
    if max(im.size) <= LADO_MAX:
        return im
    k = LADO_MAX / max(im.size)
    return im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)


def gravar(im, nome):
    destino = PUBLIC / nome
    im.save(destino, "WEBP", quality=QUALIDADE, method=6)
    return destino.stat().st_size // 1024


def main():
    origem = ORIGINAIS / ORIGEM
    if not origem.exists():
        sys.exit(f"{origem.relative_to(RAIZ)} não encontrado.")

    im = recortar_fundo(origem, THRESH)

    caixa = im.getbbox()             # corta a margem transparente que sobrou
    if caixa:
        im = im.crop(caixa)
    im = encolher(im)

    kb_brasao = gravar(im, f"brasao-{SIGLA}.webp")
    kb_marca = gravar(marca_dagua(im), f"marca-{SIGLA}.webp")

    print(f"  {ORIGEM:14s} -> brasao-{SIGLA}.webp  "
          f"{im.size[0]}x{im.size[1]}  {kb_brasao} KB   "
          f"(+ marca-{SIGLA}.webp {kb_marca} KB)")


if __name__ == "__main__":
    main()
