
import { format } from 'date-fns';
import RNFS from 'react-native-fs';
import { Platform, Alert, Share } from 'react-native';
import * as XLSX from 'xlsx';

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

// Generic XLSX exporter for React Native tables – writes a real .xlsx file then opens share sheet
export const exportToXlsx = async (options: {
  filename: string;
  columns: { key: string; header: string }[];
  rows: any[];
}) => {
  try {
    const { filename, columns, rows } = options;

    if (!rows || rows.length === 0) {
      return;
    }

    // Build an array of objects keyed by header so Excel shows readable column names
    const data = rows.map(row => {
      const obj: Record<string, any> = {};
      columns.forEach(col => {
        const value = row[col.key];
        obj[col.header] = value === undefined || value === null ? '' : value;
      });
      return obj;
    });

    const worksheet = XLSX.utils.json_to_sheet(data);

    // Improve readability in Excel by setting reasonable column widths
    // Width in "wch" is roughly the number of characters that fit.
    const colWidths = columns.map(col => {
      const headerLen = col.header ? col.header.length : 10;
      // Minimum 12 chars, header length + 4 padding
      const wch = Math.max(12, headerLen + 4);
      return { wch };
    });
    (worksheet as any)['!cols'] = colWidths;
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

    // Generate workbook as base64 and write to file
    const wbout = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });

    const safeName = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;

    // Prefer the public Downloads directory on Android so the file appears in Files → Downloads.
    // On iOS, fall back to the app Documents directory (visible via Files app for the app).
    const baseDir =
      Platform.OS === 'android' && (RNFS as any).DownloadDirectoryPath
        ? (RNFS as any).DownloadDirectoryPath
        : RNFS.DocumentDirectoryPath;
    const path = `${baseDir}/${safeName}`;

    await RNFS.writeFile(path, wbout, 'base64');

    // Open share sheet so user can save/download the file (Files, Drive, etc.)
    const shareResult = await Share.share({
      url: Platform.OS === 'android' ? `file://${path}` : path,
      title: safeName,
      message: `Exported employee data: ${safeName}`,
    });

    // Only show alert if sharing was cancelled or failed
    if (shareResult.action === Share.sharedAction) {
      // File was shared successfully
      console.log('File shared successfully');
    } else if (shareResult.action === Share.dismissedAction) {
      // User dismissed the share sheet, still show success message
      Alert.alert(
        'Export complete',
        `Employee data exported as "${safeName}".\n\nYou can find it in your Downloads folder.`
      );
    }
  } catch (error) {
    console.error('XLSX export failed:', error);
    Alert.alert('Export Error', 'Failed to export file. Please try again.');
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