declare module "d3-org-chart" {
  export class OrgChart {
    constructor();

    // Configuración base
    container(selector: string | HTMLElement): this;
    data(data: any[]): this;
    render(): this;

    // Tamaños y márgenes
    nodeWidth(callback: (d?: any) => number): this;
    nodeHeight(callback: (d?: any) => number): this;
    childrenMargin(callback: (d?: any) => number): this;
    compactMarginBetween(callback: (d?: any) => number): this;
    compactMarginPair(callback: (d?: any) => number): this;

    // Contenido del nodo
    nodeContent(callback: (d: any) => string): this;

    // Controles de zoom y ajuste
    zoomIn(): this;
    zoomOut(): this;
    fit(duration?: number): this;

    // Expansión / colapso
    expandAll(): this;
    collapseAll(): this;

    // Orientación
    compact(compact: boolean): this;

    [key: string]: any;
  }
}
