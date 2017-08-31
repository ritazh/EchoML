import path from 'path';
import { connect } from 'react-redux';
import React from 'react';
import PreviewJpg from './previewJpg';
import PreviewVideo from './previewVideo';
import PreviewTxt from './previewTxt';
import Login from './login';

class Preview extends React.Component {
  static propTypes = {
    dispatch: React.PropTypes.func,
    loc: React.PropTypes.object,
    files: React.PropTypes.array,
    preview: React.PropTypes.object,
  };

  componentDidMount() {
    window.addEventListener('keyup', this.handleKeyUp);
    // window.addEventListener('wheel', this.handleWheel);
  }

  componentWillUnmount() {
    window.removeEventListener('keyup', this.handleKeyUp);
    // window.removeEventListener('wheel', this.handleWheel);
  }

  handleClose = () => {
    this.props.dispatch({ type: 'STOP_PREVIEW' });
  };

  handleClick = (e) => {
    const outWidth = window.document.documentElement.clientWidth;
    if (e.clientX < outWidth * 2 / 3) {
      this.handleClose();
    }
  };

  handleKeyUp = (e) => {
    if (e.keyCode === 27) {
      // ESC
      this.handleClose();
    }
  };

  handleWheel = (e) => {
    e.preventDefault();
  };

  renderByExt() {
    switch (path.extname(this.props.preview.filename).toLowerCase()) {
      case '.jpg':
      case '.jpeg':
      case '.png':
        return <PreviewJpg />;
      case '.mp4':
      case '.ogv':
      case '.webm':
      case '.mp3':
      case '.flac':
        return <PreviewVideo />;
      case '.txt':
      case '.md':
      case '.js':
      case '.json':
        return <PreviewTxt />;
      default:
    }

    const outerStyle = {
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    };

    const innerStyle = {
      color: 'white',
      backgroundColor: 'black',
      padding: '10px 30px',
      borderRadius: '10px',
    };

    return (
      <div style={outerStyle}>
        <span style={innerStyle}>
          {this.props.preview.filename}: Unknown format
        </span>
      </div>
    );
  }

  render() {
    if (!this.props.preview) {
      return <div />;
    }

    if (this.props.preview.backgroundOnly) {
      return <div className="preview" />;
    }

    if (!this.props.preview.filename) {
      return <div />;
    }

    return <div className="preview">{this.renderByExt()}</div>;
  }
}

const mapStateToProps = state => ({
  loc: state.loc,
  files: state.files,
  preview: state.preview,
  router: state.router,
});

export default connect(mapStateToProps)(Preview);
