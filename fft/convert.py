from scikits.audiolab import Sndfile
import matplotlib.pyplot as plt
import os

dt = 0.05
Fs = int(1.0/dt)

current_dir = os.path.dirname(__file__)

for (dirpath, dirnames, filenames) in os.walk(current_dir):
    for filename in filenames:
		path = os.path.join(current_dir + "/" + filename)
		print (path)
		fname, extension = os.path.splitext(path)
		print (extension)
		if extension == '.flac':
			soundfile = Sndfile(path, "r")
			signal = soundfile.read_frames(soundfile.nframes)
			plt.specgram(signal, NFFT=512, Fs=Fs)
			
			outputfile = path.replace(extension, '.png')
			print (outputfile)
			plt.savefig(outputfile) 