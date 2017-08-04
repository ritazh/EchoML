// @flow
import { connect } from 'react-redux';
import React from 'react';
import * as actions from '../actions';
import { locToUrl, calcDisplaySize } from '../common/util';

class PreviewJpg extends React.Component {
  static propTypes = {
    dispatch: React.PropTypes.func,
    loc: React.PropTypes.object,
    preview: React.PropTypes.object,
    containers: React.PropTypes.array,
  };

  state = {
    imgSrc: '', // image src
  };

  componentDidMount() {
    this.props.dispatch(actions.startPreviewJpg(this.props.loc, this.props.preview.filename));
    this.props
      .dispatch(
        actions.downloadFile(
          this.props.preview.storageAccount,
          this.props.preview.containerName,
          this.props.preview.filename,
        ),
      )
      .then((url) => {
        this.setState({
          imgSrc: url,
        });
      });
  }

  componentWillReceiveProps(props) {
    if (this.props.preview.filename !== props.preview.name) {
      this.props.dispatch(actions.startPreviewJpg(props.loc, `${props.preview.name}?type=max800`));
    }
  }

  render() {
    if (!this.props.preview.orientation) {
      return <div />;
    }

    const imageStyle = {
      position: 'relative',
      display: 'block',
    };
    const captionStyle = {
      position: 'absolute',
      width: '100%',
      textAlign: 'center',
      color: '#ccc',
    };

    const outWidth = window.document.documentElement.clientWidth;
    const outHeight = window.document.documentElement.clientHeight;
    const { width, height } = this.props.preview.size;
    let displaySize = null;

    if (this.props.preview.orientation === 'RightTop') {
      // swap width and height
      displaySize = calcDisplaySize(outWidth, outHeight, height, width);
      imageStyle.width = `${displaySize.height}px`;
      imageStyle.transform = ' rotate(90deg)';
      imageStyle.left = `${(outWidth - displaySize.height) / 2}px`;
      imageStyle.top = `${(outHeight - displaySize.width) / 2}px`;
    } else if (this.props.preview.orientation === 'BottomRight') {
      displaySize = calcDisplaySize(outWidth, outHeight, width, height);
      imageStyle.width = `${displaySize.width}px`;
      imageStyle.transform = ' rotate(180deg)';
      imageStyle.left = `${(outWidth - displaySize.width) / 2}px`;
      imageStyle.top = `${(outHeight - displaySize.height) / 2}px`;
    } else if (this.props.preview.orientation === 'LeftBottom') {
      // swap width and height
      displaySize = calcDisplaySize(outWidth, outHeight, height, width);
      imageStyle.width = `${displaySize.height}px`;
      imageStyle.transform = ' rotate(270deg)';
      imageStyle.left = `${(outWidth - displaySize.height) / 2}px`;
      imageStyle.top = `${(outHeight - displaySize.width) / 2}px`;
    } else {
      // TopLeft or unknown
      displaySize = calcDisplaySize(outWidth, outHeight, width, height);
      imageStyle.width = `${displaySize.width}px`;
      imageStyle.left = `${(outWidth - displaySize.width) / 2}px`;
      imageStyle.top = `${(outHeight - displaySize.height) / 2}px`;
    }

    const captionY = (outHeight - displaySize.height) / 2 + displaySize.height;
    captionStyle.top = `${captionY}px`;

    return (
      <div className="PreviewJpg">
        <img style={imageStyle} src={this.state.imgSrc} alt={this.props.preview.filename} />
        <div style={captionStyle}>
          {this.props.preview.filename}
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  loc: state.loc,
  preview: state.preview,
  containers: state.containers,
});

export default connect(mapStateToProps)(PreviewJpg);
