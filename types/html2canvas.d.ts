declare module 'html2canvas' {
  type Html2CanvasOptions = {
    scale?: number
    useCORS?: boolean
    backgroundColor?: string | null
  }

  type Html2Canvas = (element: HTMLElement, options?: Html2CanvasOptions) => Promise<HTMLCanvasElement>

  const html2canvas: Html2Canvas
  export default html2canvas
}
