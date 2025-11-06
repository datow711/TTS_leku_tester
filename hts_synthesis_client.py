# !/usr/bin/env python
# _*_coding:utf-8_*_

# 給任何使用這支程式的人：這支程式是國台語合成的API的client端。具體上會發送最下方變數data
# 給伺服器，並接收一個回傳的wav檔，output.wav

#客戶端 ，用來呼叫service_Server.py
import socket
import struct
import argparse

class TTSClient:
    def __init__(self):
        self.host = "140.116.245.157"

    ### Don't touch
    def askForService(self, data:str, file_name:str):
        '''
        Ask TTS server.
        Params:
            data        :(str) Text to be synthesized.
            file_name   :(str) File name to be stored.
        '''
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        try:
            if not len(data):
                raise  ValueError ( "Length of data must be bigger than zero")

            sock.connect((self.host, self.__port))
            msg = bytes(self.__token + "@@@"+ data +'@@@'+ self.__model+'@@@'+ self.language, "utf-8")
            msg = struct.pack(">I", len(msg)) + msg
            sock.sendall(msg)

            if 'pinyin' in self.language:
                l = sock.recv(8192)
                l = l.decode('UTF-8').lstrip().rstrip()
                print(l)
                return l
            else:
                with open(file_name,'wb') as f:
                    while True:
                        l = sock.recv(8192)
                        if not l:
                            break
                        f.write(l)
                print("File received complete")

        finally:
            sock.close()

    def set_language(self, language:str, model:str):
        '''
        Set port and token by language.
        Set model by gender.
        Params:
            language    :(str) chinese \
                or taiwanese or taiwanese_sandhi or tailuo or tailuo_sandhi or hakka.
            model       :(str) HTS synthesis model name.
        '''
        self.language = language
        print(language, model)

        if language == 'chinese':
            self.__port = 10015
            self.__token = "mi2stts"
            self.__model = 'M60'

        elif language == 'taiwanese' or language == 'tailuo':
            self.__port = 10011
            self.__token = "mi2stts"
            self.__model = model

        elif language == 'taiwanese_sandhi' or language == 'tailuo_sandhi':
            self.__port = 10012
            self.__token = "mi2stts"
            self.__model = model

        elif 'hakka' in language:
            self.__port = 10010
            self.__token = "mi2stts"
            self.__model = model

        else:
            raise  ValueError ( "'language' param must be chinese \
                or taiwanese or taiwanese_sandhi or tailuo or tailuo_sandhi or hakka." )


if __name__=='__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--language', default='tailuo_sandhi', help='Language to be synthesized, \
        chinese or taiwanese or taiwanese_sandhi or tailuo or tailuo_sandhi or hakka.')
    parser.add_argument('--model', default='M10', help='HTS synthesis model name.')
    parser.add_argument('--data', default='gua2 kin1-a2-jit8 kho2-tshi3 te7-ji7-mia5', help='Text to be synthesized.') #input tailuo data
    parser.add_argument('--o', default='output2.wav', help='File name to be stored.') #output speech file
    args = parser.parse_args()
    tts_client = TTSClient()
    lang_alt = 'taiwanese'
    tts_client.set_language(language=lang_alt, model=args.model)
    # test_data = "ti7 jin5-lui7 koh4 e7-tang3 khong3-tse3 e5 「 bi7-lai5 」 ， lan2 it4-ting7 beh4 thau3-kue3 lan2 e5 ke3-tat8-kuan1 lai5 kian3-lip8 bi7-lai5 。"
    # test_data = "ti3 jin7-lui7 ko2 e3-tang3 khong2-tse3 e7 「 bi3 lai5 」 ， lan1 it8-ting7 be2 thau2-kue3 lan1 e7 ke2-tat4-kuan1 lai7 kian2-lip8 bi3-lai5"
    test_data = "台灣"
    tts_client.askForService(data = test_data, file_name=args.o)