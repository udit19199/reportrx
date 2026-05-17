.PHONY: all clean view

PDF := main.pdf

all: $(PDF)

$(PDF): main.tex chapters/*.tex frontmatter/*.tex
	latexmk -pdfxe $<

clean:
	latexmk -c

view: $(PDF)
	open $(PDF)
