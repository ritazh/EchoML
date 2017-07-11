# EchoML

Play, visualize, and annotate your audio files

## Demo
[Demo Site](http://echoml.azurewebsites.net/)

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

Set ENV for storage account.
```bash
export AZURE_STORAGE_ACCESS_KEY=
export AZURE_STORAGE_ACCOUNT=
```

Start server.
```bash
npm start
```

Open your browser and connect to http://localhost.

### Run with Docker

To update the code and rebuild the image:

Build bundle
```bash
npm run build
```

Build the docker image
```bash
docker build -t echoml .
```	

To run the image, either pull my image from docker hub or use your own.

Run the docker image
```
docker run -p 80:80 -e AZURE_STORAGE_ACCOUNT=<UPDATE THIS> -e AZURE_STORAGE_ACCESS_KEY=<UPDATE THIS> -it ritazh/echoml:latest
```

## Acknowledgement

Leverage the awesome [waveform-playlist](https://www.npmjs.com/package/waveform-playlist) module created by @naomiaro. 

## License

[MIT License](http://doge.mit-license.org)