MAIN	START	1000
INLOOP	TD	INDEV
	JEQ	INLOOP
	RD	INDEV

	STA	CASE
	RD	INDEV
	COMP	ASEN
	LDX	#1
	LDT	CASE
	JEQ 	LOOP
	

LOOP	TD	INDEV2
	JEQ	LOOP
	RD	INDEV2
	STA	STACK
	LDA	#STACK
	ADD	#3
	STA	#STACK
	RD	INDEV
	COMP	ASEN
	JEQ 	LOOP
	TIXR	T
	JLT	LOOP


INDEV	BYTE	0
INDEV2	BYTE	0
CASE	RESW	1
STACK	RESW	10	
ASEN	WORD	10