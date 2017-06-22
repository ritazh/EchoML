# EchoML

A web app to play, visualize, and label audio files.

## Screenshot

![List of containers and files](images/files.png)

![Play and visualize an audio file](images/audio.png)

## Run

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
