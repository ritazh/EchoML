import { connect } from 'react-redux';
import React from 'react';
import * as actions from '../actions';
import { calcDisplaySize } from '../common/util';

class PreviewTxt extends React.Component {
  static propTypes = {
    dispatch: React.PropTypes.func,
    loc: React.PropTypes.object,
    preview: React.PropTypes.object,
  };

  componentDidMount() {
    this.props.dispatch(actions.startPreviewTxt(this.props.loc, this.props.preview.filename));
  }

  componentWillReceiveProps(props) {
    if (this.props.preview.filename !== props.preview.name) {
      this.props.dispatch(actions.startPreviewTxt(props.loc, props.preview.name));
    }
  }

  render() {
    if (!this.props.preview.text) {
      return <div />;
    }

    const preStyle = {
      position: 'relative',
      display: 'block',
      overflow: 'scroll',
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

    return (
      <div>
        <pre style={preStyle}>
          {this.props.preview.text}
        </pre>
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
});

export default connect(mapStateToProps)(PreviewTxt);
