import html2canvas from "html2canvas"
import { jsPDF } from "jspdf"

// Export element as PNG
export async function exportAsPng(elementId: string, fileName = "export"): Promise<string> {
  try {
    const element = document.getElementById(elementId)
    if (!element) throw new Error("Element not found")

    const canvas = await html2canvas(element, {
      scale: 2, // Higher scale for better quality
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
    })

    const dataUrl = canvas.toDataURL("image/png")

    // Create download link
    const link = document.createElement("a")
    link.href = dataUrl
    link.download = `${fileName}.png`
    link.click()

    return dataUrl
  } catch (error) {
    console.error("Error exporting as PNG:", error)
    throw error
  }
}

// Export element as PDF
export async function exportAsPdf(elementId: string, fileName = "export"): Promise<string> {
  try {
    const element = document.getElementById(elementId)
    if (!element) throw new Error("Element not found")

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
    })

    const imgData = canvas.toDataURL("image/png")

    // Calculate PDF dimensions
    const imgWidth = 210 // A4 width in mm
    const pageHeight = 297 // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    const pdf = new jsPDF("p", "mm", "a4")

    // Add image to PDF
    pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight)

    // If image height is greater than page height, add more pages
    let heightLeft = imgHeight
    let position = 0

    while (heightLeft > pageHeight) {
      position = heightLeft - pageHeight
      pdf.addPage()
      pdf.addImage(imgData, "PNG", 0, -position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }

    // Save PDF
    pdf.save(`${fileName}.pdf`)

    return imgData
  } catch (error) {
    console.error("Error exporting as PDF:", error)
    throw error
  }
}

// Export HTML content as PDF
export async function exportHtmlAsPdf(htmlContent: string, fileName = "export"): Promise<void> {
  try {
    // Create temporary div
    const tempDiv = document.createElement("div")
    tempDiv.innerHTML = htmlContent
    tempDiv.style.position = "absolute"
    tempDiv.style.left = "-9999px"
    tempDiv.style.top = "-9999px"
    tempDiv.id = "temp-export-div"

    // Add to document
    document.body.appendChild(tempDiv)

    // Export as PDF
    await exportAsPdf("temp-export-div", fileName)

    // Remove temporary div
    document.body.removeChild(tempDiv)
  } catch (error) {
    console.error("Error exporting HTML as PDF:", error)
    throw error
  }
}

// Export data as JSON file
export function exportAsJson(data: any, fileName = "export"): void {
  try {
    const jsonString = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonString], { type: "application/json" })
    const url = URL.createObjectURL(blob)

    const link = document.createElement("a")
    link.href = url
    link.download = `${fileName}.json`
    link.click()

    URL.revokeObjectURL(url)
  } catch (error) {
    console.error("Error exporting as JSON:", error)
    throw error
  }
}

