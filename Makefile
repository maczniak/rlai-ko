#!/bin/sh

TARGET=rlai-ko

${TARGET}.pdf: $(wildcard *.tex) $(wildcard *.bib)
	rm -f *.aux ${TARGET}.bbl
	pdflatex ${TARGET}
	biber ${TARGET}
	pdflatex ${TARGET}
	pdflatex ${TARGET}

clean:
	rm -f *.aux ${TARGET}.bbl ${TARGET}.bcf ${TARGET}.blg ${TARGET}.log ${TARGET}.pdf ${TARGET}.run.xml ${TARGET}.toc

