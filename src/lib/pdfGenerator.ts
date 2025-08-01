import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { AssessmentResults } from '@/components/ResultsPage';

export const generatePDFReport = async (results: AssessmentResults): Promise<void> => {
  try {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Helper function to add a new page with header
    const addPageWithHeader = (title: string) => {
      pdf.addPage();
      // Add header line
      pdf.setFillColor(59, 130, 246);
      pdf.rect(0, 0, pageWidth, 15, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(title, pageWidth / 2, 10, { align: 'center' });
      pdf.setTextColor(0, 0, 0);
      return 25; // Starting Y position
    };

    // Capture charts as images
    const captureChart = async (selector: string): Promise<string | null> => {
      try {
        const element = document.querySelector(selector);
        if (!element) return null;
        
        const canvas = await html2canvas(element as HTMLElement, {
          backgroundColor: '#ffffff',
          scale: 2,
          useCORS: true,
        });
        return canvas.toDataURL('image/png');
      } catch (error) {
        console.warn(`Failed to capture chart ${selector}:`, error);
        return null;
      }
    };

    // Try to capture all charts
    const [pieChartImg, barChartImg, radarChartImg, spiralChartImg] = await Promise.all([
      captureChart('.recharts-wrapper'),
      captureChart('[data-chart="bar"]'),
      captureChart('[data-chart="radar"]'),
      captureChart('[data-chart="spiral"]')
    ]);

    // PAGE 1: Cover Page
    // Add header background
    pdf.setFillColor(59, 130, 246);
    pdf.rect(0, 0, pageWidth, 50, 'F');
    
    // Add title
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Personal Assessment Report', pageWidth / 2, 25, { align: 'center' });
    pdf.text(results.questionnaireName || 'Assessment', pageWidth / 2, 40, { align: 'center' });
    
    // Reset color
    pdf.setTextColor(0, 0, 0);
    
    // Add user info box
    pdf.setFillColor(245, 245, 245);
    pdf.rect(20, 70, pageWidth - 40, 45, 'F');
    pdf.setDrawColor(200, 200, 200);
    pdf.rect(20, 70, pageWidth - 40, 45, 'S');
    
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Assessment Details', 25, 85);
    
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Name: ${results.userInfo.name}`, 25, 98);
    pdf.text(`Email: ${results.userInfo.email}`, 25, 106);
    pdf.text(`Date: ${results.userInfo.date}`, 25, 114);
    
    // Add overall score section
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Overall Performance', pageWidth / 2, 140, { align: 'center' });
    
    // Large score circle
    const centerX = pageWidth / 2;
    const centerY = 170;
    const radius = 25;
    
    // Background circle
    pdf.setFillColor(240, 240, 240);
    pdf.circle(centerX, centerY, radius, 'F');
    
    // Score circle based on performance
    let scoreColor: [number, number, number] = [59, 130, 246]; // Default blue
    if (results.overallScore >= 75) scoreColor = [34, 197, 94]; // Green
    else if (results.overallScore >= 50) scoreColor = [249, 115, 22]; // Orange
    else scoreColor = [239, 68, 68]; // Red
    
    pdf.setFillColor(...scoreColor);
    pdf.circle(centerX, centerY, radius * 0.9, 'F');
    
    // Score text
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${results.overallScore}%`, centerX, centerY + 3, { align: 'center' });
    
    // Performance level
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(12);
    const performanceLevel = results.overallScore >= 75 ? "Excellent" : results.overallScore >= 50 ? "Good" : "Needs Improvement";
    pdf.text(performanceLevel, centerX, centerY + 35, { align: 'center' });
    
    // Add summary box  
    pdf.setFillColor(249, 250, 251);
    pdf.rect(20, 225, pageWidth - 40, 40, 'F');
    pdf.setDrawColor(229, 231, 235);
    pdf.rect(20, 225, pageWidth - 40, 40, 'S');
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Assessment Summary', 25, 240);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const assessmentName = results.questionnaireName || 'assessment';
    const summaryText = `This comprehensive ${assessmentName.toLowerCase()} evaluates ${results.scores.length} key competencies. Your overall score of ${results.overallScore}% indicates ${performanceLevel.toLowerCase()} performance. The following pages provide detailed insights into each category, visual analysis, and personalized recommendations for growth.`;
    const splitSummary = pdf.splitTextToSize(summaryText, pageWidth - 50);
    pdf.text(splitSummary, 25, 250);

    // PAGE 2: Category Breakdown
    let yPos = addPageWithHeader('Category Breakdown & Detailed Analysis');
    
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Category Performance Breakdown', 20, yPos);
    yPos += 20;
    
    // Category details with enhanced styling
    results.scores.forEach((score, index) => {
      if (yPos > 240) {
        yPos = addPageWithHeader('Category Breakdown & Detailed Analysis (continued)');
      }
      
      // Category header with color accent
      const rgb = hexToRgb(score.color);
      if (rgb) {
        pdf.setFillColor(rgb.r, rgb.g, rgb.b);
        pdf.rect(20, yPos - 5, 3, 15, 'F');
      }
      
      pdf.setFontSize(13);
      pdf.setFont('helvetica', 'bold');
      pdf.text(score.category, 28, yPos + 3);
      
      // Score and level
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Score: ${score.score}/${score.maxScore}`, 28, yPos + 12);
      pdf.text(`Percentage: ${score.percentage}%`, 100, yPos + 12);
      pdf.text(`Level: ${score.level}`, 150, yPos + 12);
      
      // Enhanced progress bar
      const barY = yPos + 18;
      const barWidth = 150;
      const barHeight = 8;
      const fillWidth = (score.percentage / 100) * barWidth;
      
      // Background bar with border
      pdf.setFillColor(240, 240, 240);
      pdf.roundedRect(28, barY, barWidth, barHeight, 2, 2, 'F');
      pdf.setDrawColor(200, 200, 200);
      pdf.roundedRect(28, barY, barWidth, barHeight, 2, 2, 'S');
      
      // Fill bar
      if (rgb) {
        pdf.setFillColor(rgb.r, rgb.g, rgb.b);
        if (fillWidth > 0) {
          pdf.roundedRect(28, barY, fillWidth, barHeight, 2, 2, 'F');
        }
      }
      
      yPos += 35;
    });

    // PAGE 3: Visual Analysis (Charts)
    yPos = addPageWithHeader('Visual Analysis & Charts');
    
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Performance Visualization', 20, yPos);
    yPos += 15;
    
    // Add charts if captured
    const chartWidth = 80;
    const chartHeight = 60;
    const chartSpacing = 10;
    
    if (pieChartImg) {
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Overall Distribution', 20, yPos);
      pdf.addImage(pieChartImg, 'PNG', 20, yPos + 5, chartWidth, chartHeight);
    }
    
    if (barChartImg) {
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Score Comparison', 110, yPos);
      pdf.addImage(barChartImg, 'PNG', 110, yPos + 5, chartWidth, chartHeight);
    }
    
    yPos += chartHeight + 20;
    
    if (radarChartImg) {
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Pentagon Analysis', 20, yPos);
      pdf.addImage(radarChartImg, 'PNG', 20, yPos + 5, chartWidth, chartHeight);
    }
    
    if (spiralChartImg) {
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Growth Spiral', 110, yPos);
      pdf.addImage(spiralChartImg, 'PNG', 110, yPos + 5, chartWidth, chartHeight);
    }

    // PAGE 4+: Reflection Questions
    yPos = addPageWithHeader('Self-Reflection Questions & Development Guide');
    
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Personal Development Questions', 20, yPos);
    yPos += 10;
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Take time to reflect on these questions to deepen your self-awareness and plan your development journey.', 20, yPos);
    yPos += 20;
    
    const reflectionQuestions = {
      "Social Skills": [
        "How do you typically respond when someone disagrees with you?",
        "What communication style works best for you in different situations?",
        "How do you build rapport with new people?"
      ],
      "Self Awareness": [
        "What emotions do you find most challenging to manage?",
        "How do your values influence your daily decisions?",
        "What patterns do you notice in your stress responses?"
      ],
      "Motivating Self": [
        "What internal factors drive your motivation?",
        "How do you maintain focus when facing obstacles?",
        "What goals energize you the most?"
      ],
      "Empathy": [
        "How do you recognize emotional cues in others?",
        "What helps you understand different perspectives?",
        "How do you respond when someone is upset?"
      ],
      "Self Regulation": [
        "What strategies help you manage strong emotions?",
        "How do you handle pressure in challenging situations?",
        "What techniques help you stay calm and focused?"
      ]
    };
    
    results.scores.forEach((score) => {
      if (yPos > 240) {
        yPos = addPageWithHeader('Self-Reflection Questions (continued)');
      }
      
      // Category with color accent
      const rgb = hexToRgb(score.color);
      if (rgb) {
        pdf.setFillColor(rgb.r, rgb.g, rgb.b);
        pdf.rect(20, yPos - 3, 3, 12, 'F');
      }
      
      pdf.setFontSize(13);
      pdf.setFont('helvetica', 'bold');
      pdf.text(score.category, 28, yPos + 3);
      yPos += 15;
      
      const questions = reflectionQuestions[score.category as keyof typeof reflectionQuestions] || [];
      questions.forEach((question) => {
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        const lines = pdf.splitTextToSize(`• ${question}`, 160);
        pdf.text(lines, 30, yPos);
        yPos += lines.length * 4 + 3;
        
        if (yPos > 270) {
          yPos = addPageWithHeader('Self-Reflection Questions (continued)');
        }
      });
      
      yPos += 8;
    });
    
    // Add footer to all pages
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      
      // Footer background
      pdf.setFillColor(249, 250, 251);
      pdf.rect(0, pageHeight - 15, pageWidth, 15, 'F');
      
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Page ${i} of ${pageCount}`, pageWidth - 30, pageHeight - 8);
      pdf.text('Generated by Personal Assessment Platform', 20, pageHeight - 8);
      
      // Add generation timestamp on last page
      if (i === pageCount) {
        const timestamp = new Date().toLocaleString();
        pdf.text(`Generated on: ${timestamp}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
      }
    }
    
    // Download the PDF
    const fileName = `assessment-report-${results.userInfo.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF report');
  }
};

// Helper function to convert hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}