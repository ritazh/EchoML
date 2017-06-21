import { connect } from 'react-redux';
import React from 'react';
import ReactPlayer from 'react-player';
import { locToUrl, calcDisplaySize } from '../common/util';

class PreviewVideo extends React.Component {
  static propTypes = {
    dispatch: React.PropTypes.func,
    loc: React.PropTypes.object,
    preview: React.PropTypes.object,
    containers: React.PropTypes.array,
    storageaccount: React.PropTypes.string,
  };

  render() {
    const preImgStyle = {
      position: 'absolute',
      width: '100%',
      textAlign: 'center',
      color: '#ccc',
    };
    const preStyle = {
      position: 'relative',
      display: 'block',
      overflow: 'hidden',
    };
    const captionStyle = {
      position: 'absolute',
      width: '100%',
      textAlign: 'center',
      color: '#ccc',
    };
    const imageStyle = {
      position: 'relative',
      display: 'block',
      left: '400px',
      top: '40px',
    };

    const outWidth = window.document.documentElement.clientWidth;
    const outHeight = window.document.documentElement.clientHeight;
    const displaySize = calcDisplaySize(outWidth, outHeight, outWidth, outHeight);
    preStyle.width = `${displaySize.width}px`;
    preStyle.height = `${displaySize.height}px`;
    preStyle.left = `${(outWidth - displaySize.width) / 2}px`;
    preStyle.top = `${(outHeight - displaySize.height) / 2}px`;

    const captionY = (outHeight - displaySize.height) / 2 + displaySize.height;
    captionStyle.top = `${captionY}px`;
    const preImgStyleY = (outHeight - displaySize.height) / 2;
    preImgStyle.top = `${preImgStyleY}px`;

    const fullpath = locToUrl(this.props.loc);
    let index = fullpath.lastIndexOf('/');
    let containerName = this.props.containers[fullpath.substring(index+1)];
    
    const src = `https://${this.props.storageaccount}.blob.core.windows.net/${containerName}/${this.props.preview.name}`;
    let imageFileName = this.props.preview.name.substring(0, this.props.preview.name.lastIndexOf('.'));

    const imgsrc = `https://${this.props.storageaccount}.blob.core.windows.net/${containerName}/${imageFileName}.png`;
    console.log(imgsrc)
    
    return (
      <div>
        <div style={preImgStyle}>
          <img
              style={imageStyle}
              src={imgsrc}
              alt={this.props.preview.name}
            />
        </div>
        <div style={preStyle}>
          <ReactPlayer
            url={src}
            width={displaySize.width}
            height={displaySize.height}
            playing
            controls
          />
        </div>
        <div style={captionStyle}>
          {this.props.preview.name}
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  loc: state.loc,
  preview: state.preview,
  containers: state.containers,
  storageaccount: state.storageaccount,
});

export default connect(mapStateToProps)(PreviewVideo);
