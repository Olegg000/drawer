import React, { ReactNode } from "react";

export function Card({children,className =''}: {children: ReactNode,className?: string}) {
    return (<div className={`rounted-2xl shadow-lg bg-white ${className}`}>
        {children}
    </div>)
}