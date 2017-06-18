from scikits.audiolab import Sndfile
import matplotlib.pyplot as plt
import os

dt = 0.05
Fs = int(1.0/dt)

current_dir = os.path.dirname(__file__)


path = os.path.join(current_dir + "/SM01_20091211_011000.flac")
print (path)
soundfile = Sndfile(path, "r")
signal = soundfile.read_frames(soundfile.nframes)
plt.specgram(signal, NFFT=256, Fs=Fs)
plt.savefig('fft/foo.png') 