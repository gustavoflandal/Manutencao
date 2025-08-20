const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const logger = require('../config/logger');

/**
 * Serviço base para geração de relatórios
 * Suporta exportação em PDF, Excel e JSON
 */
class ReportService {

  /**
   * Gera relatório em Excel
   */
  static async generateExcel(data, config) {
    const { title, headers, fileName, worksheetName = 'Dados' } = config;
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(worksheetName);

    // Metadados
    workbook.creator = 'Sistema de Manutenção';
    workbook.lastModifiedBy = 'Sistema de Manutenção';
    workbook.created = new Date();

    // Título do relatório
    if (title) {
      worksheet.mergeCells('A1', `${String.fromCharCode(65 + headers.length - 1)}1`);
      const titleCell = worksheet.getCell('A1');
      titleCell.value = title;
      titleCell.font = { size: 16, bold: true, color: { argb: 'FF1F497D' } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE7F0FD' }
      };

      // Data de geração
      worksheet.mergeCells('A2', `${String.fromCharCode(65 + headers.length - 1)}2`);
      const dateCell = worksheet.getCell('A2');
      dateCell.value = `Gerado em: ${new Date().toLocaleString('pt-BR')}`;
      dateCell.font = { size: 10, italic: true };
      dateCell.alignment = { horizontal: 'center' };
    }

    // Cabeçalhos
    const headerRow = worksheet.getRow(title ? 4 : 1);
    headers.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = header.label;
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // Dados
    data.forEach((row, rowIndex) => {
      const dataRow = worksheet.getRow((title ? 5 : 2) + rowIndex);
      headers.forEach((header, colIndex) => {
        const cell = dataRow.getCell(colIndex + 1);
        const value = this.getNestedValue(row, header.key);
        
        // Formatação baseada no tipo
        if (header.type === 'date' && value) {
          cell.value = new Date(value);
          cell.numFmt = 'dd/mm/yyyy';
        } else if (header.type === 'datetime' && value) {
          cell.value = new Date(value);
          cell.numFmt = 'dd/mm/yyyy hh:mm';
        } else if (header.type === 'currency' && value !== null) {
          cell.value = parseFloat(value) || 0;
          cell.numFmt = 'R$ #,##0.00';
        } else if (header.type === 'number' && value !== null) {
          cell.value = parseFloat(value) || 0;
          cell.numFmt = '#,##0.00';
        } else if (header.type === 'percentage' && value !== null) {
          cell.value = parseFloat(value) / 100 || 0;
          cell.numFmt = '0.00%';
        } else {
          cell.value = value || '';
        }

        // Bordas
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };

        // Zebra striping
        if ((rowIndex + 1) % 2 === 0) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF2F2F2' }
          };
        }
      });
    });

    // Auto-ajustar colunas
    worksheet.columns.forEach((column, index) => {
      let maxLength = headers[index]?.label?.length || 10;
      
      data.forEach(row => {
        const value = this.getNestedValue(row, headers[index]?.key);
        const length = String(value || '').length;
        if (length > maxLength) {
          maxLength = length;
        }
      });
      
      column.width = Math.min(Math.max(maxLength + 2, 10), 50);
    });

    // Adicionar totais se especificado
    if (config.totals && data.length > 0) {
      const totalRow = worksheet.getRow((title ? 5 : 2) + data.length + 1);
      
      headers.forEach((header, colIndex) => {
        const cell = totalRow.getCell(colIndex + 1);
        
        if (header.total === 'sum') {
          const sum = data.reduce((acc, row) => {
            const value = parseFloat(this.getNestedValue(row, header.key)) || 0;
            return acc + value;
          }, 0);
          
          if (header.type === 'currency') {
            cell.value = sum;
            cell.numFmt = 'R$ #,##0.00';
          } else {
            cell.value = sum;
            cell.numFmt = '#,##0.00';
          }
        } else if (header.total === 'count') {
          cell.value = data.length;
        } else if (header.total === 'avg') {
          const sum = data.reduce((acc, row) => {
            const value = parseFloat(this.getNestedValue(row, header.key)) || 0;
            return acc + value;
          }, 0);
          cell.value = sum / data.length;
          cell.numFmt = '#,##0.00';
        } else if (colIndex === 0) {
          cell.value = 'TOTAL:';
        }
        
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFDDD9C4' }
        };
        cell.border = {
          top: { style: 'medium' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    }

    // Gerar buffer
    const buffer = await workbook.xlsx.writeBuffer();
    
    return {
      buffer,
      fileName: fileName || `relatorio_${Date.now()}.xlsx`,
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };
  }

  /**
   * Gera relatório em PDF
   */
  static async generatePDF(data, config) {
    const { title, headers, fileName, orientation = 'portrait' } = config;
    
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ 
          size: 'A4', 
          layout: orientation,
          margin: 50,
          info: {
            Title: title,
            Author: 'Sistema de Manutenção',
            Creator: 'Sistema de Manutenção',
            CreationDate: new Date()
          }
        });

        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => {
          const buffer = Buffer.concat(chunks);
          resolve({
            buffer,
            fileName: fileName || `relatorio_${Date.now()}.pdf`,
            contentType: 'application/pdf'
          });
        });

        // Título
        if (title) {
          doc.fontSize(18)
             .font('Helvetica-Bold')
             .fillColor('#1F497D')
             .text(title, 50, 50, { align: 'center' });

          doc.fontSize(10)
             .font('Helvetica')
             .fillColor('#666666')
             .text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 50, 80, { align: 'center' });
        }

        // Calcular larguras das colunas
        const pageWidth = orientation === 'landscape' ? 792 : 595;
        const margin = 100;
        const tableWidth = pageWidth - margin;
        const colWidth = tableWidth / headers.length;

        let yPosition = title ? 120 : 50;

        // Cabeçalhos
        doc.fontSize(10)
           .font('Helvetica-Bold')
           .fillColor('#FFFFFF');

        // Fundo dos cabeçalhos
        doc.rect(50, yPosition, tableWidth, 25)
           .fillAndStroke('#4472C4', '#4472C4');

        // Texto dos cabeçalhos
        headers.forEach((header, index) => {
          const xPos = 50 + (index * colWidth);
          doc.text(header.label, xPos + 5, yPosition + 8, {
            width: colWidth - 10,
            ellipsis: true
          });
        });

        yPosition += 25;

        // Dados
        doc.font('Helvetica')
           .fontSize(9)
           .fillColor('#000000');

        data.forEach((row, rowIndex) => {
          // Verificar se precisa de nova página
          if (yPosition > (orientation === 'landscape' ? 500 : 700)) {
            doc.addPage();
            yPosition = 50;
          }

          // Fundo zebrado
          if (rowIndex % 2 === 0) {
            doc.rect(50, yPosition, tableWidth, 20)
               .fillAndStroke('#F9F9F9', '#F9F9F9');
          }

          // Dados da linha
          headers.forEach((header, colIndex) => {
            const xPos = 50 + (colIndex * colWidth);
            let value = this.getNestedValue(row, header.key);

            // Formatação baseada no tipo
            if (header.type === 'date' && value) {
              value = new Date(value).toLocaleDateString('pt-BR');
            } else if (header.type === 'datetime' && value) {
              value = new Date(value).toLocaleString('pt-BR');
            } else if (header.type === 'currency' && value !== null) {
              value = new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(parseFloat(value) || 0);
            } else if (header.type === 'number' && value !== null) {
              value = new Intl.NumberFormat('pt-BR').format(parseFloat(value) || 0);
            } else if (header.type === 'percentage' && value !== null) {
              value = new Intl.NumberFormat('pt-BR', {
                style: 'percent',
                minimumFractionDigits: 2
              }).format(parseFloat(value) / 100 || 0);
            }

            doc.fillColor('#000000')
               .text(String(value || ''), xPos + 5, yPosition + 5, {
                 width: colWidth - 10,
                 ellipsis: true
               });
          });

          yPosition += 20;
        });

        // Rodapé
        const pageHeight = orientation === 'landscape' ? 612 : 842;
        doc.fontSize(8)
           .fillColor('#666666')
           .text(`Página ${doc.bufferedPageRange().count}`, 50, pageHeight - 30, { align: 'center' });

        doc.end();

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Gera dados para gráficos
   */
  static generateChartData(data, config) {
    const { type, groupBy, valueField, labelField } = config;

    switch (type) {
      case 'pie':
      case 'doughnut':
        return this.generatePieChartData(data, groupBy, valueField);
      
      case 'bar':
      case 'line':
        return this.generateBarChartData(data, groupBy, valueField, labelField);
      
      case 'timeline':
        return this.generateTimelineData(data, groupBy, valueField);
      
      default:
        return { labels: [], datasets: [] };
    }
  }

  /**
   * Gera dados para gráfico de pizza
   */
  static generatePieChartData(data, groupBy, valueField) {
    const grouped = {};
    
    data.forEach(item => {
      const key = this.getNestedValue(item, groupBy) || 'Sem categoria';
      const value = parseFloat(this.getNestedValue(item, valueField)) || 1;
      
      grouped[key] = (grouped[key] || 0) + value;
    });

    const labels = Object.keys(grouped);
    const values = Object.values(grouped);

    return {
      labels,
      datasets: [{
        data: values,
        backgroundColor: this.generateColors(labels.length),
        borderWidth: 1
      }]
    };
  }

  /**
   * Gera dados para gráfico de barras/linhas
   */
  static generateBarChartData(data, groupBy, valueField, labelField) {
    const grouped = {};
    
    data.forEach(item => {
      const key = this.getNestedValue(item, groupBy) || 'Sem categoria';
      const value = parseFloat(this.getNestedValue(item, valueField)) || 0;
      
      if (!grouped[key]) {
        grouped[key] = { total: 0, count: 0 };
      }
      
      grouped[key].total += value;
      grouped[key].count += 1;
    });

    const labels = Object.keys(grouped);
    const values = Object.values(grouped).map(g => g.total);

    return {
      labels,
      datasets: [{
        label: labelField || 'Valor',
        data: values,
        backgroundColor: this.generateColors(labels.length, 0.8),
        borderColor: this.generateColors(labels.length, 1),
        borderWidth: 1
      }]
    };
  }

  /**
   * Gera dados para timeline
   */
  static generateTimelineData(data, dateField, valueField) {
    const grouped = {};
    
    data.forEach(item => {
      const date = new Date(this.getNestedValue(item, dateField));
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const value = parseFloat(this.getNestedValue(item, valueField)) || 1;
      
      grouped[key] = (grouped[key] || 0) + value;
    });

    const sortedKeys = Object.keys(grouped).sort();
    const labels = sortedKeys.map(key => {
      const [year, month] = key.split('-');
      return `${month}/${year}`;
    });
    const values = sortedKeys.map(key => grouped[key]);

    return {
      labels,
      datasets: [{
        label: 'Evolução',
        data: values,
        borderColor: '#4472C4',
        backgroundColor: 'rgba(68, 114, 196, 0.1)',
        tension: 0.1,
        fill: true
      }]
    };
  }

  /**
   * Gera paleta de cores
   */
  static generateColors(count, alpha = 1) {
    const baseColors = [
      `rgba(68, 114, 196, ${alpha})`,   // Azul
      `rgba(112, 173, 71, ${alpha})`,   // Verde
      `rgba(255, 192, 0, ${alpha})`,    // Amarelo
      `rgba(255, 99, 132, ${alpha})`,   // Vermelho
      `rgba(153, 102, 255, ${alpha})`,  // Roxo
      `rgba(255, 159, 64, ${alpha})`,   // Laranja
      `rgba(75, 192, 192, ${alpha})`,   // Verde água
      `rgba(201, 203, 207, ${alpha})`   // Cinza
    ];

    const colors = [];
    for (let i = 0; i < count; i++) {
      colors.push(baseColors[i % baseColors.length]);
    }

    return colors;
  }

  /**
   * Obtém valor aninhado de objeto
   */
  static getNestedValue(obj, key) {
    return key.split('.').reduce((o, k) => (o && o[k] !== undefined) ? o[k] : null, obj);
  }

  /**
   * Formata período para exibição
   */
  static formatPeriod(startDate, endDate) {
    const start = new Date(startDate).toLocaleDateString('pt-BR');
    const end = new Date(endDate).toLocaleDateString('pt-BR');
    return `${start} a ${end}`;
  }

  /**
   * Calcula estatísticas básicas
   */
  static calculateStats(data, valueField) {
    if (!data.length) return { count: 0, sum: 0, avg: 0, min: 0, max: 0 };

    const values = data.map(item => parseFloat(this.getNestedValue(item, valueField)) || 0);
    
    return {
      count: values.length,
      sum: values.reduce((a, b) => a + b, 0),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values)
    };
  }
}

module.exports = ReportService;