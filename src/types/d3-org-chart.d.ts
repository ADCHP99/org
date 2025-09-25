declare module "d3-org-chart" {
  export default class OrgChart {
    constructor();
    container(selector: string | HTMLElement): this;
    data(data: any[]): this;
    nodeWidth(callback: (d?: any) => number): this;
    nodeHeight(callback: (d?: any) => number): this;
    childrenMargin(callback: (d?: any) => number): this;
    compactMarginBetween(callback: (d?: any) => number): this;
    compactMarginPair(callback: (d?: any) => number): this;
    render(): this;
    // puedes ir agregando métodos según los uses
  }
}
