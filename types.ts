
export interface BoundingBox {
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
}

export interface DetectedProduct {
  id: string;
  name: string;
  category: string;
  confidence: number;
  box: BoundingBox;
  shoppingLink: string;
}

export interface DetectionResponse {
  products: DetectedProduct[];
}
