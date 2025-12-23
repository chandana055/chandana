
import React from 'react';
import { DetectedProduct } from '../types';

interface DetectionOverlayProps {
  products: DetectedProduct[];
  isProcessing: boolean;
}

const DetectionOverlay: React.FC<DetectionOverlayProps> = ({ products, isProcessing }) => {
  if (isProcessing) {
    return (
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] pointer-events-none">
        <div className="flex space-x-2 mb-4">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
        <p className="text-white font-medium text-lg tracking-wider">ANALYZING FRAME...</p>
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <div className="absolute inset-0 z-10 pointer-events-none">
      {products.map((product) => (
        <React.Fragment key={product.id}>
          {/* Bounding Box */}
          <div
            className="absolute border-2 border-blue-400 rounded-sm bg-blue-400/10 shadow-[0_0_15px_rgba(96,165,250,0.5)] transition-all hover:border-white group pointer-events-auto cursor-pointer"
            style={{
              top: `${product.box.ymin / 10}%`,
              left: `${product.box.xmin / 10}%`,
              width: `${(product.box.xmax - product.box.xmin) / 10}%`,
              height: `${(product.box.ymax - product.box.ymin) / 10}%`,
            }}
            onClick={() => window.open(product.shoppingLink, '_blank')}
          >
            {/* Tooltip on Box */}
            <div className="absolute -top-10 left-0 bg-blue-600 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
              <i className="fas fa-shopping-cart"></i>
              {product.name}
            </div>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
};

export default DetectionOverlay;
