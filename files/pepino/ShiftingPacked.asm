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

;Comment this macro to disable Shiting Decode Frame. It will become an incremental packer
%define SHIFTDECODEFRAME

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
;Original cyphered data (xor with key)
dataSave db 0x9D,0x97,0x9C,0x89,0x97,0xE3,0x84,0x91,0x89,0xFE,0x9C,0xAD,0xA7,0xDE,0xB4,0xBB,0xB3,0x9E,0xF2,0x82,0xBD,0xCC,0xAC,0xBD,0xF0,0xC8,0xB8,0xBB,0xDE,0xDD,0xB7,0xB0,0xED,0xC9,0x9F,0xFB,0xBA,0x83,0xA5,0xA6,0xBB,0xAD,0xC0,0xDE,0xDE,0xAD,0xC0,0xDE,0xDE,0xAD,0xC0,0xDE,0xDE,0xAD,0xC0,0xDE,0xDE,0xAD,0xC0,0xDE,0xDE,0xAD,0xC0,0xDE,0xDE,0xAD,0xC0,0xDE,0xDE,0xAD,0xC0,0xDE,0xDE,0xAD,0xC0,0xDE,0xDE,0xAD,0xC0,0xDE,0xDE,0xAD,0xC0,0xDE,0xDE,0xAD,0xC0,0xDE,0xDE,0xAD,0xC0,0xDE,0xDE,0xAD,0xC0,0xDE,0xDE,0xAD,0xC0,0xDE,0xDE,0xAD,0xC0,0xDE,0xDE,0xAD,0xC0,0xDE,0xDE,0xAD,0xC0,0xDE,0xDE,0xAD,0xC0,0xDE,0xDE,0xAD,0xC0,0xDE,0xDE,0xAD,0xC0,0xDE,0xDE,0xAD,0xC0,0xDE,0xDE,0xAD,0xC0,0xDE,0xDE,0xAD,0xC0,0xDE,0xDE,0xAD,0xC0,0xDE,0xDE,0xAD,0x8B,0xBB,0xAC,0xC3,0xA5,0xB2,0xED,0x9F,0xEE,0xBA,0xB2,0xC1,0xC0,0xAB,0xAD,0xC8,0xB2,0xED,0xEC,0x83,0xA4,0xB2,0xB2,0xAD,0x83,0xB1,0xAE,0xD4,0x86,0xB7,0xB2,0xC8,0x81,0xDE,0xA9,0xDE,0xB0,0xAC,0xB7,0xC3,0xB4,0xB8,0x9F,0xAD,0xC0,0xDE,0xDE,0xAD,0xC0,0xDE,0xDE,0xAD,0xC0,0xDE,0xDE,0xAD,0xC0,0xDE,0xDE,0xAD,0xD7,0xDE,0xDE,0xAD
;4 bytes for each memory block to decrypt. Each 4 bytes contain the number of bytes of the corresponding block
codeBlocks db 0xD5,0xDE,0xDE,0xAD,0xD0,0xDE,0xDE,0xAD,0xD6,0xDE,0xDE,0xAD,0xD8,0xDE,0xDE,0xAD,0xCB,0xDE,0xDE,0xAD,0xD1,0xDE,0xDE,0xAD,0xCA,0xDE,0xDE,0xAD,0xD4,0xDE,0xDE,0xAD
;'End token' for codeBlocks. Only useful for parsing the list of codeBlocks
codeBlockEnd dd 0
;Variables to store initial address and size of the last code block decrypted in order to erase it
lastDecryptedBlockAddress dd 0
lastDecryptedBlockSize dd 0
key db 0xDE,0xAD,0xC0,0xDE
keyIndex dd 0
;Original cyphered code (xor with key)
codeSave db 0xB6,0x23,0xD0,0x9E,0xDE,0x52,0xD5,0x8A,0xEE,0xED,0xC0,0x7D,0x64,0xBD,0x80,0xDE,0xB6,0x36,0xD0,0x9E,0xDE,0x52,0xD5,0x8A,0xEE,0xED,0xC0,0x7D,0x60,0xBD,0x80,0xDE,0xB6,0xB,0xD0,0x9E,0xDE,0x52,0xF5,0x64,0xCE,0xED,0xC0,0x21,0xCB,0xF5,0xF0,0x9E,0xDE,0xE,0x2,0xCE,0x9E,0xAD,0xA8,0x6E,0xCE,0xED,0xC0,0x21,0xEB,0x13,0xD0,0x9E,0xDE,0x52,0xD5,0x86,0xEE,0xED,0xC0,0x7D,0x18,0xBD,0x80,0xDE,0x55,0xA0,0xA,0xCE,0x9E,0xAD,0x91,0x8F,0xB6,0xB0,0xD0,0x9E,0xDE,0xC5,0xEA,0xCE,0x9E,0xAD,0x3F,0xCB,0x18,0xBD,0x80,0xDE,0x5F,0x69,0xCC,0xDE,0xDE,0xAD,0xA8,0xDE,0xDE,0xAD,0xC0,0xB6,0xF4,0xBD,0x80,0xDE,0xB6,0xAD,0xD0,0x9E,0xDE,0x52,0xD5,0x1C,0xCE,0xED,0xC0,0x87,0x3C,0x7D,0xA8,0xDE,0xDE,0xAD,0xC0,0x21,0xCB,0xE1,0xF0,0x9E,0xDE,0x3D
;'End token' for the cyphered code.
codeEnd  db 0x00

