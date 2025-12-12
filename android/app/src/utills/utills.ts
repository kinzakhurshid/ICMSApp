
import { format } from 'date-fns';
import RNFS from 'react-native-fs';
import { Share } from 'react-native';

export const formatTimeForDisplay = (isoString: string): string => {
  return format(new Date(isoString), 'HH:mm');
};

export const formatDate = (dateString: string): string => {
  return format(new Date(dateString), 'MMM dd, yyyy');
};

// Generic CSV exporter for React Native tables – writes a file then opens share sheet
export const exportToCsv = async (options: {
  filename: string;
  columns: { key: string; header: string }[];
  rows: any[];
}) => {
  try {
    const { filename, columns, rows } = options;

    if (!rows.length) {
      return;
    }

    const header = columns.map(c => c.header).join(',');
    const csvRows = rows.map(row =>
      columns
        .map(c => {
          const value = row[c.key];
          const str = value === undefined || value === null ? '' : String(value);
          const escaped = str.replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(','),
    );
    const csvContent = [header, ...csvRows].join('\n');

    const safeName = filename.endsWith('.csv') ? filename : `${filename}.csv`;
    const path = `${RNFS.DocumentDirectoryPath}/${safeName}`;

    // Write CSV file to local document directory
    await RNFS.writeFile(path, csvContent, 'utf8');

    // Open share sheet so user can save/download the file (Files, Drive, etc.)
    await Share.share({
      url: `file://${path}`,
      title: safeName,
      message: `Exported data: ${safeName}`,
    });
  } catch (error) {
    console.error('CSV export failed:', error);
  }
};

export const stringToColor = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).substr(-2);
  }
  return color;
};