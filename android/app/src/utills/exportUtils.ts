/**
 * Robust Export Utility for React Native
 * 
 * Features:
 * - Unique filename generation (prevents overwrites)
 * - Support for selected rows export
 * - Multiple export attempts (works every time)
 * - Better error handling
 * - Consistent behavior across the app
 */

import { format } from 'date-fns';
import RNFS from 'react-native-fs';
import { Platform, Alert, Share, PermissionsAndroid, Linking } from 'react-native';
import * as XLSX from 'xlsx';

// Try to import react-native-share if available
let ShareModule: any = null;
try {
  ShareModule = require('react-native-share').default;
} catch (e) {
  console.log('react-native-share not available, using built-in Share API');
}

export interface ExportColumn {
  key: string;
  header: string;
  width?: number; // Optional custom width
}

export interface ExportOptions {
  filename: string;
  columns: ExportColumn[];
  rows: any[];
  sheetName?: string; // Optional sheet name (default: 'Sheet1')
  includeTimestamp?: boolean; // Add timestamp to filename (default: true)
  allowOverwrite?: boolean; // Allow overwriting existing files (default: false)
}

/**
 * Request storage permission on Android
 */
const requestStoragePermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return true; // iOS doesn't need explicit permission for app directories
  }

  try {
    // For Android 13+, we might not need this, but for older versions:
    if (Platform.Version < 33) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: 'Storage Permission',
          message: 'App needs access to storage to save export files',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true; // Android 13+ doesn't need this permission
  } catch (err) {
    console.warn('Permission request error:', err);
    return true; // Continue anyway
  }
};

/**
 * Generate a unique filename with timestamp
 */
const generateUniqueFilename = (
  baseFilename: string,
  includeTimestamp: boolean = true,
  allowOverwrite: boolean = false
): string => {
  let filename = baseFilename;
  
  // Remove extension if present
  const extMatch = filename.match(/\.(xlsx|csv)$/i);
  const extension = extMatch ? extMatch[0] : '.xlsx';
  const baseName = filename.replace(/\.(xlsx|csv)$/i, '');

  if (includeTimestamp && !allowOverwrite) {
    // Add timestamp to make filename unique
    const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
    filename = `${baseName}_${timestamp}${extension}`;
  } else if (!filename.endsWith(extension)) {
    filename = `${baseName}${extension}`;
  }

  return filename;
};

/**
 * Get the appropriate directory for saving files
 */
const getExportDirectory = (): string => {
  if (Platform.OS === 'android') {
    // Try Downloads directory first (Android 10+)
    if ((RNFS as any).DownloadDirectoryPath) {
      return (RNFS as any).DownloadDirectoryPath;
    }
    // Fallback to external storage Downloads
    if ((RNFS as any).ExternalStorageDirectoryPath) {
      return `${(RNFS as any).ExternalStorageDirectoryPath}/Download`;
    }
  }
  // iOS or fallback
  return RNFS.DocumentDirectoryPath;
};

/**
 * Check if file exists and handle accordingly
 */
const handleFileExists = async (filePath: string, allowOverwrite: boolean): Promise<string> => {
  const exists = await RNFS.exists(filePath);
  
  if (exists && !allowOverwrite) {
    // Generate new filename with counter
    const pathParts = filePath.split('/');
    const filename = pathParts[pathParts.length - 1];
    const dir = pathParts.slice(0, -1).join('/');
    const extMatch = filename.match(/\.(xlsx|csv)$/i);
    const extension = extMatch ? extMatch[0] : '.xlsx';
    const baseName = filename.replace(/\.(xlsx|csv)$/i, '').replace(/_\d{8}_\d{6}$/, '');
    
    let counter = 1;
    let newPath = `${dir}/${baseName}_${counter}${extension}`;
    
    while (await RNFS.exists(newPath)) {
      counter++;
      newPath = `${dir}/${baseName}_${counter}${extension}`;
    }
    
    return newPath;
  }
  
  return filePath;
};

/**
 * Robust XLSX Export Function
 * 
 * This function handles:
 * - Unique filename generation
 * - File overwrite prevention
 * - Multiple export attempts
 * - Better error handling
 * - Consistent behavior
 */
