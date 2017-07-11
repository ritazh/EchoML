import moment from 'moment';
import { fileSizeIEC } from '../common/util';

const reducer = (state = [], action) => {
  switch (action.type) {
    case 'SET_FILES': {
      const files = action.files.map(file => ({
        ...file,
        size: fileSizeIEC(file.size),
        mtime: moment(file.mtime).format('YYYY-MM-DD HH:mm:ss'),
        selected: false,
      }));

      files.sort((a, b) => {
        if (a.isDirectory === b.isDirectory) {
          return a.name.localeCompare(b.name);
        } else if (a.isDirectory) {
          return -1;
        }

        return 1;
      });

      return files;
    }

    case 'TOGGLE_FILE':
      return state.map((file, index) => {
        if (index !== action.index) {
          return file;
        }

        return {
          ...file,
          selected: !file.selected,
        };
      });

    case 'SELECT_NONE':
      return state.map((file) => {
        if (!file.selected) {
          return file;
        }

        return {
          ...file,
          selected: false,
        };
      });

    default:
      return state;
  }
};

export default reducer;