section code use32

;REGION FOR THE CODE, FILLED WITH INVALID OPCODES (0xFE)

codeRegion times codeEnd-codeSave db 0FEh

..start: 		

;Save initial context
				pushad 
				pushfd 
				
;set up the exception to handle the protected code
				push dword LoadBlock 
				push dword 1
				call [AddVectoredExceptionHandler]
				
;Unpack the data
				mov esi, dataSave
				mov ecx,codeBlockEnd-dataSave
				mov edi,esi
				
;Call to decryt routine
				push dword keyIndex
				push dword key
				push ecx
				push edi
				push esi
				call decrypt

;Reset the encryption key index to decrypt the code
				mov [keyIndex], dword 0
				
;Load initial context
				popfd
				popad
				
;Jump the original code (filled with 0xFE)
				jmp codeRegion	


;ROUTINE TO HANDLE THE EXCEPTION (INVALID OPCODE, 0xFE). DECRYPTS AND LOADS THE NECESSARY BLOCK INTO MEMORY AND ERASES THE PREVIOUS ONE
;======================================================================================================================================
LoadBlock:	;preserve edi and esi
			push edi
			push esi
			
			;obtain the address where the exception was produced
			mov eax,[ebp] 
			add eax, 024h
			mov eax,[eax]
			;push the return address into the stack
			push eax
			
;Erase the last decrypted block (fill with FE)
%ifdef SHIFTDECODEFRAME
			cmp [lastDecryptedBlockAddress],dword 0
			je cont
			mov edi,[lastDecryptedBlockAddress]
			mov al, byte 0FEh
			mov ecx,[lastDecryptedBlockSize]
			rep stosb
cont:
%endif
			

;Calculate the block that contains the address that generated the exception			
searchLoopInit:		
			mov esi, dword codeBlocks
			mov eax,codeRegion
searchLoop:	mov edx,[esi]
			;check if it is the last block (Some error ocurred)
			cmp edx,0
			je lastblock
			
			;calculate the last address covered by the current block
			;and check if it is Greater or Equal than the address that generated the exception
			add eax,edx
			cmp eax,[esp]
			jg endLoop
			;if the block was not found, then repeat loop
			add esi,dword 4
			jmp searchLoop
lastblock:  ;some type of error ocurred, exit
			push dword 1
			call [ExitProcess]
endLoop:	;if the block was found, then calculate the start address and size of the block
			
;Calculate start address, end address, size of the block.

			;size of the block is in edx, we copy it to ecx
			mov ecx,edx
			;the end address (of the executing region (codeRegion)) is the value stored in eax. We substract the size to that address
			;in eax we have the start address of the block in the executing region
			sub eax,edx
			;copy that address to edi
			mov edi,eax
			
			;we calculate the start address for the source (packed) code.
			;first, calculate the offset
			sub eax,codeRegion
			;store the offset temporarily in the stack
			push eax
			
			;use the offset to calculate the appropiate key index for decryption
			;clear most significant bits of the dividend
			xor edx,edx
			;use the stack to store the divisor
			push dword keyIndex-key
			div dword [esp]
			add esp,4
			;the remainder stored in EDX is the keyIndex to use
			mov [keyIndex], edx
			
			;Calculate the address where the original (cyphered) code is present.
			;get the offset from the stack.
			pop eax
			add eax,codeSave
			;and copy it to esi
			mov esi,eax
			
;Store start address of the code block (to execute) and the size in order to erase it in the next decrypting run.

			mov [lastDecryptedBlockAddress],edi
			mov [lastDecryptedBlockSize],ecx

;Call to decryption routine

			push dword keyIndex
			push dword key
			push ecx
			push edi
			push esi
			call decrypt
			
;Finalize procedure, reload registers and update stack pointer		
	
			;pop the return address
			add esp,4
					
			;preserve edi and esi
			pop esi
			pop edi
			;return from exception with code -1 (continue)
			mov eax, dword -1
			ret
			
			
;STDCALL decrypt function
;============================================================================================================================

;Returns 0 if decryption went ok.

;dword STDCALL decrypt(
;  in LPCTSTR byteBufferSource
;  in LPCTSTR byteBufferDestiny
;  in dword length    
;  in LPCTSTR key        
;  in LPCTSTR key_index      
;);

decrypt:	;update ebp
			push ebp
			mov ebp,esp
			;preserve esi and edi
			push esi
			push edi
			
			;ByteBuffers
			mov esi, [ebp + 8]
			mov edi, [ebp + 12]
			mov ecx, [ebp + 16]
			
			;save in the stack the key index
			mov edx, [ebp + 24]
			push dword [edx]

decryptLoop:
			
			;calculate in edx the index address for the key
			mov edx, [ebp + 20]
			add edx, [esp]
			
			;decrypt
			mov al,byte [esi]
			xor al, byte[edx]
			mov [edi],al
			
			;inc key index
			inc dword [esp]
			cmp [esp],dword keyIndex-key
			jne updateKeyIndexCont
			mov [esp], dword 0
updateKeyIndexCont:
			;inc code pointers
			inc esi
			inc edi

			loop decryptLoop
			
			;update key index in memory from stack
			mov edx, [ebp + 24]
			mov eax, dword [esp]
			mov [edx], eax
			add esp,4
			
			;preserve esi and edi
			pop edi
			pop esi
			
			
			;update esp and ebp
			mov esp,ebp
			pop ebp
			
			;remove parameters from stack
						
			retn 20