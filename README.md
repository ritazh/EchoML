# EchoML

A web app to play, visualize, and label audio files.

## Screenshot

## Run

### Sample config file

config/development.json or config/production.json

```json

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
Default username/password is test/test.