export const exportToXlsx = async (options: ExportOptions): Promise<{ success: boolean; filePath?: string; error?: string }> => {
  try {
    const {
      filename,
      columns,
      rows,
      sheetName = 'Sheet1',
      includeTimestamp = true,
      allowOverwrite = false,
    } = options;

    // Validate inputs
    if (!rows || rows.length === 0) {
      Alert.alert('Export Error', 'No data to export');
      return { success: false, error: 'No data to export' };
    }

    if (!columns || columns.length === 0) {
      Alert.alert('Export Error', 'No columns defined for export');
      return { success: false, error: 'No columns defined' };
    }

    // Request permission (Android)
    const hasPermission = await requestStoragePermission();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Storage permission is required to export files');
      return { success: false, error: 'Permission denied' };
    }

    // Generate unique filename
    const uniqueFilename = generateUniqueFilename(filename, includeTimestamp, allowOverwrite);

    // Build data array
    const data = rows.map((row, index) => {
      const obj: Record<string, any> = {};
      columns.forEach(col => {
        const value = row[col.key];
        // Handle null/undefined values
        obj[col.header] = value === undefined || value === null ? '' : String(value);
      });
      return obj;
    });

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Set column widths
    const colWidths = columns.map(col => {
      if (col.width) {
        return { wch: col.width };
      }
      const headerLen = col.header ? col.header.length : 10;
      const maxContentLen = Math.max(
        ...data.map(row => String(row[col.header] || '').length),
        headerLen
      );
      return { wch: Math.max(12, Math.min(maxContentLen + 4, 50)) }; // Max width 50
    });
    (worksheet as any)['!cols'] = colWidths;

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Generate workbook as base64
    const wbout = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });

    // Get export directory
    const baseDir = getExportDirectory();
    
    // Ensure directory exists
    const dirExists = await RNFS.exists(baseDir);
    if (!dirExists) {
      await RNFS.mkdir(baseDir);
    }

    // Build file path
    let filePath = `${baseDir}/${uniqueFilename}`;
    
    // Handle file exists
    filePath = await handleFileExists(filePath, allowOverwrite);

    // Write file
    await RNFS.writeFile(filePath, wbout, 'base64');

    // Share file - Use proper file sharing for Android
    try {
      if (Platform.OS === 'android') {
        // For Android, get the absolute file path
        const androidPath = filePath.startsWith('file://') ? filePath.replace('file://', '') : filePath;
        
        // Verify file exists before sharing
        const fileExists = await RNFS.exists(androidPath);
        if (!fileExists) {
          throw new Error('File was not created successfully');
        }

        // Get file stats to verify
        const stats = await RNFS.stat(androidPath);
        console.log('✅ File created successfully:', {
          path: androidPath,
          size: stats.size,
          isFile: stats.isFile(),
        });

        // For Android, Share API needs proper file URI format
        // Remove any double slashes and ensure proper format
        const cleanPath = androidPath.replace(/\/+/g, '/');
        const fileUri = `file://${cleanPath}`;
        
        console.log('📤 Attempting to share file:', {
          originalPath: filePath,
          androidPath: androidPath,
          cleanPath: cleanPath,
          fileUri: fileUri,
          fileExists: fileExists,
        });

        // Try using react-native-share first (better file support), fallback to built-in Share
        try {
          if (ShareModule) {
            // Use react-native-share for better file sharing support
            console.log('📤 Using react-native-share for file export');
            await ShareModule.open({
              url: fileUri,
              type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              filename: uniqueFilename,
              title: uniqueFilename,
            });
            console.log('✅ File shared successfully via react-native-share');
            return { success: true, filePath };
          } else {
            // Fallback to built-in Share API
            console.log('📤 Using built-in Share API for file export');
            const shareOptions: any = {
              url: fileUri,
              type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              title: uniqueFilename,
            };

            console.log('📤 Share options:', shareOptions);
            const shareResult = await Share.share(shareOptions);

            if (shareResult.action === Share.sharedAction) {
              console.log('✅ File shared successfully via Share API');
              return { success: true, filePath };
            } else if (shareResult.action === Share.dismissedAction) {
              // User dismissed share sheet - file is still created
              console.log('ℹ️ Share dismissed, but file created');
              Alert.alert(
                'Export Complete',
                `File exported successfully!\n\nFilename: ${uniqueFilename}\n\nLocation: Downloads folder\n\nYou can find it in your file manager.`
              );
              return { success: true, filePath };
            }
          }
        } catch (innerShareError: any) {
          console.log('⚠️ Share API failed, trying alternative method:', innerShareError);
          
          // Alternative: Try to open the file directly or show location
          // The file is created, so we'll inform the user
          Alert.alert(
            'Export Complete',
            `File exported successfully!\n\nFilename: ${uniqueFilename}\n\nLocation: Downloads folder\n\nPath: ${androidPath}\n\nYou can find it in your Downloads folder using a file manager.`,
            [
              {
                text: 'Open Downloads',
                onPress: async () => {
                  try {
                    // Try to open Downloads folder
                    await Linking.openURL('content://com.android.externalstorage.documents/document/primary%3ADownload');
                  } catch (e) {
                    console.log('Could not open Downloads folder');
                  }
                },
              },
              { text: 'OK' },
            ]
          );
          return { success: true, filePath };
        }
      } else {
        // iOS sharing
        const shareOptions = {
          url: filePath,
          message: `Exported data: ${uniqueFilename}`,
        };

        const shareResult = await Share.share(shareOptions);

        if (shareResult.action === Share.sharedAction) {
          return { success: true, filePath };
        } else if (shareResult.action === Share.dismissedAction) {
          Alert.alert(
            'Export Complete',
            `File exported successfully!\n\nFilename: ${uniqueFilename}`
          );
          return { success: true, filePath };
        }
      }
    } catch (shareError: any) {
      // Share failed, but file was created
      console.error('❌ Share error:', shareError);
      
      // File was created successfully, just inform user
      Alert.alert(
        'Export Complete',
        `File exported successfully!\n\nFilename: ${uniqueFilename}\n\nFile saved to:\n${filePath}\n\nYou can find it in your Downloads folder using a file manager.`
      );
      return { success: true, filePath };
    }

    return { success: true, filePath };
  } catch (error: any) {
    console.error('XLSX export failed:', error);
    const errorMessage = error?.message || 'Unknown error occurred';
    Alert.alert('Export Error', `Failed to export file: ${errorMessage}`);
    return { success: false, error: errorMessage };
  }
};

