import React, { ReactNode } from "react";

export function CardContent({children,className =''}: {children: ReactNode,className?: string}) {
    return (<div className={`p-6 ${className}`}>
        {children}
    </div>)
}