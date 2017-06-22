# EchoML

A web app to play, visualize, and label audio files.

## Screenshot

![List of containers and files](images/files.png)

![Play and visualize an audio file](images/audio.png)

## Generate fft Visualization

To generate fft visualization files for your audio files, copy the fft folder into a file directory with your audio files. Run the following to generate a fft visualization for each audio file:

```bash
python fft/convert.py

```
## Run

### Set ENV variables

Set ENV variables for Azure Storage account. You can add the following to your `nodemon.json`:

```json
{
  "env": {
    "AZURE_STORAGE_ACCOUNT": "",
    "AZURE_STORAGE_ACCESS_KEY": ""
  }
}
```

### Sample config file

config/development.json or config/production.json

```json
{
  "auth": {
    "keys": ["some secret"],
    "account": "test",
    "password": "test"
  }
}

```
### Install GraphicsMagick

MacOS 
```bash
brew install graphicsmagick
```
### Development

Start back-end node server.
```bash
npm run dev-back
```

Start webpack dev server to serve webpack bundle.
```bash
npm run dev-front
```

Open your browser and connect to http://localhost:5001.

### Production

Build bundle.
```bash
npm run build
```

Start server.
```bash
npm start
```

Open your browser and connect to http://localhost:5000.
