import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from 'material-ui/styles';
import Drawer from 'material-ui/Drawer';
import AppBar from 'material-ui/AppBar';
import Toolbar from 'material-ui/Toolbar';
import Typography from 'material-ui/Typography';
import Divider from 'material-ui/Divider';
import Paper from 'material-ui/Paper';
import List, { ListItem, ListItemIcon, ListItemText } from 'material-ui/List';
import FolderIcon from 'material-ui-icons/Folder';
import HomeIcon from 'material-ui-icons/Home';
import { Route, Link } from 'react-router-dom';
import Container from './Container';
import NotFoundCard from './NotFoundCard';
import AudioFile from './AudioFile';
import StorageAccountCard from './StorageAccountCard';

const drawerWidth = 240;
const styles = theme => ({
  root: {
    width: '100%',
    // height: 430,
    height: '100vh',
    zIndex: 1,
    overflow: 'hidden',
  },
  appFrame: {
    position: 'relative',
    display: 'flex',
    width: '100%',
    height: '100%',
  },
  appBar: {
    position: 'absolute',
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: drawerWidth,
    overflow: 'hidden',
  },
  drawerPaper: {
    position: 'relative',
    height: '100%',
    width: drawerWidth,
  },
  drawerHeader: theme.mixins.toolbar,
  content: {
    backgroundColor: theme.palette.background.default,
    width: '100%',
    padding: theme.spacing.unit * 3,
    height: 'calc(100% - 56px)',
    marginTop: 56,
    overflow: 'scroll',
    [theme.breakpoints.up('sm')]: {
      height: 'calc(100% - 64px)',
      marginTop: 64,
    },
  },
  drawerLink: {
    textDecoration: 'none',
    color: 'black',
    opacity: 1,
  },
});

function PermanentDrawer(props) {
  const { classes, containers } = props;
  const storageAccounts = [...new Set(containers.map(container => container.account))];

  return (
    <div className={classes.root}>
      <div className={classes.appFrame}>
        <AppBar className={classes.appBar}>
          <Toolbar>
            <Typography type="title" color="inherit" noWrap>
              EchoML
            </Typography>
          </Toolbar>
        </AppBar>
        <Drawer
          type="permanent"
          classes={{
            paper: classes.drawerPaper,
          }}
        >
          <div className={classes.drawerHeader} />
          <Divider />
          <List>
            <Link className={classes.drawerLink} to="/" href="/'" key="root">
              <ListItem button>
                <ListItemIcon>
                  <HomeIcon />
                </ListItemIcon>
                <ListItemText primary="Home" />
              </ListItem>
            </Link>
            {props.containers.map(container => (
              <Link
                className={classes.drawerLink}
                to={`/${container.account}/${container.name}`}
                href={`/${container.account}/${container.name}`}
                key={container.name}
              >
                <ListItem button>
                  <ListItemIcon>
                    <FolderIcon />
                  </ListItemIcon>
                  <ListItemText primary={container.name} />
                </ListItem>
              </Link>
            ))}
          </List>
        </Drawer>
        <main className={classes.content}>
          {props.containers.map(container => (
            <div key={container.name}>
              {/* File List */}
              <Route
                exact
                // path={`/${container.account}/:container([^/]+)`}
                path={`/${container.account}/${container.name}`}
                render={() =>
                  (container ? (
                    <Container
                      storageAccount={container.account}
                      blobs={
                        Array.isArray(props.blobs[container.name])
                          ? props.blobs[container.name]
                          : []
                      }
                      name={container.name}
                      lastModified={container.lastModified}
                      key={container.name}
                    />
                  ) : (
                    <NotFoundCard heading="Container not found :(" />
                  ))
                }
              />
              {/* File View */}
              <Route
                exact
                // path={`/${container.account}/:container([^/]+)/:filename(.+)`}
                path={`/${container.account}/${container.name}/:filename(.+)`}
                render={({ match }) => {
                  const blobs = container && props.blobs[container.name];
                  const blob =
                    blobs && blobs.find(potential => potential.name === match.params.filename);
                  return container && blob ? (
                    <AudioFile
                      storageAccount={container.account}
                      container={container.name}
                      filename={match.params.filename}
                    />
                  ) : (
                    <NotFoundCard />
                  );
                }}
              />
            </div>
          ))}
          <Route
            exact
            path="/"
            render={() => (
              <div>
                <Paper
                  elevation={4}
                  style={{
                    paddingTop: 16,
                    paddingBottom: 16,
                    paddingLeft: 16,
                  }}
                >
                  <Typography type="headline" component="h3">
                    Welcome to EchoML!
                  </Typography>
                  <Typography type="body1" component="p">
                    Choose a container on the left sidebar
                  </Typography>
                  <Typography type="body1" component="p">
                    Happy Labeling!
                  </Typography>
                </Paper>
                <br />
                {/* <StorageAccountCard /> */}
              </div>
            )}
          />
        </main>
      </div>
    </div>
  );
}

PermanentDrawer.propTypes = {
  classes: PropTypes.object.isRequired,
  storageAccount: PropTypes.string.isRequired,
  containers: PropTypes.array,
  blobs: PropTypes.object,
};

PermanentDrawer.defaultProps = {
  containers: [],
  blobs: {},
};

export default withStyles(styles)(PermanentDrawer);
