# EchoML

Play, visualize, and annotate your audio files

## Screenshot

![List of containers and files](images/files.png)

![Play, visualize, and annotate your audio files](images/audio.png)

## Run

### Supported storage providers

Azure blob storage

### Set ENV variables

For Azure blob storage: set ENV variables for the Azure Storage account. You can add the following to your `nodemon.json`:

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


## Acknowledgement

Leverage the awesome [waveform-playlist](https://www.npmjs.com/package/waveform-playlist) module created by @naomiaro. 

## License

[MIT License](http://doge.mit-license.org)