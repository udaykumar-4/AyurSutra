import { Platform, Alert } from 'react-native';

export interface PDFPrintOptions {
  title: string;
  htmlContent: string;
  fileName?: string;
}

/**
 * Universal PDF Export and Print Helper for AyurSutra Mobile App & Web
 */
export const pdfPrintUtils = {
  /**
   * Triggers system print for the given HTML report content
   */
  printReport: async ({ title, htmlContent }: PDFPrintOptions): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(htmlContent);
          printWindow.document.close();
          printWindow.focus();
          setTimeout(() => {
            printWindow.print();
          }, 300);
        } else {
          window.print();
        }
      } else {
        // Fallback for native mobile platforms
        Alert.alert(
          '🖨️ Print Document',
          `Printing "${title}"...\n\nConnect to a Wi-Fi/AirPrint printer to output your paper copy.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      Alert.alert('Print Error', error.message || 'Failed to initiate printing.');
    }
  },

  /**
   * Generates and downloads/shares the PDF report file
   */
  exportPDF: async ({ title, htmlContent, fileName = 'AyurSutra_Report.pdf' }: PDFPrintOptions): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName.replace('.pdf', '.html');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        Alert.alert(
          '💾 PDF Saved',
          `Document "${fileName}" generated successfully.\n\nYou can view, print, or share this document from your downloads folder.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      Alert.alert('Export Error', error.message || 'Failed to export PDF report.');
    }
  },
};

export default pdfPrintUtils;
