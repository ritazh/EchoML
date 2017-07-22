from scikits.audiolab import Sndfile
import matplotlib.pyplot as plt
import os

dt = 0.05
Fs = int(1.0/dt)

print 'started...'
current_dir = os.path.dirname(__file__)
print current_dir
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
			
			fig = plt.gcf()
			defaultSize = [6.4, 4.8]
			# modify height_ratio to change the height of the generated graph file
			width_ratio = 1.58
			height_ratio = 3.26
			fig.set_size_inches( (defaultSize[0]*width_ratio, defaultSize[1]/height_ratio) )
			print fig.get_size_inches()
			fig.savefig(outputfile, bbox_inches='tight', pad_inches=0) 