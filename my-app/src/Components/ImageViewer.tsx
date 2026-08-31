import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

type Constraints = {
    left: number;
    top: number;
    right: number;
    bottom: number;
};

interface ImageViewerProps {
    src: string;
    width: number;      // ширина контейнера в px
    height: number;     // высота контейнера в px
    imgScale?: number;  // коэффициент масштабирования
}

export const ImageViewer: React.FC<ImageViewerProps> = ({
                                                            src,
                                                            width,
                                                            height,
                                                            imgScale = 1,
                                                        }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [constraints, setConstraints] = useState<Constraints | null>(null);
    const [scaledDims, setScaledDims] = useState<{w: number; h: number} | null>(null);

    useEffect(() => {
        const img = new Image();
        img.onload = () => {
            // реальные размеры пикселей с учётом масштаба
            const realW = img.width * imgScale;
            const realH = img.height * imgScale;
            setScaledDims({ w: realW, h: realH });

            // constraints = контейнер минус реальную ширину/высоту картинки
            setConstraints({
                left:   Math.min(0, width  - realW),
                top:    Math.min(0, height - realH),
                right:  0,
                bottom: 0,
            });
        };
        img.src = src;
    }, [src, imgScale, width, height]);

    return (
        <div
            ref={containerRef}
            className="card-image-viewer"
            style={{ width, height }}
        >
            {constraints && scaledDims && (
                <motion.img
                    src={src}
                    className="card-image-inner"
                    drag
                    dragConstraints={constraints}
                    dragElastic={0}
                    dragMomentum={false}
                    style={{
                        width:  scaledDims.w,      // теперь в пикселях
                        height: scaledDims.h,      // корректная высота
                        transformOrigin: "top left",
                    }}
                    alt="preview"
                />
            )}
        </div>
    );
};
