import { connect } from 'react-redux';
import React from 'react';
import ReactPlayer from 'react-player';
import { locToUrl, calcDisplaySize } from '../common/util';

class PreviewVideo extends React.Component {
  static propTypes = {
    dispatch: React.PropTypes.func,
    loc: React.PropTypes.object,
    preview: React.PropTypes.object,
  };

  render() {
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

    const outWidth = window.document.documentElement.clientWidth;
    const outHeight = window.document.documentElement.clientHeight;
    const displaySize = calcDisplaySize(outWidth, outHeight, outWidth, outHeight);
    preStyle.width = `${displaySize.width}px`;
    preStyle.height = `${displaySize.height}px`;
    preStyle.left = `${(outWidth - displaySize.width) / 2}px`;
    preStyle.top = `${(outHeight - displaySize.height) / 2}px`;

    const captionY = (outHeight - displaySize.height) / 2 + displaySize.height;
    captionStyle.top = `${captionY}px`;

    const fullpath = locToUrl(this.props.loc);
    const src = `${API_HOST}/api/download${fullpath}/${this.props.preview.name}`;

    return (
      <div>
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
});

export default connect(mapStateToProps)(PreviewVideo);
