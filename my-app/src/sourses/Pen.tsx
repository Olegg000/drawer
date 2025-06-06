import React, {FC} from "react";
import {useTheme} from "styled-components";

const Pen: FC<React.SVGProps<any>> = (props) => {
    return <svg {...props} width="18px" height="18px" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M11 0L16 5L14 7V12L3 16L2.20711 15.2071L6.48196 10.9323C6.64718 10.9764 6.82084 11 7 11C8.10457 11 9 10.1046 9 9C9 7.89543 8.10457 7 7 7C5.89543 7 5 7.89543 5 9C5 9.17916 5.02356 9.35282 5.06774 9.51804L0.792893 13.7929L0 13L4 2H9L11 0Z"    />
    </svg>

}

export default Pen;