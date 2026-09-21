import PitchUtils from "./PitchUtils";
import {SQRT3} from "../constants"
import type { TonnetzNode, TriangleData } from "../type"; 




export class TonnetzGraph {
  nodes: TonnetzNode[];
  triangles: TriangleData[];
  private _nodeMap: Map<string, TonnetzNode>;

  constructor(rows:number, cols:number) {
    this.nodes     = TonnetzGraph._generateNodes(rows, cols);
    this.triangles = TonnetzGraph._buildTriangles(this.nodes);
    this._nodeMap  = TonnetzGraph._buildNodeMap(this.nodes);
  }

  static _generateNodes(rows:number, cols:number): TonnetzNode[]{
    return TonnetzGraph._generateNodesInRange(0, cols - 1, 0, rows - 1);
  }

  static _generateNodesInRange(qMin:number, qMax:number, rMin:number, rMax:number): TonnetzNode[] {
    const nodes: TonnetzNode[] = [];
    for (let r = rMin; r <= rMax; r++) {
      for (let q = qMin; q <= qMax; q++) {
        nodes.push({
          q, r,
          x: q + r * 0.5,
          y: r * (SQRT3 / 2),
          label: PitchUtils.getPitchAt(q, r, "C"),
        });
      }
    }
    return nodes;
  }

  static sliceRange(qMin:number, qMax:number, rMin:number, rMax:number): { nodes: TonnetzNode[]; triangles: TriangleData[] } {
    const nodes = TonnetzGraph._generateNodesInRange(qMin, qMax, rMin, rMax);
    const triangles = TonnetzGraph._buildTriangles(nodes);
    return { nodes, triangles };
  }

  static _buildNodeMap(nodes: TonnetzNode[]):Map<string, TonnetzNode> {
    const map = new Map<string, TonnetzNode>();
    nodes.forEach(n => map.set(`${n.q},${n.r}`, n));
    return map;
  }

  static _buildTriangles(nodes: TonnetzNode[]): TriangleData[] {
    const map = TonnetzGraph._buildNodeMap(nodes);
    const triangles: TriangleData[] = [];
    for (const node of nodes) {
      const b = map.get(`${node.q+1},${node.r}`);
      const c = map.get(`${node.q},${node.r+1}`);
      const d = map.get(`${node.q+1},${node.r-1}`);
      if (b && c) triangles.push({
        id: `maj-${node.q}-${node.r}`, type:"major",
        nodes:[node,b,c], chord:[node.label,b.label,c.label],
      });
      if (b && d) triangles.push({
        id: `min-${node.q}-${node.r}`, type:"minor",
        nodes:[node,b,d], chord:[node.label,b.label,d.label],
      });
    }
    return triangles;
  }

  getNodeByQR(q:number, r:number) : TonnetzNode | null  { return this._nodeMap.get(`${q},${r}`) ?? null; }
  getNodeIndex(q:number, r:number) :number  { return this.nodes.findIndex(n => n.q===q && n.r===r); }
}
