import React from 'react';
import FontAwesome from 'react-fontawesome';
import path from 'path';

const icons = {
  archive: 'file-archive-o',
  audio: 'file-audio-o',
  code: 'file-code-o',
  excel: 'file-excel-o',
  image: 'file-image-o',
  pdf: 'file-pdf-o',
  powerpoint: 'file-powerpoint-o',
  text: 'file-text-o',
  video: 'file-video-o',
  word: 'file-word-o',
};

// from https://github.com/spatie/font-awesome-filetypes
const extensions = {
  '.gif': icons.image,
  '.jpeg': icons.image,
  '.jpg': icons.image,
  '.png': icons.image,

  '.pdf': icons.pdf,

  '.doc': icons.word,
  '.docx': icons.word,

  '.ppt': icons.powerpoint,
  '.pptx': icons.powerpoint,

  '.xls': icons.excel,
  '.xlsx': icons.excel,

  '.aac': icons.audio,
  '.mp3': icons.audio,
  '.ogg': icons.audio,

  '.avi': icons.video,
  '.flv': icons.video,
  '.mkv': icons.video,
  '.mp4': icons.video,

  '.gz': icons.zip,
  '.zip': icons.zip,

  '.css': icons.code,
  '.html': icons.code,
  '.js': icons.code,
};

const fileStyle = {
  display: 'inline-block',
  width: '40px',
  height: '40px',
  margin: '5px',
  borderRadius: '20px',
  lineHeight: '40px',
  textAlign: 'center',
  color: 'white',
  fontSize: '20px',
  background: 'gray',
};

const dirStyle = {
  ...fileStyle,
  background: '#337ab7',
};

export default class File extends React.Component {
  static propTypes = {
    directory: React.PropTypes.bool,
    filename: React.PropTypes.string,
    selected: React.PropTypes.bool,
    onClick: React.PropTypes.func,
  };

  render() {
    let style = fileStyle;
    if (this.props.directory) {
      style = dirStyle;
    }

    let name = 'file-o';
    if (this.props.selected) {
      name = 'check';
    } else if (this.props.directory) {
      name = 'folder-o';
    } else {
      name = extensions[path.extname(this.props.filename)];
      if (!name) {
        name = 'file-o';
      }
    }

    return (
      <div style={style} onClick={this.props.onClick}>
        <FontAwesome name={name} />
      </div>
    );
  }
}