/**
 * Export Selected Rows
 * 
 * Helper function to export only selected rows from a dataset
 */
export const exportSelectedRows = async (
  options: ExportOptions & { selectedRows: any[] }
): Promise<{ success: boolean; filePath?: string; error?: string }> => {
  const { selectedRows, ...exportOptions } = options;

  if (!selectedRows || selectedRows.length === 0) {
    Alert.alert('Export Error', 'No rows selected for export');
    return { success: false, error: 'No rows selected' };
  }

  return exportToXlsx({
    ...exportOptions,
    rows: selectedRows,
    filename: `${exportOptions.filename}_selected`,
  });
};

/**
 * Export with selection support
 * 
 * This function provides both "Export All" and "Export Selected" options
 */
export const exportWithSelection = async (
  options: ExportOptions & {
    selectedRows?: any[];
    showSelectionDialog?: boolean; // Show dialog to choose between all/selected
  }
): Promise<{ success: boolean; filePath?: string; error?: string }> => {
  const { selectedRows, showSelectionDialog = false, ...exportOptions } = options;

  // If no selected rows or showSelectionDialog is false, export all
  if (!selectedRows || selectedRows.length === 0 || !showSelectionDialog) {
    return exportToXlsx(exportOptions);
  }

  // Show dialog to choose between all and selected
  return new Promise((resolve) => {
    Alert.alert(
      'Export Options',
      `Export ${selectedRows.length} selected row(s) or all ${exportOptions.rows.length} row(s)?`,
      [
        {
          text: 'Selected Only',
          onPress: async () => {
            const result = await exportSelectedRows({
              ...exportOptions,
              selectedRows,
            });
            resolve(result);
          },
        },
        {
          text: 'Export All',
          onPress: async () => {
            const result = await exportToXlsx(exportOptions);
            resolve(result);
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => resolve({ success: false, error: 'Cancelled' }),
        },
      ]
    );
  });
};

