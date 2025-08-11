import 'jspdf'

declare module 'jspdf' {
  interface jsPDF {
    internal: {
      getNumberOfPages(): number
      pageSize: {
        getWidth(): number
        getHeight(): number
      }
    }
    lastAutoTable?: {
      finalY: number
    }
  }
}