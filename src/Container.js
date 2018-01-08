import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Card, { CardContent, CardHeader } from 'material-ui/Card';
import List, { ListItem, ListItemIcon, ListItemText } from 'material-ui/List';
import MusicNoteIcon from 'material-ui-icons/MusicNote';
import PhotoIcon from 'material-ui-icons/Photo';
import MovieIcon from 'material-ui-icons/Movie';
import TextIcon from 'material-ui-icons/TextFormat';
import FolderIcon from 'material-ui-icons/Folder';
import ErrorIcon from 'material-ui-icons/Error';

function getIcon(contentType) {
  let icon = <ErrorIcon />;
  if (contentType.match(/audio/i)) {
    icon = <MusicNoteIcon />;
  } else if (contentType.match(/image/i)) {
    icon = <PhotoIcon />;
  } else if (contentType.match(/video/i)) {
    icon = <MovieIcon />;
  } else if (contentType.match(/text/i)) {
    icon = <TextIcon />;
  }

  return icon;
}

function Container(props) {
  const { storageAccount, blobs, name } = props;
  const listItems = [];
  let currentPath = [];
  blobs.forEach((blob) => {
    const { contentType = '' } = blob;
    const icon = getIcon(contentType);
    const filepath = blob.name.split('/');
    filepath.forEach((node, index) => {
      const path = [...filepath].splice(0, filepath.length - 1);
      const pathString = JSON.stringify(path);
      const currentPathString = JSON.stringify(currentPath);
      if (currentPathString !== pathString) {
        currentPath = path;
      }

      if (index + 1 === filepath.length) {
        const link = (
          <Link
            to={`/${storageAccount}/${name}/${blob.name}`}
            href={`/${storageAccount}/${name}/${blob.name}`}
            key={`/${storageAccount}/${name}/${blob.name}`}
            style={{ textDecoration: 'none', color: 'black' }}
          >
            <ListItem
              button
              style={{ paddingLeft: `${currentPath.length * 2}em` }}
              key={`/${storageAccount}/${name}/${blob.name}`}
            >
              <ListItemIcon>{icon}</ListItemIcon>
              <ListItemText
                primary={node}
                secondary={`${(blob.contentLength * 0.000001).toFixed(2)} MB`}
              />
            </ListItem>
          </Link>
        );
        listItems.push(link);
      }

      // create new folder if in different path
      if (currentPathString !== pathString) {
        path.forEach((folderName) => {
          if (currentPathString.indexOf(folderName) < 0) {
            const item = (
              <ListItem
                button
                style={{ paddingLeft: `${(currentPath.length - 1) * 2}em` }}
                key={`${currentPath.join('/')}/${folderName}`}
              >
                <ListItemIcon>
                  <FolderIcon />
                </ListItemIcon>
                <ListItemText inset primary={folderName} />
              </ListItem>
            );
            listItems.push(item);
          }
        });
      }
    });
  });

  return (
    <div className="Container">
      <Card>
        <CardHeader title={props.name} subheader={props.lastModified} />
        <CardContent>
          <List dense>{listItems}</List>
        </CardContent>
      </Card>
    </div>
  );
}

Container.propTypes = {
  storageAccount: PropTypes.string.isRequired,
  blobs: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string.isRequired,
    contentLength: PropTypes.string.isRequired,
    contentSettings: PropTypes.shape({
      contentType: PropTypes.string,
    }),
  })),
  name: PropTypes.string.isRequired,
  lastModified: PropTypes.string,
};

Container.defaultProps = {
  blobs: [],
  lastModified: '',
};

export default Container;
