;##########################################################################################################################################
;#                                                                                                                                        #
;#                                                                                                                                        #
;#      ___         ___           ___                     ___           ___                                                               #
;#     /  /\       /  /\         /  /\      ___          /__/\         /  /\                                                              #
;#    /  /::\     /  /:/_       /  /::\    /  /\         \  \:\       /  /::\                                                             #
;#   /  /:/\:\   /  /:/ /\     /  /:/\:\  /  /:/          \  \:\     /  /:/\:\                                                            #
;#  /  /:/~/:/  /  /:/ /:/_   /  /:/~/:/ /__/::\      _____\__\:\   /  /:/  \:\                                                           #
;# /__/:/ /:/  /__/:/ /:/ /\ /__/:/ /:/  \__\/\:\__  /__/::::::::\ /__/:/ \__\:\                                                          #
;# \  \:\/:/   \  \:\/:/ /:/ \  \:\/:/      \  \:\/\ \  \:\~~\~~\/ \  \:\ /  /:/                                                          #
;#  \  \::/     \  \::/ /:/   \  \::/        \__\::/  \  \:\  ~~~   \  \:\  /:/                                                           #
;#   \  \:\      \  \:\/:/     \  \:\        /__/:/    \  \:\        \  \:\/:/                                                            #
;#    \  \:\      \  \::/       \  \:\       \__\/      \  \:\        \  \::/                                                             #
;#     \__\/       \__\/         \__\/                   \__\/         \__\/  Packer (with) Educational Purposes (for) bINary Obfuscation #
;#                                                                                                                                        #
;#                                                                                                                                        #
;# Copyright (C) 2013 																													  #
;# Xabier Ugarte-Pedrero <xabier.ugarte@deusto.es>                                                                                        #
;# Ivan Garcia-Ferreira <ivan.garcia.ferreira@deusto.es>                                                                                  #
;# Igor Santos <isantos@deusto.es>                                                                                                        #
;#                                                                                                                                        #
;# This program is free software; you can redistribute it and/or modify it under the terms of the GNU General Public                      #
;# License as published by the Free Software Foundation; either version 2 of the License, or (at your option) any later                   #
;# version.                                                                                                                               #
;#                                                                                                                                        #
;# This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied                     #
;# warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.                  #
;#                                                                                                                                        #
;# You should have received a copy of the GNU General Public License along with this program; if not, write to the Free                   #
;# Software Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA 02111-1307 USA                                                       #
;##########################################################################################################################################

;This program was assembled with NASM — The Netwide Assembler, version 0.98.36

%include "win32np.inc"

;Due to implementation details, the imports of the unpacked binary and the packed binary must be in the same order, in order to ensure that the original
;program, once unpacked, can access to the functions it needs.

extern ExitProcess
import ExitProcess kernel32.dll

extern AddVectoredExceptionHandler
import AddVectoredExceptionHandler kernel32.dll

extern LoadLibraryA 
import LoadLibraryA kernel32.dll

extern GetProcAddress
import GetProcAddress kernel32.dll

section data use32

;Data used by the original program. Due to the implementation of the decryption system and the assembler used, this data must be contained in the first section of the binary,
;using a 1000 byte alignment for the sections. This data will start, in both unpacked, and packed binaries, at address 0x40001000

Origin                 db 'C:\WINDOWS\system32\calc.exe',0
DestinyFmt				db 'pwn3d_%d.exe',0
DestinyString           times 100 db 0
Lkernel32				db 'Kernel32.dll',0
Luser32					db 'user32.dll',0
LMess					db 'CopyFileA',0
Lwsprt					db 'wsprintfA',0
Lkrnl32Handle			db 0x00,0x00,0x00,0x00
Lusr32Handle			db 0x00,0x00,0x00,0x00
cpAddr				db 0x00,0x00,0x00,0x00
prtAddr				db 0x00,0x00,0x00,0x00
rpt					dd 0x17


;Data structure to hold the sizes of the different regions of the code. These sizes will be used by the decryption routine
;to decrypt only one section at a time. The execution context will be preserved by the decryption routine.
block1 dd lbl2-..start
block2 dd lbl3-lbl2
block3 dd lbl4-lbl3
block4 dd lbl5-lbl4
block5 dd lbl6-lbl5
block6 dd lbl7-lbl6
block7 dd lbl8-lbl7
block8 dd lbl9-lbl8
endToken dd 0

;The code must start in the second section of the binary, (0x40002000) with a 1000 byte aligment for sections.

section code use32

..start: 		;Load libraries
      			push dword Lkernel32
				call [LoadLibraryA]
				mov [Lkrnl32Handle],eax
				
				;Load libraries
      			push dword Luser32
lbl2:			call [LoadLibraryA]
				mov [Lusr32Handle],eax
				
				;Load CopyFileA address
				
				push dword LMess
lbl3:			push dword [Lkrnl32Handle]
				call [GetProcAddress]
				mov [cpAddr],eax
				
				push dword Lwsprt
lbl4:			push dword [Lusr32Handle]
				call [GetProcAddress]
				mov [prtAddr],eax
				
				mov ecx,[rpt]
				
rptlbl:			push ecx
				
lbl5:			push ecx
				push DestinyFmt
				push DestinyString
lbl6:			call [prtAddr]
				add esp,0Ch
		
				push 0
lbl7:			push dword DestinyString
				push dword Origin
              
				
lbl8:			call [cpAddr]
				pop ecx
				loop rptlbl
				
				push 0
				call [ExitProcess]
lbl9:			nop
				
